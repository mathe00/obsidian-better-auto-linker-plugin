# 📄 Obsidian Better Auto Linker Plugin

👋 **Welcome to the Obsidian Better Auto Linker repository!**

This plugin **automatically creates links between your notes**: it scans your notes for mentions of other note titles and converts them into links — respecting your existing formatting.

## 🕰️ Timeline of this project

| Date | Event |
| --- | --- |
| **Sept 2024** | 🐣 v1.0 born — a single-file JavaScript plugin (written with AI help, as I'm primarily a Python developer). It worked, but the codebase was hard to maintain and extend. |
| **2025** | 😴 Development stopped and the repository was archived. My auto-linking work moved to my [Obsidian Python Bridge](https://github.com/mathe00/obsidian-plugin-python-bridge) ecosystem, as [`script-auto-linker.py`](https://github.com/mathe00/my-obsidian-python-scripts/blob/main/script-auto-linker.py) (V2.3) — far more robust matching logic, but requiring Python + the Bridge plugin + a separate script folder. |
| **Aug 2026** | 🚀 **Un-archived and fully rewritten in TypeScript (v2.0.0)!** Two reasons: (1) for such a keep-it-simple feature, asking users to install Python + a bridge plugin + a script folder is too much friction compared to dropping one folder in `.obsidian/plugins`; (2) modern AI coding assistants have made TypeScript perfectly manageable for me now. Best of both worlds: the Python V2 matching engine, native plugin ergonomics. |

The Python Bridge remains fantastic for heavy automation — check it out! But for auto-linking specifically, this plugin is now the recommended way.

## ✨ Features

- 🔗 **Three link styles**: `[[Title|matched text]]` (alias wikilink), `[[Title]]` (simple), or `[matched text](path.md)` (markdown).
- 🔡 **Case & accent insensitive**: *"we discussed machine learning over café"* → links to *Machine Learning* and *Café*.
- 🛡️ **Protected zones are never touched**: YAML frontmatter, fenced & inline code, existing wikilinks/embeds/markdown links/images, `$$math$$` blocks, HTML comments.
- 📏 **Longest titles win**: *Machine Learning* is preferred over *Learning* when both match.
- ✂️ **Whole-word matching with Unicode boundaries**: a title is never linked inside a longer word, even with accented first/last letters.
- 🗂️ **Excluded folders**: notes under configured paths are never scanned nor modified (legacy v1 setting migrates automatically).
- 🚫 **Self-reference skipping**: a note doesn't link its own title inside itself (toggleable).
- ⚛️ **Vault-wide command** with confirmation dialog and progress notice, or per-note from the command palette.
- 📱 **Desktop AND mobile** — pure vault API, no Node-only dependencies.

## 🆚 Compared to previous versions

| | v1 (JS, 2024) | Python script (V2.3) | **v2 (TS, 2026)** |
| --- | --- | --- | --- |
| Install | ✅ one folder | ❌ Python + Bridge + script | ✅ one folder |
| Accent-insensitive matching | ❌ | ✅ (index-shift bug on NFD text) | ✅ fixed via index map |
| Multi-word titles mid-sentence | ⚠️ partial | ✅ | ✅ |
| Avoids code/existing links | ❌ (regex guess) | ⚠️ midpoint heuristic | ✅ structural ranges |
| Longest-title-wins overlap handling | ❌ | ✅ | ✅ |
| Redundant alias pipes (`[[X\|X]]`) | ❌ produced them | ❌ produced them | ✅ collapsed |
| Vault-wide processing | ❌ | ❌ active note only | ✅ with confirmation |
| Mobile support | ⚠️ | ❌ desktop bridge | ✅ |

## 🛠️ Installation

1. Download `main.js` and `manifest.json` from this repository (or the [latest release](https://github.com/mathe00/obsidian-better-auto-linker-plugin/releases)).
2. Create a folder in your vault: `<your-vault>/.obsidian/plugins/obsidian-better-auto-linker-plugin/`
3. Place both files inside, then restart Obsidian.
4. Enable **Better Auto Linker** under **Settings → Community plugins**.

Upgrading from v1? Your *Excluded Folders* setting carries over automatically.

## 🚀 Usage

Open the command palette (`Ctrl/Cmd+P`):

- **Auto-link active note** — converts titles found in the current note and shows how many links were created.
- **Auto-link entire vault…** — asks for confirmation, then processes every eligible note with a progress notice and a summary.

### Settings

| Setting | Default | Description |
| --- | --- | --- |
| Link Type | Wikilink (with alias) | Output syntax: alias wikilink / simple wikilink / markdown link |
| Preserve Original Case | On | Keeps casing as typed ([[Title\|oRiginal]]); ignored by simple wikilinks |
| Ignore Accents When Matching | On | `cafe` can link to a note titled *Café* |
| Skip Self-references | On | Never link a title inside its own note |
| Excluded Folders | *(empty)* | One folder path per line; matching notes are untouched |

## 🧑‍💻 Development

TypeScript strict toolchain (ESLint strict-type-checked + Prettier + Vitest) bundled with esbuild. Prerequisites: [Bun](https://bun.sh).

```bash
bun install        # install dependencies
bun run dev        # watch mode (rebuilds main.js)
bun run test       # unit tests
bun run check      # typecheck + lint + format + tests + production build
```

> The compiled `main.js` **is committed** on purpose: installing by downloading files straight from the repository stays possible without a release pipeline.

## 🛠️ Contributing

I'm a **Python developer** originally — this rewrite exists precisely because AI assistants made clean TypeScript realistic for me. Issues and PRs are welcome! English isn't my first language, so thanks for your patience with my replies 😅.

## ⭐ Show Your Support

If this plugin saves you time, a star helps gauge interest — and feedback/issues are always welcome. Happy linking! 🔗✨
