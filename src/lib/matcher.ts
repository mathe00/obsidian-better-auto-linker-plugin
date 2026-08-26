/**
 * Title matching engine.
 *
 * Finds note titles mentioned as plain text inside a markdown body, using
 * longest-first matching, Unicode-aware word boundaries and accent/case
 * insensitive comparison - the strategy proven by the Python V2 script,
 * hardened against its known weaknesses.
 * Pure functions only - no Obsidian or DOM imports.
 */

import { escapeRegExp, stripAccentsWithMap, type NormalizedText } from './text';
import { computeProtectedRanges, rangesIntersect } from './protected-ranges';

/** A confirmed title occurrence, positioned in the ORIGINAL text. */
export interface TitleMatch {
  /** Start offset in the original body (inclusive). */
  readonly start: number;
  /** End offset in the original body (exclusive). */
  readonly end: number;
  /** Canonical note title (correct case/accents) to link to. */
  readonly title: string;
  /** Exact text found in the document (original case/accents). */
  readonly matchedText: string;
}

/** Options controlling {@link findTitleMatches}. */
export interface MatchOptions {
  /** Compare against accent-stripped titles/text. */
  readonly ignoreAccents: boolean;
  /**
   * Basename of the note currently being processed; enables
   * self-reference skipping when {@link skipSelfReferences} is set.
   */
  readonly selfTitle?: string | undefined;
  /** Never link a note's own title inside itself. */
  readonly skipSelfReferences: boolean;
}

/**
 * Lowercase key used for self-reference comparison, accent-insensitive so a
 * note named "Café" does not link itself through a "cafe" mention either.
 */
function titleKey(title: string, ignoreAccents: boolean): string {
  const stripped = ignoreAccents ? stripAccentsWithMap(title).text : title;
  return stripped.toLowerCase();
}

/**
 * Builds the normalized search layer: either an accent-stripped copy of the
 * body with its index map, or an identity view when accents matter.
 */
function buildSearchLayer(
  body: string,
  ignoreAccents: boolean
): NormalizedText & { toOriginalEndExclusive(index: number): number } {
  if (!ignoreAccents) {
    return {
      text: body,
      map: [],
      toOriginalEndExclusive: (index: number): number => index,
    };
  }
  const normalized = stripAccentsWithMap(body);
  return {
    ...normalized,
    toOriginalEndExclusive: (index: number): number =>
      index >= normalized.text.length
        ? body.length
        : (normalized.map[index] ?? body.length),
  };
}

/** Unicode-safe replacement for `\b`: letters, digits and underscore count. */
const WORD_CHARS_ONLY = '[\\p{L}\\p{N}_]';

/**
 * Finds all valid, non-overlapping title occurrences in `body`.
 *
 * Pipeline:
 * 1. normalize (optional accent stripping, keeping the index map),
 * 2. match every title longest-first with Unicode boundaries,
 * 3. drop matches touching protected regions (code, links, math, comments),
 * 4. greedily keep non-overlapping matches (longest wins on ties).
 */
export function findTitleMatches(
  body: string,
  titles: ReadonlySet<string>,
  options: MatchOptions
): TitleMatch[] {
  if (titles.size === 0 || body === '') {
    return [];
  }

  const layer = buildSearchLayer(body, options.ignoreAccents);

  const selfKey =
    options.skipSelfReferences && options.selfTitle !== undefined
      ? titleKey(options.selfTitle, options.ignoreAccents)
      : undefined;

  // Longest titles first so "Machine Learning" beats "Learning".
  const sortedTitles = [...titles].sort((a, b) => b.length - a.length);

  const candidates: TitleMatch[] = [];

  for (const title of sortedTitles) {
    const normalizedTitle = options.ignoreAccents
      ? stripAccentsWithMap(title).text
      : title;
    // A title that normalizes to nothing cannot be matched safely.
    if (normalizedTitle.trim() === '') {
      continue;
    }
    if (
      selfKey !== undefined &&
      titleKey(title, options.ignoreAccents) === selfKey
    ) {
      continue;
    }

    const pattern = new RegExp(
      `(?<!${WORD_CHARS_ONLY})${escapeRegExp(normalizedTitle)}(?!${WORD_CHARS_ONLY})`,
      'gui'
    );

    for (const match of layer.text.matchAll(pattern)) {
      const normStart = match.index;
      const normEnd = normStart + match[0].length;

      // Map back through the index map; identity when accents matter.
      const start = options.ignoreAccents
        ? (layer.map[normStart] ?? normStart)
        : normStart;
      const end = layer.toOriginalEndExclusive(normEnd);

      candidates.push({
        start,
        end,
        title,
        matchedText: body.slice(start, end),
      });
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  // Structural protection: compute once over the original body.
  const protectedRanges = computeProtectedRanges(body);
  const usable = candidates.filter(
    (candidate) =>
      !protectedRanges.some((range) => rangesIntersect(candidate, range))
  );

  // Overlap resolution: earliest start wins, longer match breaks ties.
  usable.sort((a, b) => {
    const byStart = a.start - b.start;
    if (byStart !== 0) {
      return byStart;
    }
    return b.end - b.start - (a.end - a.start);
  });

  const selected: TitleMatch[] = [];
  let lastEnd = -1;
  for (const candidate of usable) {
    if (candidate.start < lastEnd) {
      continue;
    }
    selected.push(candidate);
    lastEnd = candidate.end;
  }
  return selected;
}
