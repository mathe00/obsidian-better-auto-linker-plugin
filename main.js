const { Plugin, Modal, Setting, MarkdownView, Notice, PluginSettingTab, TFile } = require('obsidian');

module.exports = class NoteLinkerPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    await this.loadCache();  // Load persistent cache
  
    // Subscribe to file creation and deletion events
    this.registerEvent(this.app.vault.on('create', (file) => this.onFileCreated(file)));
    this.registerEvent(this.app.vault.on('delete', (file) => this.onFileDeleted(file)));
  
    // Add a command to launch the plugin
    this.addCommand({
      id: 'scan-note-for-links',
      name: 'Scan Note for Links',
      callback: () => this.runNoteLinker(),
    });
  
    // Add a settings panel to exclude folders and manage wikilink options
    this.addSettingTab(new NoteLinkerSettingTab(this.app, this));
  
    new Notice('Note Linker Plugin Loaded');
  }

  // Load saved settings
  async loadSettings() {
    this.settings = Object.assign({
      excludedFolders: [],
      pageSize: 10,
      enableWikiLinks: false,
      respectCase: false,
      excludeFrontmatter: true  // Option to exclude frontmatter by default
    }, await this.loadData());
  }
  
  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  // Function to keep cache up to date if needed
  updateCache() {
    if (!this.cacheUpToDate) {
      const excludedFolders = this.settings.excludedFolders || [];
      this.noteTitlesCache = [];

      // Iterate through all non-excluded folders
      this.app.vault.getAllLoadedFiles().forEach((file) => {
        // Check if the file is in an excluded folder
        const isExcluded = excludedFolders.some(folder => file.path.startsWith(folder));

        // If the file is not excluded and is a markdown file, we add it to the cache
        if (!isExcluded && file instanceof TFile && file.extension === 'md') {
          this.noteTitlesCache.push({
            title: file.basename,  // The file name without extension
            path: file.path        // The full file path
          });
        }
      });

      this.cacheUpToDate = true;  // The cache is up to date
    }
  }

  // When a file is created, add it to the cache if applicable and indicate that the cache is no longer up to date
  onFileCreated(file) {
    if (file.extension === 'md') {
      const excludedFolders = this.settings.excludedFolders || [];
      if (!excludedFolders.some(folder => file.path.startsWith(folder))) {
        this.noteTitlesCache.push({ title: file.basename, path: file.path });
        this.cacheUpToDate = false; // The cache must be updated
      }
    }
  }

  // When a file is deleted, remove it from the cache and indicate that the cache is no longer up to date
  onFileDeleted(file) {
    this.noteTitlesCache = this.noteTitlesCache.filter(note => note.path !== file.path);
    this.cacheUpToDate = false; // The cache must be updated
  }

  async runNoteLinker() {
    try {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!activeView) {
        new Notice('No active note found.');
        return;
      }
  
      const editor = activeView.editor;
      const selectedText = editor.getSelection();
      const activeFile = activeView.file;
      let content = selectedText ? selectedText : await this.app.vault.read(activeFile);
  
      // Exclude frontmatter if the option is enabled
      if (this.settings.excludeFrontmatter) {
        content = this.removeFrontmatter(content);
      }
  
      // Create and display the progress window
      const progressModal = new ProgressModal(this.app);
      progressModal.open();
  
      // If the cache is not up to date, index the notes
      if (!this.cacheUpToDate) {
        progressModal.setProgress(0, 'Indexing all notes...');
        await this.indexNotes(progressModal); // Note indexing with progress update
      } else {
        progressModal.setProgress(50, 'Using cached note index...');
      }
  
      // Scan the content of the active note
      progressModal.setProgress(75, 'Scanning the active note...');
      const potentialLinks = this.detectPotentialLinks(content);
  
      // Scan completed
      progressModal.setProgress(100, 'Scan complete.');
      progressModal.close(); // Close the progress bar
  
      if (potentialLinks.length > 0) {
        new LinkSelectionModal(this.app, potentialLinks, activeFile, editor, this).open();
      } else {
        new Notice('No potential links found.');
      }
    } catch (error) {
      console.error('Error running Note Linker:', error);
      new Notice('An error occurred while running Note Linker.');
    }
  }
  
  // Function to remove frontmatter from note content
  removeFrontmatter(content) {
    const frontmatterRegex = /^---[\s\S]+?---\n/;  // Regex to capture frontmatter between ---
    return content.replace(frontmatterRegex, '');  // Remove frontmatter
  }
  

  // Index the notes while updating progress
  async indexNotes(progressModal) {
    const allNotes = this.app.vault.getMarkdownFiles();
    const excludedFolders = this.settings.excludedFolders || [];
  
    // Filter non-excluded notes
    const notesToIndex = allNotes.filter(note => !excludedFolders.some(folder => note.path.startsWith(folder)));
    this.noteTitlesCache = [];
  
    const totalNotes = notesToIndex.length;
  
    // Use a recursive function with setTimeout to process in batches
    const processBatch = (startIndex) => {
      const batchSize = 50;  // Number of files to process per batch
      for (let i = startIndex; i < Math.min(startIndex + batchSize, totalNotes); i++) {
        this.noteTitlesCache.push({ title: notesToIndex[i].basename, path: notesToIndex[i].path });
        const progress = Math.round((i + 1) / totalNotes * 100);  // Calculate progress
        progressModal.setProgress(progress, `Indexing note ${i + 1} of ${totalNotes}...`);
      }
  
      // If all files are not yet processed, continue after a short delay
      if (startIndex + batchSize < totalNotes) {
        setTimeout(() => processBatch(startIndex + batchSize), 10);  // Small pause between batches
      } else {
        this.cacheUpToDate = true;
        progressModal.setProgress(100, 'Indexation terminée.');
      }
    };
  
    // Start the batch process
    processBatch(0);
  }

  async loadCache() {
    const cachedData = await this.loadData();
    if (cachedData && cachedData.noteTitlesCache && cachedData.cacheUpToDate) {
      this.noteTitlesCache = cachedData.noteTitlesCache;
      this.cacheUpToDate = true;
    } else {
      this.updateCache();  // Recreate the cache if the data is unavailable or outdated
    }
  }
  
  
  async saveCache() {
    await this.saveData({
      noteTitlesCache: this.noteTitlesCache,
      cacheUpToDate: this.cacheUpToDate
    });
  }
  
  // Load settings and cache at startup
  async onload() {
    await this.loadSettings();
    await this.loadCache();  // Load persistent cache
  
    // Subscribe to file creation and deletion events
    this.registerEvent(this.app.vault.on('create', (file) => this.onFileCreated(file)));
    this.registerEvent(this.app.vault.on('delete', (file) => this.onFileDeleted(file)));
  
    // Add a command to launch the plugin
    this.addCommand({
      id: 'scan-note-for-links',
      name: 'Scan Note for Links',
      callback: () => this.runNoteLinker(),
    });
  
    // Add a settings panel to exclude folders and manage wikilink options
    this.addSettingTab(new NoteLinkerSettingTab(this.app, this));
  
    new Notice('Note Linker Plugin Loaded');
  }
  

  // Function to detect note titles that can be turned into links
  detectPotentialLinks(content) {
    const detectedLinks = [];

    for (const note of this.noteTitlesCache) {
      const title = this.escapeRegExp(note.title);  // Escape the title to handle special characters in the regex

      // Adjust the regex to match escaped characters with or without the \
      // Modify parentheses to make them flexible for escaped characters
      const regex = new RegExp(`(?<!\\[\\[)(${title.replace(/([()])/g, '\\\\?$1')})(?!\\|?\\]\\])`, 'gi'); 

      let match;
      while ((match = regex.exec(content)) !== null) {
        const originalText = match[1];  // The text detected as is in the document
        const surroundingText = `${match.input.slice(Math.max(0, match.index - 20), match.index)}${originalText}${match.input.slice(match.index + originalText.length, match.index + originalText.length + 20)}`;

        detectedLinks.push({
          title: note.title, // Use the original note title (with correct case)
          context: surroundingText,
          originalMatch: originalText, // Keep the version of the text in the note for replacement
          notePath: note.path,
          matchIndex: [match.index, match.index + match[0].length]
        });
      }
    }

    // Sort detected links by their position in the content (matchIndex[0])
    return detectedLinks.sort((a, b) => a.matchIndex[0] - b.matchIndex[0]);
  }



  



  async insertLinks(activeFile, editor, linksToInsert) {
    let content = await this.app.vault.read(activeFile);
  
    linksToInsert.forEach(link => {
      const title = link.title;  // The note title (with correct case)
      const originalText = link.originalMatch;  // The original text in the note
  
      let replacement;
      if (this.settings.enableWikiLinks) {
        // If the case differs, we use an alias
        if (originalText !== title && this.settings.respectCase) {
          replacement = `[[${title}|${originalText}]]`;  // Keep the original case
        } else {
          replacement = `[[${title}]]`;  // Otherwise, just a regular link
        }
      } else {
        replacement = `[[${title}]]`;
      }
  
      // Adjust the regex to handle escaped characters during replacement
      const regex = new RegExp(`\\b${this.escapeRegExp(originalText).replace(/([()])/g, '\\\\?$1')}\\b`, 'gi');
      content = content.replace(regex, replacement);
    });
  
    await this.app.vault.modify(activeFile, content);
    new Notice('Links inserted successfully.');
  }
  
  
  
  

  // Function to escape special characters in a regex
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Modal window to display progress
class ProgressModal extends Modal {
  constructor(app) {
    super(app);
    this.progressBar = null;
    this.statusText = null;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: 'Processing...' });

    // Create a progress bar
    this.progressBar = contentEl.createEl('progress', { value: 0, max: 100 });
    this.progressBar.style.width = '100%';

    // Create a status text
    this.statusText = contentEl.createEl('p', { text: 'Starting...' });
  }

  // Update progress and status text
  setProgress(value, status) {
    this.progressBar.value = value;
    this.statusText.setText(status);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Modal to display results in the form of markdown checklists
class LinkSelectionModal extends Modal {
  constructor(app, potentialLinks, activeFile, editor, plugin) {
    super(app);
    this.potentialLinks = potentialLinks;
    this.pageSize = plugin.settings.pageSize || 10;
    this.currentPage = 0;
    this.checkedLinks = new Set();
    this.activeFile = activeFile;
    this.editor = editor;
    this.plugin = plugin;

    // Initialize buttons and labels
    this.selectionCountLabel = null;
    this.previousButton = null;
    this.nextButton = null;
  }

  // Update page indicator
  updatePageIndicator(container) {
    const pageIndicator = container.querySelector('.page-indicator');
    if (pageIndicator) {
      pageIndicator.remove();
    }

    const totalPages = Math.ceil(this.potentialLinks.length / this.pageSize);
    if (totalPages > 1) {
      const indicator = container.createDiv({ cls: 'page-indicator', text: `Page ${this.currentPage + 1} of ${totalPages}` });
      indicator.style.marginTop = '10px';
      indicator.style.fontSize = '12px';
    }
  }

  // Modal opening
  onOpen() {
    const { contentEl } = this;

    contentEl.createEl('h2', { text: 'Note Link Matches' });

    // Enlarge the window
    contentEl.style.width = '800px';
    contentEl.style.height = '600px';

    // Customize appearance
    contentEl.style.borderRadius = '10px';
    contentEl.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    contentEl.style.padding = '20px';

    this.resultContainer = contentEl.createDiv({ cls: 'link-results' });
    this.resultContainer.style.fontSize = '12px';

    this.displayLinks();

    const footer = contentEl.createDiv({ cls: "linker-modal-footer" });
    footer.style.display = "flex";
    footer.style.justifyContent = "space-between";

    // Ajout des boutons "Select All" et "Select All on This Page"
    const selectAllButtonsContainer = footer.createDiv({ cls: "select-all-container" });

    new Setting(selectAllButtonsContainer)
      .addButton(btn => {
        btn.setButtonText('Select All')
          .onClick(() => this.selectAll());
      });

    new Setting(selectAllButtonsContainer)
      .addButton(btn => {
        btn.setButtonText('Select All on This Page')
          .onClick(() => this.selectAllOnPage());
      });

    // Dynamic label to show how many items are selected
    this.selectionCountLabel = footer.createEl('span', { text: `Selected: 0/${this.potentialLinks.length}` });

    // Bouton "Previous Page"
    this.previousButton = new Setting(footer)
      .addButton(btn => {
        btn.setButtonText('Previous Page')
          .onClick(() => this.changePage(-1));
      }).then(setting => setting.settingEl.querySelector('button'));

    // Bouton "Next Page"
    this.nextButton = new Setting(footer)
      .addButton(btn => {
        btn.setButtonText('Next Page')
          .onClick(() => this.changePage(1));
      }).then(setting => setting.settingEl.querySelector('button'));

    // Add a button to confirm
    new Setting(footer)
      .addButton(btn => {
        btn.setButtonText('Confirm')
          .setCta()
          .onClick(() => this.insertLinks());
      });

    this.updatePageIndicator(footer);
    this.updatePageButtons();  // Update buttons after loading links
    this.updateSelectionCount(); // Update the label for the number of selected items
  }

  // Function to display links on the current page
  displayLinks() {
    this.resultContainer.empty(); // Clear previous content

    const start = this.currentPage * this.pageSize;
    const end = Math.min(start + this.pageSize, this.potentialLinks.length);
    const linksToShow = this.potentialLinks.slice(start, end);

    linksToShow.forEach(linkObj => {
      const { title, context } = linkObj;
      const resultItem = this.resultContainer.createDiv({ cls: 'link-result-item' });

      // Create interactive checkboxes
      const checkbox = resultItem.createEl('input', { type: 'checkbox' });
      checkbox.checked = this.checkedLinks.has(linkObj); // Check if the item is already selected
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.checkedLinks.add(linkObj);
        } else {
          this.checkedLinks.delete(linkObj);
        }
        this.updateSelectionCount(); // Update the label after each selection/deselection
      });

      // Display the markdown-like format - [ ] title - context
      resultItem.createEl('span', { text: ` **${title}** - ${context}`, cls: 'link-item' });

      resultItem.style.marginBottom = '8px';
      resultItem.style.fontSize = '12px'; // Adjust font size for compactness
    });

    this.updatePageIndicator(this.resultContainer);
  }

  // Function to select all items
  selectAll() {
    this.potentialLinks.forEach(linkObj => {
      this.checkedLinks.add(linkObj);
    });
    this.displayLinks(); // Refresh the checkbox display
    this.updateSelectionCount(); // Update the label
  }

  // Function to select all items de la page actuelle
  selectAllOnPage() {
    const start = this.currentPage * this.pageSize;
    const end = Math.min(start + this.pageSize, this.potentialLinks.length);
    const linksToShow = this.potentialLinks.slice(start, end);

    linksToShow.forEach(linkObj => {
      this.checkedLinks.add(linkObj);
    });
    this.displayLinks(); // Refresh the checkbox display
    this.updateSelectionCount(); // Update the label
  }

  // Function to change page and display links
  changePage(delta) {
    const totalPages = Math.ceil(this.potentialLinks.length / this.pageSize);
    this.currentPage = (this.currentPage + delta + totalPages) % totalPages; // Circular navigation
    this.displayLinks(); // Reload results
    this.updatePageButtons(); // Update buttons
  }

  // Mise à jour des boutons "Previous" et "Next"
  updatePageButtons() {
    const totalPages = Math.ceil(this.potentialLinks.length / this.pageSize);
    
    if (totalPages <= 1) {
      this.previousButton.disabled = true;
      this.nextButton.disabled = true;
    } else {
      this.previousButton.disabled = (this.currentPage === 0);
      this.nextButton.disabled = (this.currentPage === totalPages - 1);
    }
  }

  // Function to update the number of selected items
  updateSelectionCount() {
    const selectedCount = this.checkedLinks.size;
    this.selectionCountLabel.setText(`Selected: ${selectedCount}/${this.potentialLinks.length}`);
  }

  // Insert links into the active note
  async insertLinks() {
    const linksToInsert = Array.from(this.checkedLinks);
    await this.plugin.insertLinks(this.activeFile, this.editor, linksToInsert);
    this.close();
  }

  // Close the modal
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}


// Settings tab to exclude folders and manage wikilink options
class NoteLinkerSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Note Linker Settings' });

    // Exclude certain folders
    new Setting(containerEl)
      .setName('Excluded Folders')
      .setDesc('Add folders to exclude from linking.')
      .addTextArea(text => text
        .setPlaceholder('Enter folder paths, one per line')
        .setValue(this.plugin.settings.excludedFolders?.join('\n') || '')
        .onChange(async (value) => {
          this.plugin.settings.excludedFolders = value.split('\n').map(folder => folder.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        }));

    // Setting to adjust the number of results per page
    new Setting(containerEl)
      .setName('Page Size')
      .setDesc('Number of link suggestions per page.')
      .addSlider(slider => slider
        .setLimits(5, 50, 1)
        .setValue(this.plugin.settings.pageSize)
        .onChange(async (value) => {
          this.plugin.settings.pageSize = value;
          await this.plugin.saveSettings();
        })
        .setDynamicTooltip());

    // Setting to enable/disable frontmatter scan
    new Setting(containerEl)
      .setName('Exclude Frontmatter')
      .setDesc('Exclude the frontmatter (YAML section) when scanning the note.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.excludeFrontmatter)
        .onChange(async (value) => {
          this.plugin.settings.excludeFrontmatter = value;
          await this.plugin.saveSettings();
        }));

    // Setting to enable wikilinks with display text
    new Setting(containerEl)
      .setName('Enable WikiLinks with Display Text')
      .setDesc('If enabled, will generate links in the format [[Page Title|Text]].')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableWikiLinks)
        .onChange(async (value) => {
          this.plugin.settings.enableWikiLinks = value;
          await this.plugin.saveSettings();
        }));

    // Paramètre pour respecter la casse (visible seulement si enableWikiLinks est activé)
    if (this.plugin.settings.enableWikiLinks) {
      new Setting(containerEl)
        .setName('Respect Case')
        .setDesc('If enabled, the original casing of the text will be preserved in the links (e.g., [[Page Title|tExT]]).')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.respectCase)
          .onChange(async (value) => {
            this.plugin.settings.respectCase = value;
            await this.plugin.saveSettings();
          }));
    }
  }
}
