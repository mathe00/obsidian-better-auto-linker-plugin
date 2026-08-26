/**
 * Shared domain types for the Better Auto Linker plugin.
 * Everything here is plain data - no Obsidian or DOM imports - so it can be
 * unit tested in isolation.
 */

/** Link syntaxes a matched title can be converted into. */
export type LinkType = 'wikilink' | 'simple-wikilink' | 'markdown';

/** All values are valid members of {@link LinkType}. */
export const LINK_TYPES: readonly LinkType[] = [
  'wikilink',
  'simple-wikilink',
  'markdown',
];

/** Type guard narrowing an arbitrary string to a {@link LinkType}. */
export function isLinkType(value: string): value is LinkType {
  return (LINK_TYPES as readonly string[]).includes(value);
}

/** Global plugin settings, persisted by Obsidian in `data.json`. */
export interface AutoLinkerSettings {
  /**
   * Syntax used for created links:
   * - `wikilink`: `[[Title|matched text]]` (falls back to `[[Title]]` when
   *   the alias would be identical).
   * - `simple-wikilink`: always `[[Title]]`.
   * - `markdown`: `[matched text](encoded/path.md)`.
   */
  linkType: LinkType;
  /** Keep the casing of the text as found in the note (alias / label). */
  preserveCase: boolean;
  /** Match titles regardless of accents (`cafe` links to "Café"). */
  ignoreAccents: boolean;
  /** Never link a note's own title inside itself. */
  skipSelfReferences: boolean;
  /** Notes under these vault-relative folder prefixes are never touched. */
  excludedFolders: string[];
}

/** Factory returning fresh defaults so callers never share mutable state. */
export function createDefaultSettings(): AutoLinkerSettings {
  return {
    linkType: 'wikilink',
    preserveCase: true,
    ignoreAccents: true,
    skipSelfReferences: true,
    excludedFolders: [],
  };
}

/**
 * Rebuild validated settings from arbitrary persisted data (`data.json`).
 *
 * Unknown or malformed fields silently fall back to defaults, so a corrupted
 * file can never crash the plugin at startup. The legacy v1 plugin also
 * stored an `excludedFolders` string array; that key is reused as-is, which
 * migrates old installations for free.
 *
 * @param saved whatever `plugin.loadData()` returned
 */
export function normalizePluginSettings(saved: unknown): AutoLinkerSettings {
  const defaults = createDefaultSettings();
  if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) {
    return defaults;
  }

  const fields = new Map(Object.entries(saved as Record<string, unknown>));

  const booleanOr = (key: string, fallback: boolean): boolean => {
    const value = fields.get(key);
    return typeof value === 'boolean' ? value : fallback;
  };

  const linkTypeCandidate = fields.get('linkType');
  const foldersCandidate = fields.get('excludedFolders');

  return {
    linkType:
      typeof linkTypeCandidate === 'string' && isLinkType(linkTypeCandidate)
        ? linkTypeCandidate
        : defaults.linkType,
    preserveCase: booleanOr('preserveCase', defaults.preserveCase),
    ignoreAccents: booleanOr('ignoreAccents', defaults.ignoreAccents),
    skipSelfReferences: booleanOr(
      'skipSelfReferences',
      defaults.skipSelfReferences
    ),
    excludedFolders: Array.isArray(foldersCandidate)
      ? foldersCandidate
          .filter((item): item is string => typeof item === 'string')
          .map((folder) => folder.trim())
          .filter((folder) => folder !== '')
      : defaults.excludedFolders,
  };
}
