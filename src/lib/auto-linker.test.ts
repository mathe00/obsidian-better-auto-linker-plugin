/**
 * Integration tests for the full note pipeline - the behaviors promised to
 * users, verified end to end against realistic note fixtures.
 */

import { describe, expect, it } from 'vitest';
import { processNoteContent, type NoteIndexEntry } from './auto-linker';
import { createDefaultSettings } from '../types';

const INDEX: NoteIndexEntry[] = [
  { title: 'Machine Learning', path: 'AI/Machine Learning.md' },
  { title: 'Café', path: 'Places/Café.md' },
  { title: 'Project X', path: 'Work/Project X.md' },
  { title: 'Zettelkasten', path: 'Methods/Zettelkasten.md' },
];

function run(content: string, selfTitle?: string) {
  return processNoteContent({
    content,
    entries: INDEX,
    settings: createDefaultSettings(),
    ...(selfTitle === undefined ? {} : { selfTitle }),
  });
}

describe('processNoteContent', () => {
  it('creates piped wikilinks and preserves surrounding punctuation', () => {
    const result = run('I wrote about machine learning, and more.');
    expect(result.content).toBe(
      'I wrote about [[Machine Learning|machine learning]], and more.'
    );
    expect(result.linksCreated).toBe(1);
    expect(result.changed).toBe(true);
  });

  it('preserves frontmatter untouched, including accents inside it', () => {
    const content =
      '---\ntags: [café, project-x]\n---\nTalk about Project X today.';
    const result = run(content);
    expect(
      result.content.startsWith('---\ntags: [café, project-x]\n---\n')
    ).toBe(true);
    expect(result.content.endsWith('Talk about [[Project X]] today.')).toBe(
      true
    );
  });

  it('never touches fenced code blocks', () => {
    const content =
      '```\nmachine learning pseudo-code\n```\nbut Zettelkasten ok.';
    const result = run(content);
    expect(result.content).toBe(
      '```\nmachine learning pseudo-code\n```\nbut [[Zettelkasten]] ok.'
    );
  });

  it('never touches inline code', () => {
    const result = run('use `Project X config` at work');
    expect(result.changed).toBe(false);
  });

  it('never touches existing wikilinks', () => {
    const result = run('already linked: [[Project X]] plus [[Project X|work]]');
    expect(result.changed).toBe(false);
  });

  it('never touches existing markdown links', () => {
    const result = run('[Project X docs](Work/Project%20X.md)');
    expect(result.changed).toBe(false);
  });

  it('reports zero changes when nothing matches', () => {
    const result = run('nothing relevant in here');
    expect(result).toEqual({
      content: 'nothing relevant in here',
      changed: false,
      linksCreated: 0,
    });
  });

  it('creates several links in one pass, longest title first', () => {
    const result = run('machine learning powers Project X and zettelkasten.');
    expect(result.linksCreated).toBe(3);
    expect(result.content).toBe(
      '[[Machine Learning|machine learning]] powers [[Project X]] and [[Zettelkasten|zettelkasten]].'
    );
  });

  it('skips self references by default', () => {
    const result = run('this note is called Café and talks about café', 'Café');
    expect(result.changed).toBe(false);
  });

  it('honors accent-insensitive matching through emoji-adjacent text', () => {
    const result = run('☕ cafe time');
    expect(result.content).toBe('☕ [[Café|cafe]] time');
  });

  it('does not link partial words', () => {
    const result = run('the cafetieria is closed');
    expect(result.changed).toBe(false);
  });
});
