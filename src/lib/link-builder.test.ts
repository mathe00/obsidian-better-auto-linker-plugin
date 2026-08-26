/** Unit tests for link rendering. */

import { describe, expect, it } from 'vitest';
import { buildLink, encodeLinkTarget } from './link-builder';
import { createDefaultSettings } from '../types';
import type { TitleMatch } from './matcher';

function makeMatch(title: string, matchedText: string): TitleMatch {
  return { start: 0, end: matchedText.length, title, matchedText };
}

describe('encodeLinkTarget', () => {
  it('encodes spaces and non-ASCII while keeping slashes', () => {
    expect(encodeLinkTarget('My Notes/Café corner.md')).toBe(
      'My%20Notes/Caf%C3%A9%20corner.md'
    );
  });

  it('also encodes parentheses which would break markdown targets', () => {
    expect(encodeLinkTarget('Ideas/Spark (v2).md')).toBe(
      'Ideas/Spark%20%28v2%29.md'
    );
  });
});

describe('buildLink', () => {
  it('renders a piped wikilink preserving case by default', () => {
    const link = buildLink(
      makeMatch('Machine Learning', 'machine learning'),
      'AI/Machine Learning.md',
      createDefaultSettings()
    );
    expect(link).toBe('[[Machine Learning|machine learning]]');
  });

  it('collapses the alias when it equals the title', () => {
    const link = buildLink(
      makeMatch('Project X', 'Project X'),
      'Project X.md',
      createDefaultSettings()
    );
    expect(link).toBe('[[Project X]]');
  });

  it('uses canonical casing when preserveCase is off, collapsing useless pipes', () => {
    const settings = { ...createDefaultSettings(), preserveCase: false };
    const link = buildLink(makeMatch('Café', 'CAFE'), 'Café.md', settings);
    expect(link).toBe('[[Café]]');
  });

  it('always renders bare simple wikilinks', () => {
    const settings = {
      ...createDefaultSettings(),
      linkType: 'simple-wikilink' as const,
    };
    const link = buildLink(makeMatch('Café', 'cafe'), 'Café.md', settings);
    expect(link).toBe('[[Café]]');
  });

  it('renders percent-encoded markdown links', () => {
    const settings = {
      ...createDefaultSettings(),
      linkType: 'markdown' as const,
    };
    const link = buildLink(
      makeMatch('Café', 'cafe'),
      'My Notes/Café.md',
      settings
    );
    expect(link).toBe('[cafe](My%20Notes/Caf%C3%A9.md)');
  });

  it('markdown labels respect preserveCase=off', () => {
    const settings = {
      ...createDefaultSettings(),
      linkType: 'markdown' as const,
      preserveCase: false,
    };
    const link = buildLink(
      makeMatch('Zettelkasten', 'zettelkasten'),
      'Methods/Zettelkasten.md',
      settings
    );
    expect(link).toBe('[Zettelkasten](Methods/Zettelkasten.md)');
  });

  it('falls back to bare-title markdown target without a path', () => {
    const settings = {
      ...createDefaultSettings(),
      linkType: 'markdown' as const,
    };
    const link = buildLink(makeMatch('Orphan', 'Orphan'), undefined, settings);
    expect(link).toBe('[Orphan](Orphan)');
  });
});
