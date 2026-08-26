/**
 * Plugin entry point.
 *
 * Responsibilities are deliberately thin: load/validate settings, register
 * two commands and the settings tab. All matching logic lives in pure
 * modules under `lib/` and is unit-tested without mocks.
 */

import { MarkdownView, Modal, Notice, Plugin, TFile } from 'obsidian';
import { type App } from 'obsidian';
import { normalizePluginSettings } from './types';
import {
  processNoteContent,
  type NoteIndexEntry,
  type ProcessNoteResult,
} from './lib/auto-linker';
import { AutoLinkerSettingTab } from './settings';

/**
 * Better Auto Linker plugin.
 *
 * Turns plain-text mentions of note titles into links inside the active
 * note or across the whole vault, never touching code blocks, existing
 * links, math spans or frontmatter.
 */
export default class BetterAutoLinkerPlugin extends Plugin {
  /** Validated settings - always a complete object, never partial data. */
  override settings = normalizePluginSettings(undefined);

  override async onload(): Promise<void> {
    this.settings = normalizePluginSettings(await this.loadData());

    this.addCommand({
      id: 'auto-link-active-note',
      name: 'Auto-link active note',
      callback: () => {
        void this.runActiveNote();
      },
    });

    this.addCommand({
      id: 'auto-link-vault',
      name: 'Auto-link entire vault…',
      callback: () => {
        this.openVaultConfirmation();
      },
    });

    this.addSettingTab(new AutoLinkerSettingTab(this.app, this));
  }

  /**
   * Persist current settings to `data.json`.
   * Called by the settings tab after every validated change.
   */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /** Whether a vault path lives under one of the excluded folder prefixes. */
  private isExcluded(path: string): boolean {
    return this.settings.excludedFolders.some(
      (folder) => folder !== '' && path.startsWith(folder)
    );
  }

  /**
   * Builds the title index used for matching.
   *
   * Sorted by path so duplicate basenames resolve deterministically
   * (shallowest alphabetical path wins).
   */
  private buildIndex(): NoteIndexEntry[] {
    return this.app.vault
      .getMarkdownFiles()
      .filter((file) => !this.isExcluded(file.path))
      .map((file) => ({ title: file.basename, path: file.path }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Atomically rewrites one note through {@link Vault.process}.
   * Returns the processing result, or `null` when reading failed.
   */
  private async processFile(file: TFile): Promise<ProcessNoteResult | null> {
    const entries = this.buildIndex();
    try {
      let result: ProcessNoteResult | null = null;
      await this.app.vault.process(file, (data: string): string => {
        result = processNoteContent({
          content: data,
          entries,
          settings: this.settings,
          selfTitle: file.basename,
        });
        return result.content;
      });
      return result;
    } catch (error) {
      console.error(
        `[better-auto-linker] Failed to process ${file.path}:`,
        error
      );
      return null;
    }
  }

  /** Command handler: process the currently open markdown note. */
  private async runActiveNote(): Promise<void> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view === null || view.file === null) {
      new Notice('Open a note first.');
      return;
    }
    if (this.isExcluded(view.file.path)) {
      new Notice('This note is in an excluded folder.');
      return;
    }

    const result = await this.processFile(view.file);
    if (result === null) {
      new Notice('Auto Linker failed to read this note.');
    } else if (!result.changed) {
      new Notice('No new links found.');
    } else {
      new Notice(`${result.linksCreated} link(s) created.`);
    }
  }

  /** Opens the confirmation modal before any vault-wide rewrite. */
  private openVaultConfirmation(): void {
    const files = this.app.vault
      .getMarkdownFiles()
      .filter((file) => !this.isExcluded(file.path));

    if (files.length === 0) {
      new Notice('No eligible notes found in the vault.');
      return;
    }

    new VaultConfirmModal(this.app, files.length, () => {
      void this.runVault(files);
    }).open();
  }

  /** Processes every eligible note sequentially with a progress notice. */
  private async runVault(files: readonly TFile[]): Promise<void> {
    const progress = new Notice('Auto-linking vault…', 0);
    let totalLinks = 0;
    let touchedNotes = 0;
    let failures = 0;

    try {
      for (const [index, file] of files.entries()) {
        progress.setMessage(
          `Auto-linking vault… (${index + 1}/${files.length})`
        );
        const result = await this.processFile(file);
        if (result === null) {
          failures += 1;
        } else if (result.changed) {
          touchedNotes += 1;
          totalLinks += result.linksCreated;
        }
      }
    } finally {
      progress.hide();
    }

    const summary = `Auto-linked ${totalLinks} occurrence(s) in ${touchedNotes} note(s).`;
    new Notice(
      failures > 0 ? `${summary} ${failures} error(s), see console.` : summary
    );
  }
}

/** Simple confirm/cancel dialog guarding the destructive vault-wide run. */
class VaultConfirmModal extends Modal {
  constructor(
    app: App,
    private readonly noteCount: number,
    private readonly onConfirm: () => void
  ) {
    super(app);
  }

  override onOpen(): void {
    this.contentEl.createEl('h2', { text: 'Auto-link entire vault?' });
    this.contentEl.createEl('p', {
      text:
        `${this.noteCount} notes will be scanned and matching titles converted ` +
        'into links. Code blocks, existing links and frontmatter are never touched.',
    });
    this.contentEl.createEl('p', {
      text: 'You can undo per-file with Ctrl+Z while a note stays open.',
    });

    const buttons = this.contentEl.createDiv();
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'flex-end';
    buttons.style.gap = '8px';

    const cancel = buttons.createEl('button', { text: 'Cancel' });
    cancel.addEventListener('click', () => this.close());

    const confirm = buttons.createEl('button', {
      text: 'Run auto-linker',
      cls: 'mod-cta',
    });
    confirm.addEventListener('click', () => {
      this.close();
      this.onConfirm();
    });
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}
