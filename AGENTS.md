# AGENTS.md — obsidian-better-auto-linker-plugin

Guidelines for AI agents (and humans) working in this repository.

## Project

Better Auto Linker: turns plain-text mentions of note titles into links,
inside the active note or across the whole vault. TypeScript rewrite (v2.0.0)
of both the legacy single-file JS plugin and its intermediate Python script
(`script-auto-linker.py` from the Obsidian Python Bridge ecosystem).

## Commands (run with Bun)

| Command           | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `bun install`     | Install dependencies                                      |
| `bun run dev`     | Watch mode: rebuilds `main.js` on change                  |
| `bun run build`   | Typecheck (`tsc --noEmit`) + production esbuild bundle    |
| `bun run test`    | Vitest run (node environment, pure string logic)          |
| `bun run lint`    | ESLint (strict type-checked config)                       |
| `bun run format`  | Prettier write                                            |
| `bun run check`   | Full pipeline: typecheck + lint + format + tests + build  |

Always run `bun run check` before considering work done. It must exit 0.

## Architecture

```
src/
  main.ts                      Plugin entry: settings load/save, two commands
                               (active note / whole vault with confirmation),
                               atomic writes via Vault.process(). Kept thin.
  types.ts                     Pure domain types + defaults +
                               normalizePluginSettings() (migrates legacy v1
                               data.json keys for free).
  settings.ts                  Settings tab (validated inputs, inline docs).
  lib/text.ts                  escapeRegExp, frontmatter splitter,
                               stripAccentsWithMap() - accent removal that
                               keeps a UTF-16-aligned index map back to the
                               original text.
  lib/protected-ranges.ts      Structural scanner: fenced/inline code,
                               wikilinks/embeds, markdown links/images,
                               $$math$$, HTML comments.
  lib/matcher.ts               Longest-first Unicode-boundary matching,
                               protected-range filtering, overlap resolution.
  lib/link-builder.ts          The three link syntaxes + percent-encoding.
  lib/auto-linker.ts           Pure per-note orchestrator (frontmatter kept,
                               body rebuilt around kept matches).
  lib/*.test.ts                Vitest suites co-located with their modules.
```

Design rules:

- Everything under `src/lib/` plus `types.ts` is **pure** (no Obsidian/DOM
  imports) and must stay that way - it is unit-tested without mocks and
  without any obsidian stub.
- File mutations go through `Vault.process()` (atomic read-modify-write);
  never raw `fs`. This keeps `isDesktopOnly: false` honest.
- Matching contract: longest title wins on overlap; adjacent punctuation
  stays OUTSIDE the link; `\b` is replaced by Unicode-aware lookarounds
  (`[\p{L}\p{N}_]`) so accented words behave at word edges.
- Invariant: `stripAccentsWithMap(x).map.length === x-normalized.length`
  in UTF-16 units (astral characters occupy two slots). Never "simplify"
  this away - it guards against index shifts after emoji/CJK text.

## Conventions

- TypeScript strictest tsconfig (all strict flags, `exactOptionalPropertyTypes`,
  `noUncheckedIndexedAccess`, …). Do not weaken flags to make errors disappear;
  fix the code.
- ESLint `strictTypeChecked` + `stylisticTypeChecked`: no `any`, no non-null
  assertions, explicit `override`, parameter properties preferred, `eqeqeq`.
- Prettier: single quotes, 2 spaces, 80 cols, ES5 trailing commas.
- English everywhere (code, comments, docs, commit messages).

## Known constraints / gotchas

- **TypeScript version**: pinned to latest 5.x. TS 7 (native Go compiler) is
  GA but ships no programmatic API until 7.1, so `typescript-eslint` cannot
  run on it yet; bump when 7.1 lands its stable API and re-verify
  `bun run check`.
- Bun's global supply-chain config (~/.bunfig.toml) enforces a 3-day release
  cooldown. If a brand-new dependency version fails to resolve, pin the
  latest *mature* release instead of bypassing the cooldown.
- The npm `obsidian` package contains only type definitions. No vitest stub
  is needed here because tested modules never import it.
- **`main.js` IS committed** in this repo (deliberate deviation from some
  other plugins): users install by downloading `main.js` + `manifest.json`
  from the repository. After merging code changes, rebuild with
  `bun run build` and include the regenerated `main.js` in the commit.
- Releasing: bump `version` in `package.json`, `manifest.json` and add an
  entry to `versions.json` in the same commit.
