/**
 * Global settings tab.
 *
 * Every input validates before touching state; unknown dropdown values are
 * ignored instead of persisted.
 */

import { PluginSettingTab, Setting } from 'obsidian';
import { type App } from 'obsidian';
import {
  LINK_TYPES,
  isLinkType,
  type AutoLinkerSettings,
  type LinkType,
} from './types';
// Type-only: avoids a runtime circular dependency with the entry point.
import type BetterAutoLinkerPlugin from './main';

/** Human labels for the link syntax dropdown. */
const LINK_TYPE_LABELS: Record<LinkType, string> = {
  wikilink: 'Wikilink (with alias)',
  'simple-wikilink': 'Simple wikilink',
  markdown: 'Markdown link',
};

/** Settings tab listing every option plus inline documentation. */
export class AutoLinkerSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: BetterAutoLinkerPlugin
  ) {
    super(app, plugin);
  }

  override display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Better Auto Linker Settings' });

    this.addLinkTypeSetting();
    this.addPreserveCaseSetting();
    this.addIgnoreAccentsSetting();
    this.addSkipSelfReferencesSetting();
    this.addExcludedFoldersSetting();

    containerEl.createEl('hr');
    this.renderDocumentation();
  }

  // ------------------------------------------------------------------
  // Individual settings
  // ------------------------------------------------------------------

  private persistSettings(settings: AutoLinkerSettings): void {
    this.plugin.settings = settings;
    void this.plugin.saveSettings();
  }

  private addLinkTypeSetting(): void {
    new Setting(this.containerEl)
      .setName('Link Type')
      .setDesc('Syntax used for created links.')
      .addDropdown((dropdown) => {
        for (const linkType of LINK_TYPES) {
          dropdown.addOption(linkType, LINK_TYPE_LABELS[linkType]);
        }
        return dropdown
          .setValue(this.plugin.settings.linkType)
          .onChange((value) => {
            if (!isLinkType(value)) {
              return;
            }
            this.persistSettings({
              ...this.plugin.settings,
              linkType: value,
            });
          });
      });
  }

  private addPreserveCaseSetting(): void {
    new Setting(this.containerEl)
      .setName('Preserve Original Case')
      .setDesc(
        'Keep the casing found in your text ([[Title|oRiginal]] / [oRiginal](…)). Ignored by simple wikilinks.'
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.preserveCase).onChange((value) => {
          this.persistSettings({
            ...this.plugin.settings,
            preserveCase: value,
          });
        })
      );
  }

  private addIgnoreAccentsSetting(): void {
    new Setting(this.containerEl)
      .setName('Ignore Accents When Matching')
      .setDesc(
        "If enabled, 'cafe' in your text can link to a note titled 'Café'."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.ignoreAccents)
          .onChange((value) => {
            this.persistSettings({
              ...this.plugin.settings,
              ignoreAccents: value,
            });
          })
      );
  }

  private addSkipSelfReferencesSetting(): void {
    new Setting(this.containerEl)
      .setName('Skip Self-references')
      .setDesc('Never link a note title inside the note itself.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.skipSelfReferences)
          .onChange((value) => {
            this.persistSettings({
              ...this.plugin.settings,
              skipSelfReferences: value,
            });
          })
      );
  }

  private addExcludedFoldersSetting(): void {
    new Setting(this.containerEl)
      .setName('Excluded Folders')
      .setDesc('Folder paths whose notes are never processed, one per line.')
      .addTextArea((text) =>
        text
          .setPlaceholder('Archive\nTemplates/Subfolder')
          .setValue(this.plugin.settings.excludedFolders.join('\n'))
          .onChange((value) => {
            const folders = value
              .split('\n')
              .map((folder) => folder.trim())
              .filter((folder) => folder !== '');
            this.persistSettings({
              ...this.plugin.settings,
              excludedFolders: folders,
            });
          })
      );
  }

  // ------------------------------------------------------------------
  // Inline documentation
  // ------------------------------------------------------------------

  private renderDocumentation(): void {
    const { containerEl } = this;

    containerEl.createEl('h2', { text: 'What gets protected' });
    containerEl.createEl('p', {
      text: 'The auto-linker never touches:',
    });

    const protections = [
      'YAML frontmatter (preserved verbatim).',
      'Fenced code blocks (``` or ~~~) and inline `code`.',
      'Existing wikilinks, embeds and markdown links/images.',
      '$$math$$ blocks and HTML comments.',
      "A note's own title (when Skip Self-references is enabled).",
    ];
    containerEl.createEl('ul', {}, (list) => {
      for (const item of protections) {
        list.createEl('li', { text: item });
      }
    });

    containerEl.createEl('h3', { text: 'Matching rules' });
    const rules = [
      'Longest titles win when several titles overlap.',
      'Matching is case-insensitive (and accent-insensitive when enabled).',
      'Adjacent punctuation stays outside the created link.',
      'Whole words only: a title is never linked inside a longer word.',
    ];
    containerEl.createEl('ul', {}, (list) => {
      for (const item of rules) {
        list.createEl('li', { text: item });
      }
    });
  }
}
