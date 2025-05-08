# 📄 Obsidian Better Auto Linker - (OBSOLETE / ARCHIVED)

👋 **Welcome to the repository for the *old* Obsidian Better Auto Linker plugin.**

**⚠️ IMPORTANT NOTICE: THIS PLUGIN IS OBSOLETE AND NO LONGER MAINTAINED! ⚠️**

This plugin was an early attempt (coded entirely in a single `main.js` file with AI help, as I primarily know Python 🐍) to automate link creation in Obsidian. While it had some basic features, it suffered from limitations and was difficult to maintain and extend due to my lack of deep JavaScript/TypeScript knowledge.

---

## ✨ The Better Solution: Obsidian Python Bridge! ✨

Instead of using this old plugin, I **strongly recommend** using my newer, much more powerful, flexible, and actively developed project:

➡️ **[Obsidian Python Bridge Plugin](https://github.com/mathe00/obsidian-plugin-python-bridge)** ⬅️

**Why switch?**

The **Obsidian Python Bridge** allows you (and me!) to leverage the power and simplicity of **Python** to interact with Obsidian. This means:

*   ✅ **Easier Scripting:** Write complex automation logic in Python, which is often more intuitive for text and file manipulation.
*   ✅ **More Power:** Access a vastly larger set of Obsidian features via the bridge's API (full vault access, file management, event listening, UI settings per script, etc.).
*   ✅ **Cross-Platform:** Works reliably on Windows, macOS, and Linux.
*   ✅ **Active Development:** The Python Bridge is my current focus and is actively being improved.

---

## 🔗 Looking for the Auto-Linking Functionality?

I've recreated and significantly improved the auto-linking logic as a **Python script** that runs using the **Obsidian Python Bridge**. This new script is more robust and configurable.

➡️ **Get the new Auto-Linker Script here:** [**`script-auto-linker.py`**](https://github.com/mathe00/my-obsidian-python-scripts/blob/main/script-auto-linker.py) ⬅️
*(You'll find it in my repository of example scripts for the Python Bridge)*

**Features of the new Python script version:**

*   Configurable link types (Wikilink, Simple Wikilink, Markdown).
*   Configurable case preservation, accent ignorance, punctuation handling via **plugin settings**.
*   More robust matching logic (handles multi-word titles mid-sentence).
*   Avoids linking inside code/existing links.
*   Easier to understand and modify (if you know Python!).

---

## 🛠️ What to do now?

1.  **Uninstall** this old "Obsidian Better Auto Linker" plugin if you have it installed.
2.  **Install** the new **[Obsidian Python Bridge Plugin](https://github.com/mathe00/obsidian-plugin-python-bridge)** (follow its installation instructions).
3.  **Download** the **[new `script-auto-linker.py` script](https://github.com/mathe00/my-obsidian-python-scripts/blob/main/script-auto-linker.py)** (and potentially others) from the [My Obsidian Python Scripts repository](https://github.com/mathe00/my-obsidian-python-scripts).
4.  Place the script(s) in the folder you configure within the Python Bridge plugin settings.
5.  Configure the "Auto Linker" script's settings (like link type) within the Python Bridge settings tab in Obsidian.
6.  Run the script via the command palette!

---

Thanks for your interest in the original plugin! I hope you find the new Python Bridge and the improved auto-linker script much more powerful and useful. Please direct any new issues or questions to the [Obsidian Python Bridge repository](https://github.com/mathe00/obsidian-plugin-python-bridge).
