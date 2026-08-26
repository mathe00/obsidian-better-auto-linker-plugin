/**
 * Low-level text helpers shared by the matching pipeline.
 * Pure functions only - no Obsidian or DOM imports.
 */

/**
 * Escapes all regular-expression metacharacters so an arbitrary string
 * (e.g. a note title containing `(v2)`) can be embedded in a pattern.
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Result of splitting a note into its YAML frontmatter and body. */
export interface FrontmatterSplit {
  /**
   * Frontmatter block **including** the opening and closing `---` fences and
   * their trailing newline. Empty string when the note has no frontmatter.
   */
  readonly frontmatter: string;
  /** Everything after the frontmatter (or the whole text when none). */
  readonly body: string;
}

/**
 * Splits a leading YAML frontmatter block off the content.
 *
 * A block only counts when the very first line is exactly `---` (trailing
 * whitespace tolerated) and a matching closing fence appears later on its own
 * line. Unterminated blocks are treated as plain content, mirroring how
 * Obsidian renders them.
 */
export function splitFrontmatter(content: string): FrontmatterSplit {
  // Reject immediately unless the file starts with an opening fence line.
  if (!/^---[ \t]*(?:\r?\n|$)/.test(content)) {
    return { frontmatter: '', body: content };
  }

  let offset = content.indexOf('\n');
  offset = offset === -1 ? content.length : offset + 1;

  while (offset < content.length) {
    let end = content.indexOf('\n', offset);
    if (end === -1) {
      end = content.length;
    }
    const line = content.slice(offset, end).replace(/[ \t\r]+$/u, '');
    const nextOffset = end + 1;

    if (line === '---') {
      return {
        // Include the closing fence and its newline in the preserved block.
        frontmatter: content.slice(0, Math.min(nextOffset, content.length)),
        body: content.slice(Math.min(nextOffset, content.length)),
      };
    }
    offset = nextOffset;
  }

  // No closing fence found: not valid frontmatter after all.
  return { frontmatter: '', body: content };
}

/** Accent-stripped text plus the mapping needed to get indices back. */
export interface NormalizedText {
  /** Text with diacritics removed (length <= original length). */
  readonly text: string;
  /**
   * `map[i]` is the index in the **original** text of the character that
   * produced normalized character `i`. This is what allows matches found in
   * the normalized text to be applied to the original text with byte-perfect
   * precision - something the Python predecessor got subtly wrong because
   * NFD decomposition shifts offsets.
   */
  readonly map: number[];
}

const COMBINING_MARK = /\p{M}/u;

/**
 * Removes diacritics while keeping an index map back to the source text.
 *
 * Each code point is NFD-decomposed and its combining marks dropped. Every
 * UTF-16 slot of the result points back at its source code point's start
 * offset (`map.length === text.length`), so ranges never tear surrogate
 * pairs apart and regex offsets translate losslessly - something the Python
 * predecessor got subtly wrong because NFD decomposition shifts offsets.
 */
export function stripAccentsWithMap(text: string): NormalizedText {
  const outChars: string[] = [];
  const map: number[] = [];
  let index = 0;

  for (const ch of text) {
    const originalIndex = index;
    index += ch.length;

    if (ch < '\x80') {
      // ASCII fast path: no decomposition possible.
      outChars.push(ch);
      map.push(originalIndex);
      continue;
    }

    for (const part of ch.normalize('NFD')) {
      if (COMBINING_MARK.test(part)) {
        continue;
      }
      outChars.push(part);
      map.push(originalIndex);
      if (part.length === 2) {
        // Astral plane character: occupy a second UTF-16 slot so that map
        // stays aligned with UTF-16 string indices (not array positions).
        map.push(originalIndex);
      }
    }
  }

  return { text: outChars.join(''), map };
}
