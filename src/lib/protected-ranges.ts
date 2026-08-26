/**
 * Structural protection scanner.
 *
 * Computes the character ranges of a markdown body where auto-linking must
 * never happen: code, existing links, math and HTML comments. This replaces
 * the Python script's midpoint heuristic with real structural analysis.
 * Pure functions only - no Obsidian or DOM imports.
 */

/** Half-open character range `[start, end)` inside a text. */
export interface TextRange {
  readonly start: number;
  readonly end: number;
}

/** One scanned line: `text` excludes the line terminator. */
interface LineSlice {
  readonly text: string;
  readonly start: number;
}

/** Iterates every line with its absolute offsets (newline excluded). */
function* iterateLines(text: string): Generator<LineSlice> {
  let start = 0;
  while (start < text.length) {
    const end = text.indexOf('\n', start);
    if (end === -1) {
      yield { text: text.slice(start), start };
      return;
    }
    yield { text: text.slice(start, end), start };
    start = end + 1;
  }
}

/** Fenced code blocks delimited by ``` or ~~~ lines (up to 3 spaces indent). */
function fencedCodeRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  const fenceMarker = /^[ \t]{0,3}(```|~~~)/;

  let openStart: number | undefined;
  let openMarker: string | undefined;

  for (const line of iterateLines(text)) {
    const match = fenceMarker.exec(line.text);
    if (match === null) {
      continue;
    }
    const marker: string = match[1] ?? '';

    if (openStart === undefined || openMarker === undefined) {
      openStart = line.start;
      openMarker = marker;
    } else if (marker.startsWith(openMarker.charAt(0))) {
      // Closing fence must use the same character as the opening one.
      const end = line.start + line.text.length;
      ranges.push({ start: openStart, end });
      openStart = undefined;
      openMarker = undefined;
    }
    // Same-character fence while open closes it; different characters are
    // literal content inside the block and are skipped.
  }

  if (openStart !== undefined) {
    // Unterminated fence: protect everything to the end, like a renderer.
    ranges.push({ start: openStart, end: text.length });
  }
  return ranges;
}

/** Inline code spans built from paired equal-length backtick runs. */
function inlineCodeRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];

  interface BacktickRun {
    readonly start: number;
    readonly length: number;
  }
  const stack: BacktickRun[] = [];

  for (const match of text.matchAll(/`+/gu)) {
    const run: BacktickRun = {
      start: match.index,
      length: match[0].length,
    };
    // CommonMark-style closing: the nearest unmatched run of EQUAL length,
    // even when shorter runs sit between opener and closer.
    let openIndex = stack.length - 1;
    while (openIndex >= 0 && stack[openIndex]?.length !== run.length) {
      openIndex -= 1;
    }

    const opener = openIndex >= 0 ? stack[openIndex] : undefined;
    if (opener !== undefined) {
      ranges.push({ start: opener.start, end: run.start + run.length });
      stack.splice(openIndex, 1);
    } else {
      stack.push(run);
    }
  }
  // Unpaired runs stay unprotected - there is nothing reliable to protect.
  return ranges;
}

/** Wikilinks and embeds (`[[...]]`, including `![[...]]`). */
function wikilinkRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  let openStart: number | undefined;

  for (const match of text.matchAll(/\[\[|\]\]/gu)) {
    const index = match.index;
    if (match[0] === '[[') {
      // Ignore nested openings - keep the outermost one.
      openStart ??= index;
    } else if (openStart !== undefined) {
      ranges.push({ start: openStart, end: index + 2 });
      openStart = undefined;
    }
  }
  if (openStart !== undefined) {
    // Unterminated opener: a renderer would swallow the rest of the note.
    ranges.push({ start: openStart, end: text.length });
  }
  return ranges;
}

/** Markdown links and images: `[label](target)` / `![alt](target)`. */
function markdownLinkRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  for (const match of text.matchAll(/\[[^\]\n]*\]\([^)\n]*\)/gu)) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return ranges;
}

/** Block-level math spans delimited by `$$`. */
function mathBlockRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  for (const match of text.matchAll(/\$\$[\s\S]*?\$\$/gu)) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return ranges;
}

/** HTML comments `<!-- ... -->`. */
function htmlCommentRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  for (const match of text.matchAll(/<!--[\s\S]*?-->/gu)) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return ranges;
}

/**
 * Computes every range where link insertion must be suppressed.
 *
 * Ranges may legitimately overlap each other (an inline-code scan inside a
 * fenced block, say); callers only test intersection, so merging is useless.
 */
export function computeProtectedRanges(text: string): TextRange[] {
  return [
    ...fencedCodeRanges(text),
    ...inlineCodeRanges(text),
    ...wikilinkRanges(text),
    ...markdownLinkRanges(text),
    ...mathBlockRanges(text),
    ...htmlCommentRanges(text),
  ];
}

/** Whether two half-open ranges share at least one character. */
export function rangesIntersect(a: TextRange, b: TextRange): boolean {
  return a.start < b.end && b.start < a.end;
}
