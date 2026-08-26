/** Tests for settings normalization, including legacy data.json migration. */

import { describe, expect, it } from 'vitest';
import { createDefaultSettings, normalizePluginSettings } from './types';

describe('normalizePluginSettings', () => {
  it('returns defaults for garbage input', () => {
    expect(normalizePluginSettings(undefined)).toEqual(createDefaultSettings());
    expect(normalizePluginSettings(null)).toEqual(createDefaultSettings());
    expect(normalizePluginSettings(42)).toEqual(createDefaultSettings());
    expect(normalizePluginSettings(['nope'])).toEqual(createDefaultSettings());
  });

  it('accepts valid complete settings', () => {
    const saved = {
      linkType: 'markdown',
      preserveCase: false,
      ignoreAccents: false,
      skipSelfReferences: false,
      excludedFolders: ['Archive'],
    };
    expect(normalizePluginSettings(saved)).toEqual(saved);
  });

  it('rejects unknown link types', () => {
    const result = normalizePluginSettings({ linkType: 'html' });
    expect(result.linkType).toBe('wikilink');
  });

  it('coerces malformed booleans to defaults', () => {
    const result = normalizePluginSettings({
      preserveCase: 'yes',
      ignoreAccents: 1,
    });
    expect(result.preserveCase).toBe(true);
    expect(result.ignoreAccents).toBe(true);
  });

  it('sanitizes excluded folders (trim, drop empties, drop non-strings)', () => {
    const result = normalizePluginSettings({
      excludedFolders: [' Archive ', '', 42, null],
    });
    expect(result.excludedFolders).toEqual(['Archive']);
  });

  it('migrates legacy v1 settings silently', () => {
    // The old JS plugin persisted these keys; unknown ones must be ignored
    // while `excludedFolders` carries over for free.
    const legacy = {
      excludedFolders: ['Private'],
      pageSize: 10,
      enableWikiLinks: true,
      respectCase: false,
      excludeFrontmatter: true,
      noteTitlesCache: [{ title: 'Old', path: 'Old.md' }],
      cacheUpToDate: true,
    };
    const result = normalizePluginSettings(legacy);
    expect(result.excludedFolders).toEqual(['Private']);
    expect(result.linkType).toBe('wikilink');
    expect(Object.hasOwn(result, 'pageSize')).toBe(false);
    expect(Object.hasOwn(result, 'noteTitlesCache')).toBe(false);
  });
});
