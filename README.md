
# 📄 Obsidian Better Auto Linker - Obsidian Plugin

👋 **Welcome to the Obsidian Better Auto Linker repository!**

This plugin was created to **automate the creation of links between notes in Obsidian**, and while the developer isn’t a professional coder, they do know **Python** 🐍 well enough to understand most of what’s going on... more or less 😅. When it comes to **JavaScript** and **TypeScript**, however, it’s a different story. So, everything has been coded in **JavaScript** and kept in one single `main.js` file (yes, it’s not the cleanest, but it works!) 🥲.

Oh, and by the way, **English isn’t my first language**! So, I apologize in advance if I misunderstand anything or don’t respond perfectly to issues or pull requests 😅. Please be patient, and I’ll do my best to understand and reply!

The goal of this plugin is simple: make life in Obsidian easier by automatically linking notes together. With a few more ideas in mind, this plugin will hopefully keep evolving into something even more useful!

## 🚀 Features Available

The plugin already offers several handy features for automating link creation between notes:

- 📝 **Note scanning**: Scans markdown files to detect potential matches with other notes.
- 🔗 **Link suggestions**: Provides link suggestions to insert into the active note.
- ⚡ **Title caching**: Uses a caching system to avoid re-indexing all notes every time, improving performance.
- 📄 **Modal interface with pagination**: Displays results in a modal with navigation buttons to go through the result pages.
- ✅ **Link selection**: Allows selecting all links on a page or from the entire set of found matches.
- 🔍 **Excluding folders and frontmatter**: Lets you exclude certain folders or sections (like frontmatter) from being scanned.
- 🔡 **Case sensitivity**: Supports case-sensitive matching for notes.
- 🔗 **Wikilinks support**: Works with Wikilinks (it’s not perfect, but it works!).
- 📏 **Custom modal length**: Adjust the length of the popup to make selecting links easier.

## 🛠️ Features for the Future (Roadmap)

Here’s a checklist of ideas for future features (if someone is willing to help or if I get the energy to add them 😄):

- [ ] 📝 **Note alias support**: Add support for managing and resolving note aliases.
- [ ] 🔗 **Improved Wikilink support**: Make handling Wikilinks even smoother.
- [ ] ⚙️ **Advanced filtering options**: Add more customizable filtering options for note scanning.
- [ ] 📊 **Link statistics**: Provide stats on the connections between notes to better visualize their interconnections.
- [ ] 🎨 **Better UI/Design for link selection**: Improve the aesthetics and user interface for selecting links to create.
- [ ] 🐛 **Fix display bugs/misalignment**: Correct display issues or alignment bugs.
- [ ] 📝 **Handle special characters properly**: Improve handling of special characters like parentheses or backslashes that JavaScript struggles with.
- [ ] ⚡ **Optimize speed further**: Make the scanning process even faster and more efficient.
- [ ] 🖼️ **Customizable selection window**: Allow customization of the selection window, such as the amount of context shown for each link.
- [ ] 📝 **Alias detection and replacement**: Support the detection and replacement of links using note aliases.
- [ ] 🔄 **Proper link replacement**: Ensure that link replacement works smoothly, without bugs, and in the correct order.
- [ ] 🌟 **And many more...**: There’s always room for more improvements and ideas!

## 🛠️ Why this Plugin?

I know there are already similar plugins, but many seem abandoned 😴. So, this plugin was created to fill that gap and meet my own needs. For now, everything is coded in **one file** (`main.js`)—yes, I took the lazy route 😅—but it works, and I think it should hold up fine even with future features.

However, if the community strongly feels it should be refactored into **TypeScript** for cleanliness, that’s an option. Just don’t expect much help from me on that front—**TypeScript** and I don’t get along well 😅.

## 🛠️ Contributing

If you’re comfortable with **JavaScript** or **TypeScript** and you see ways to improve or add features, any help would be greatly appreciated!  
This project has potential to become cleaner and more robust, so if you want to refactor the code or suggest improvements, **pull requests and issues are open!** 🎉

## 🛠️ Installation

To install and try out the **Obsidian Better Auto Linker Plugin**, follow these steps:

1. Download the `main.js` and `manifest.json` files from this repository.
2. Create a new folder in your Obsidian vault under the path:  
   `<your-vault>/.obsidian/plugins/obsidian-better-auto-linker/`
3. Place the downloaded `main.js` and `manifest.json` files into this folder.
4. Restart Obsidian.
5. Go to **Settings** > **Community plugins** and enable the **Obsidian Better Auto Linker Plugin**.

That’s it! The plugin should now be active, and you can start using it to automate the linking of your notes.

## 🔗 Other plugins

I’ve also created other plugins for Obsidian, so if you’re curious, feel free to check them out on my GitHub profile.

## ✉️ Contact

If you have suggestions, ideas for improvements, or run into any bugs, feel free to open an issue or a pull request. Since **English isn’t my first language**, please be patient if I misunderstand something or take time to respond. I’ll do my best to understand and reply! 🤞

## ⭐ Show Your Support

I’m not really concerned about the number of stars, but if you find this project useful or interesting, consider giving it a star on GitHub to help me gauge the interest. If you’d rather not leave a star, that’s totally fine – feel free to open an issue, submit a pull request, or even drop a message of support in an issue instead! All kinds of feedback, advice, and contributions are always welcome and appreciated. 😊

---

Thanks to everyone who takes the time to test, contribute, or even just read this README! Together, we can turn this plugin into something really useful for the Obsidian community. 💪


