/**
 * Unit tests for low-level text helpers - including regression coverage for
 * the index-shift bug that affected the Python predecessor.
 */

import { describe, expect, it } from 'vitest';
import { escapeRegExp, splitFrontmatter, stripAccentsWithMap } from './text';

describe('escapeRegExp', () => {
  it('escapes every regex metacharacter', () => {
    expect(escapeRegExp('a.b*c?(d)e[f]g$h|i^j{k}l\\m')).toBe(
      'a\\.b\\*c\\?\\(d\\)e\\[f\\]g\\$h\\|i\\^j\\{k\\}l\\\\m'
    );
  });

  it('leaves plain words untouched', () => {
    expect(escapeRegExp('Project X')).toBe('Project X');
  });
});

describe('splitFrontmatter', () => {
  it('splits a standard frontmatter block', () => {
    const content = '---\ntitle: Hello\n---\n\nBody here.';
    const { frontmatter, body } = splitFrontmatter(content);
    expect(frontmatter).toBe('---\ntitle: Hello\n---\n');
    expect(body).toBe('\nBody here.');
  });

  it('preserves CRLF line endings', () => {
    const content = '---\r\ntag: x\r\n---\r\nBody.';
    const { frontmatter, body } = splitFrontmatter(content);
    expect(frontmatter).toBe('---\r\ntag: x\r\n---\r\n');
    expect(body).toBe('Body.');
  });

  it('returns everything as body when there is no frontmatter', () => {
    expect(splitFrontmatter('Just text.\n---\nlater')).toEqual({
      frontmatter: '',
      body: 'Just text.\n---\nlater',
    });
  });

  it('treats an unterminated fence as plain content', () => {
    const content = '---\nkey: value\nno closing fence';
    expect(splitFrontmatter(content)).toEqual({
      frontmatter: '',
      body: content,
    });
  });

  it('does not confuse a --- line later in the document', () => {
    const content = 'Intro\n---\nrule\n---\nEnd';
    expect(splitFrontmatter(content)).toEqual({
      frontmatter: '',
      body: content,
    });
  });

  it('handles frontmatter with trailing spaces on fences', () => {
    const content = '--- \nkey: v\n---  \nbody';
    const { frontmatter, body } = splitFrontmatter(content);
    expect(frontmatter).toContain('key: v');
    expect(body).toBe('body');
  });
});

describe('stripAccentsWithMap', () => {
  it('strips accents from composed characters', () => {
    expect(stripAccentsWithMap('café').text).toBe('cafe');
    expect(stripAccentsWithMap('Étoile').text).toBe('Etoile');
  });

  it('is idempotent for ASCII input', () => {
    expect(stripAccentsWithMap('plain text 42').text).toBe('plain text 42');
  });

  it('maps normalized indices back to original offsets', () => {
    // NFD decomposition of 'é' yields TWO units ('e' + combining accent),
    // so naive index reuse shifts offsets - the exact Python V2 bug.
    const source = 'un café très chaud';
    const { text, map } = stripAccentsWithMap(source);
    expect(text).toBe('un cafe tres chaud');

    // Rebuild the original text using only the map.
    let rebuilt = '';
    let cursor = 0;
    for (const originalIndex of map) {
      if (originalIndex > cursor) {
        rebuilt += source.slice(cursor, originalIndex);
      }
      rebuilt += source.charAt(originalIndex);
      cursor = originalIndex + 1;
    }
    rebuilt += source.slice(cursor);
    expect(rebuilt).toBe(source);
  });

  it('never tears surrogate pairs apart (emoji before accented word)', () => {
    // 😀 is two UTF-16 code units; the accented word follows it.
    const source = '😀 café';
    const { text, map } = stripAccentsWithMap(source);
    expect(text).toBe('😀 cafe');
    // The map must be aligned with UTF-16 string indices, not array
    // positions - otherwise every offset after an astral char shifts.
    expect(map).toHaveLength(text.length);
    const cIndex = text.indexOf('c');
    expect(map[cIndex]).toBe(source.indexOf('c'));
  });

  it('leaves ligatures like œ intact (they are not diacritics)', () => {
    expect(stripAccentsWithMap('œuvre').text).toBe('œuvre');
  });
});
