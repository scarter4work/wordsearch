# Word Search Generator

A desktop application for creating, solving, and exporting custom word search puzzles.

**[Download the latest Windows installer](https://github.com/scarter4work/wordsearch/releases/latest)**

## Features

- **Configurable Puzzle Generation** — Set grid size, word directions (up, down, diagonal, reverse), filler letters, letter case, intersection density, and generation effort
- **Word List Management** — Add words manually or search by concept (e.g. "ocean animals") using the built-in word search powered by Datamuse
- **Per-Word Settings** — Mark words as optional, allow repeated spawning, set spawn weight, and add hints
- **Interactive Solver** — Click and drag across the grid to find words; found words highlight in color
- **PDF & PNG Export** — Pixel-perfect exports with title, grid, hints, and word bank
- **Save & Load Projects** — Save your word lists and configuration as JSON files to pick up later
- **Display Customization** — Change font family, font size, and cell spacing in real time

## Installation (Windows)

1. Go to the [Releases](https://github.com/scarter4work/wordsearch/releases/latest) page
2. Download **`Word.Search.Generator.Setup.1.0.0.exe`**
3. Run the installer — choose your install directory
4. Launch from the desktop or start menu shortcut

> **Note:** Windows SmartScreen may show an "Unknown publisher" warning on first run. Click "More info" → "Run anyway" to proceed.

## Usage

1. **Add Words** — Type words in the left panel, or click "Search" to find words by concept
2. **Configure** — Expand the Configuration panel to set grid size, directions, title, etc.
3. **Generate** — Click the blue "Generate" button to create the puzzle
4. **Solve** — Click and drag on the grid to find words interactively
5. **Export** — Click PDF or PNG to save a print-ready version

## Building from Source

```bash
git clone https://github.com/scarter4work/wordsearch.git
cd wordsearch
npm install
npm run dev          # Development mode
npm run test         # Run tests
npm run build:win    # Build Windows installer
```

## Tech Stack

- Electron 40 + React 19 + TypeScript
- Vite (via electron-vite)
- Tailwind CSS
- Canvas API for export rendering
- Datamuse API for concept-based word generation
- Vitest (28 tests)
