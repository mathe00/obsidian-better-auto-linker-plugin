/**
 * Link construction from a matched title.
 * Pure functions only - no Obsidian or DOM imports.
 */

import type { TitleMatch } from './matcher';
import type { AutoLinkerSettings } from '../types';

/**
 * Percent-encodes a vault path for use inside a markdown link target.
 * `/` separators are preserved; everything unsafe (spaces, parentheses,
 * non-ASCII characters like `é`) is percent-encoded.
 */
export function encodeLinkTarget(path: string): string {
  return path
    .split('/')
    .map((segment) =>
      encodeURIComponent(segment).replace(
        /[!'()*]/gu,
        (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
      )
    )
    .join('/');
}

/**
 * Renders the replacement link for one match according to the settings:
 * - `simple-wikilink` → `[[Title]]`
 * - `wikilink` → `[[Title|alias]]`, collapsing to `[[Title]]` when the alias
 *   would be byte-identical to the title (no useless pipes).
 * - `markdown` → `[label](encoded target)`
 *
 * @param match the matched occurrence
 * @param targetPath vault-relative path of the note (with `.md`);
 *   `undefined` falls back to linking by bare title (markdown targets then
 *   use the title text, letting Obsidian resolve it).
 */
export function buildLink(
  match: TitleMatch,
  targetPath: string | undefined,
  settings: AutoLinkerSettings
): string {
  switch (settings.linkType) {
    case 'simple-wikilink':
      return `[[${match.title}]]`;
    case 'wikilink': {
      const alias = settings.preserveCase ? match.matchedText : match.title;
      return alias === match.title
        ? `[[${match.title}]]`
        : `[[${match.title}|${alias}]]`;
    }
    case 'markdown': {
      const label = settings.preserveCase ? match.matchedText : match.title;
      return `[${label}](${encodeLinkTarget(targetPath ?? match.title)})`;
    }
  }
}
