/** Unit tests for the title matching engine. */

import { describe, expect, it } from 'vitest';
import { findTitleMatches } from './matcher';

const SETTINGS_BASE = { ignoreAccents: true, skipSelfReferences: true };

function match(
  body: string,
  titles: readonly string[],
  overrides: Partial<Parameters<typeof findTitleMatches>[2]> = {}
) {
  return findTitleMatches(body, new Set(titles), {
    ...SETTINGS_BASE,
    ...overrides,
  });
}

describe('findTitleMatches', () => {
  it('matches multi-word titles mid-sentence with different casing', () => {
    const matches = match('we discussed machine learning today', [
      'Machine Learning',
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.matchedText).toBe('machine learning');
    expect(matches[0]?.title).toBe('Machine Learning');
  });

  it('longest title wins when titles overlap', () => {
    const matches = match('study Machine Learning now', [
      'Learning',
      'Machine Learning',
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.title).toBe('Machine Learning');
  });

  it('is accent-insensitive when enabled (composed source)', () => {
    const matches = match('je vais au cafe ce soir', ['Café']);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.matchedText).toBe('cafe');
  });

  it('survives NFD-decomposed source text without index shift', () => {
    // "café" stored as c-a-f-e-combining-accent (what some editors emit).
    const nfd = 'au cafe\u0301 maintenant';
    const matches = match(nfd, ['Café']);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.matchedText).toBe('cafe\u0301');
  });

  it('respects accents when ignoreAccents is false', () => {
    const matches = match('meet at the cafe', ['Café'], {
      ignoreAccents: false,
    });
    expect(matches).toHaveLength(0);
  });

  it('never links inside a longer word', () => {
    const matches = match('the catopia project', ['Cat']);
    expect(matches).toHaveLength(0);
  });

  it('links up to adjacent punctuation but keeps it outside', () => {
    const matches = match('read Project X.', ['Project X']);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.matchedText).toBe('Project X');
    expect(matches[0]?.end).toBe('read Project X.'.length - 1);
  });

  it('skips self-references when asked', () => {
    const matches = match('my own name is Café', ['Café'], {
      selfTitle: 'CAFÉ',
    });
    expect(matches).toHaveLength(0);
  });

  it('keeps self-references when skipping is disabled', () => {
    const matches = match('my own name is Cafe', ['Café'], {
      selfTitle: 'Café',
      skipSelfReferences: false,
    });
    expect(matches).toHaveLength(1);
  });

  it('ignores empty titles safely', () => {
    expect(match('nothing here', [''])).toHaveLength(0);
  });

  it('returns nothing on empty bodies or empty indexes', () => {
    expect(findTitleMatches('', new Set(['X']), SETTINGS_BASE)).toEqual([]);
    expect(findTitleMatches('x', new Set(), SETTINGS_BASE)).toEqual([]);
  });

  it('resolves overlaps longest-first but keeps later standalone mentions', () => {
    // Overlapping occurrences: only the longest title survives...
    const overlapped = match('pure Machine Learning topic', [
      'Learning',
      'Machine Learning',
    ]);
    expect(overlapped.map((m) => m.title)).toEqual(['Machine Learning']);
    // ...while a second, non-overlapping mention stays linkable.
    const both = match('Machine Learning beats Learning alone', [
      'Learning',
      'Machine Learning',
    ]);
    expect(both.map((m) => m.title)).toEqual(['Machine Learning', 'Learning']);
  });
});
