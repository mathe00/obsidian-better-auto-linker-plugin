/** Unit tests for the structural protection scanner. */

import { describe, expect, it } from 'vitest';
import { computeProtectedRanges, rangesIntersect } from './protected-ranges';

/** Shorthand: does position fall inside ANY protected range? */
function isProtected(text: string, position: number): boolean {
  return computeProtectedRanges(text).some(
    (range) => position >= range.start && position < range.end
  );
}

describe('computeProtectedRanges', () => {
  it('protects fenced code blocks (backticks)', () => {
    const text = 'before\n```\nProject X\n```\nafter';
    const inner = text.indexOf('Project X');
    expect(isProtected(text, inner)).toBe(true);
    expect(isProtected(text, 0)).toBe(false);
  });

  it('protects tilde fences too', () => {
    const text = '~~~\nCafé\n~~~\nopen';
    expect(isProtected(text, text.indexOf('Café'))).toBe(true);
    expect(isProtected(text, text.indexOf('open'))).toBe(false);
  });

  it('does not close a ``` fence with ~~~ and vice versa', () => {
    const text = '```\nstill fenced\n~~~\nfenced too\n```';
    expect(isProtected(text, text.indexOf('fenced too'))).toBe(true);
  });

  it('protects to end of file on unterminated fence', () => {
    const text = 'ok\n```\nrest is code';
    expect(isProtected(text, text.indexOf('rest'))).toBe(true);
  });

  it('protects inline single-backtick code spans', () => {
    const text = 'see `Project X` now';
    expect(isProtected(text, text.indexOf('Project'))).toBe(true);
  });

  it('supports double-backtick delimiters containing backticks', () => {
    const text = 'see ``code with ` tick Project X`` done';
    expect(isProtected(text, text.indexOf('Project'))).toBe(true);
  });

  it('protects wikilinks entirely', () => {
    const text = 'go to [[Project X|project]] now';
    expect(isProtected(text, text.indexOf('project]]') - 2)).toBe(true);
    expect(isProtected(text, 0)).toBe(false);
  });

  it('protects markdown links and images', () => {
    const text = 'a [label](target.md) and ![alt](img.png)';
    expect(isProtected(text, text.indexOf('label'))).toBe(true);
    expect(isProtected(text, text.indexOf('alt'))).toBe(true);
  });

  it('protects $$math$$ blocks', () => {
    const text = '$$\nE = mc^2\n$$\ndone';
    expect(isProtected(text, text.indexOf('mc^2'))).toBe(true);
  });

  it('protects HTML comments', () => {
    const text = '<!-- note: Project X -->visible';
    expect(isProtected(text, text.indexOf('Project'))).toBe(true);
    expect(isProtected(text, text.indexOf('visible'))).toBe(false);
  });

  it('leaves ordinary prose fully unprotected', () => {
    const text = 'Plain prose mentioning Project X freely.';
    expect(computeProtectedRanges(text)).toEqual([]);
  });
});

describe('rangesIntersect', () => {
  it('detects overlap and adjacency correctly', () => {
    expect(rangesIntersect({ start: 0, end: 5 }, { start: 4, end: 9 })).toBe(
      true
    );
    expect(rangesIntersect({ start: 0, end: 5 }, { start: 5, end: 9 })).toBe(
      false
    );
  });
});
