/**
 * Orchestrator tying the pipeline together for one note.
 * Pure functions only - no Obsidian or DOM imports - so the full behavior is
 * unit-testable without mocks.
 */

import { splitFrontmatter } from './text';
import { findTitleMatches } from './matcher';
import { buildLink } from './link-builder';
import type { AutoLinkerSettings } from '../types';

/** One indexed note: basename without extension plus vault-relative path. */
export interface NoteIndexEntry {
  readonly title: string;
  readonly path: string;
}

/** Arguments of {@link processNoteContent}. */
export interface ProcessNoteArgs {
  /** Full raw content of the note (frontmatter included). */
  readonly content: string;
  /** Index of candidate notes (title → path). */
  readonly entries: readonly NoteIndexEntry[];
  /** Active plugin settings. */
  readonly settings: AutoLinkerSettings;
  /** Basename of the processed note (enables self-reference skipping). */
  readonly selfTitle?: string | undefined;
}

/** Result of processing one note. */
export interface ProcessNoteResult {
  /** New content to persist (identical input when nothing changed). */
  readonly content: string;
  /** Whether {@link ProcessNoteResult.content} differs from the input. */
  readonly changed: boolean;
  /** Number of links created. */
  readonly linksCreated: number;
}

/**
 * Rewrites plain-text title mentions into links.
 *
 * The frontmatter is preserved verbatim; only the body is rewritten.
 * When several notes share the same basename, the shallowest
 * alphabetically-first path wins (the entries array is expected pre-sorted
 * by path, e.g. produced by the plugin's index builder).
 */
export function processNoteContent(args: ProcessNoteArgs): ProcessNoteResult {
  const unchanged: ProcessNoteResult = {
    content: args.content,
    changed: false,
    linksCreated: 0,
  };

  const { frontmatter, body } = splitFrontmatter(args.content);

  const matches = findTitleMatches(
    body,
    new Set(args.entries.map((entry) => entry.title)),
    {
      ignoreAccents: args.settings.ignoreAccents,
      selfTitle: args.selfTitle,
      skipSelfReferences: args.settings.skipSelfReferences,
    }
  );
  if (matches.length === 0) {
    return unchanged;
  }

  // Deterministic title→path resolution: first entry wins.
  const titleToPath = new Map<string, string>();
  for (const entry of args.entries) {
    if (!titleToPath.has(entry.title)) {
      titleToPath.set(entry.title, entry.path);
    }
  }

  // Rebuild the body around the kept matches.
  const parts: string[] = [];
  let cursor = 0;
  for (const match of matches) {
    parts.push(body.slice(cursor, match.start));
    parts.push(buildLink(match, titleToPath.get(match.title), args.settings));
    cursor = match.end;
  }
  parts.push(body.slice(cursor));
  const newBody = parts.join('');

  const finalContent = frontmatter + newBody;
  if (finalContent === args.content) {
    return unchanged;
  }
  return {
    content: finalContent,
    changed: true,
    linksCreated: matches.length,
  };
}
