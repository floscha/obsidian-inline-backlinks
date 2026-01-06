# Inline Backlinks

An Obsidian plugin that displays backlinks inline above your note content. Each linking note appears as a foldable element that reveals all lines containing links to the current file.

## Features

- **Inline Backlinks Panel**: Shows all notes that link to the current note at the top of the document.
- **Reading & Editing Mode**: Works seamlessly in both reading view and Live Preview/editing mode.
- **Compact & Foldable sections**: Each linking note is displayed as a collapsible section with a space-efficient design.
- **Line Preview**: Expand a section to see all lines from that note that contain wikilinks or markdown links to the current file.
- **Quick Navigation**: 
  - **Click** on any line to navigate directly to that location in the source file.
  - **Ctrl/Cmd+Click** on a note name to open it in a new tab.
- **Live Updates**: Automatically refreshes when you switch notes, change modes, or when backlinks are updated in the background.
- **Theme Support**: Native look and feel that adapts to your Obsidian theme (light/dark mode).

## Preview

*(Add screenshot or GIF here)*

## Installation

### Manual Installation

Since this plugin is in early development, you can install it manually:

1. Download `main.js`, `styles.css`, and `manifest.json` from the latest [Release](https://github.com/floscha/obsidian-inline-backlinks/releases).
2. Create a folder called `obsidian-inline-backlinks` in your vault's `.obsidian/plugins/` directory.
3. Copy the downloaded files into this folder.
4. Reload Obsidian and enable the plugin in **Settings → Community Plugins**.

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/floscha/obsidian-inline-backlinks.git
cd obsidian-inline-backlinks

# Install dependencies
npm install

# Build for development (with watch mode)
npm run dev

# Build for production
npm run build
```

### Testing locally

1. Create a symlink or copy the built files to your test vault:
   ```bash
   cp main.js styles.css manifest.json /path/to/your/vault/.obsidian/plugins/obsidian-inline-backlinks/
   ```
2. Reload Obsidian.
3. Enable the plugin in **Settings → Community Plugins**.

## Usage

Once enabled, the plugin automatically displays a backlinks panel above your note content whenever you open a note that has backlinks. 

- **Expand/Collapse**: Click on a note name to expand or collapse its matching lines.
- **Navigate to Line**: Click on any preview line to open the source file and jump to that specific line.
- **Open in New Tab**: Ctrl+Click (Cmd+Click on Mac) on a note name to open it in a new tab.

## License

MIT License - see [LICENSE](LICENSE) for details.
