# Word Search Puzzle Generator — Design Document

**Date:** 2026-02-23
**Status:** Approved
**Stack:** Electron + React + TypeScript + Vite

## Overview

A Windows desktop application for generating configurable word search puzzles. Supports interactive solving, print-ready PDF/PNG export, save/load word lists, concept-based word generation via web search, and extensive customization of both individual words and global puzzle settings.

**Target audience:** Personal/mature use. No content filtering.

## Architecture

### Electron Structure

- **Main Process** — file dialogs (save/load/export), PDF generation via `printToPDF()`, PNG generation, web search requests for concept word generation
- **Renderer Process** — React app with full UI
- **IPC Bridge** — main <-> renderer communication for export, file I/O, and web search

### React App Layout

```
+--------------------------------------------------+
|  Header: Title + Generate / Export buttons        |
+--------------------+-----------------------------+
|                    |                             |
|  Left Panel:       |  Main Area:                 |
|  - Word List       |  - Puzzle Grid (post-gen)   |
|  - + Add Word      |  - Interactive solver       |
|  - Search Words    |  - Word Bank / Hints        |
|                    |                             |
+--------------------+-----------------------------+
|  Bottom Panel: General Configurations             |
+--------------------------------------------------+
```

### State Management

React Context + `useReducer`. State shape:
- `words[]` — array of word entries with per-word configs
- `config{}` — general configuration object
- `puzzle{}` — generated grid, word positions, metadata
- `solverState{}` — found words, selection state

### Key Libraries

- `electron-vite` — build tooling
- `html2canvas` — PNG export
- Tailwind CSS or Radix UI — modern, polished styling

## Per-Word Configuration

Each word in the list has its own configuration card:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Word | string | (required) | The word to place |
| Optional | boolean | false | Word may or may not appear (chance-based) |
| CanRepeatedlySpawn | boolean | false | Word can appear multiple times |
| SpawnWeight | number | 1 | Probability weight (supports decimals). Affects Optional and CanRepeatedlySpawn behavior |
| Hint | string | "" | Hint text shown when ShowHints is enabled |

## General Configuration

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| Word Directions | multi-select | All except Reverse | Up, Down, UpwardHorizontal (diagonal up-right), DownwardHorizontal (diagonal down-right), Reverse (applies to all) |
| Filler Letters | string | "" (full alphabet) | Custom character set for empty cells |
| Letter Case | dropdown | Uppercase | Uppercase, Lowercase, or Both (case-sensitive) |
| Grid Size | x, y numbers | 15 x 15 | Puzzle dimensions |
| Title | string | "Input Title" | Title displayed above puzzle |
| Word Bank | boolean | true | Show word list below puzzle (with counts for repeats) |
| Show Hints | boolean | false | Show hints above word bank |
| Intersect Words | 1-5 | 3 | 1 = avoid intersections, 5 = maximize intersections |
| Generation Effort | 1-100 | 20 | Compute time for placement attempts |

## Display Settings

| Setting | Type | Description |
|---------|------|-------------|
| Font Family | dropdown | Monospace, sans-serif, serif, plus fun options |
| Font Size | number/slider | Dynamically updates grid preview |
| Cell Spacing | number/slider | Padding between letters |

All display changes apply live to the grid preview.

## Puzzle Generation Algorithm

### Step 1 — Build Word Placement List
1. Start with all words from the word list
2. For `Optional` words: roll against `SpawnWeight` to include/exclude
3. For `CanRepeatedlySpawn` words: roll additional copies based on `SpawnWeight`
4. Sort final list by word length (longest first)

### Step 2 — Place Words on Grid
1. Create empty X x Y grid
2. For each word:
   - Pick random valid direction from enabled directions
   - Pick random starting position
   - Score position based on Intersect Words setting (1 = penalize overlaps, 5 = reward overlaps, 3 = neutral)
   - Accept if no conflicts or valid intersection
   - Retry up to N attempts (scaled by Generation Effort: 1 -> ~50 attempts, 100 -> ~5000 attempts)
3. Skip words that can't be placed; note them for the user

### Step 3 — Fill Empty Cells
- Fill with random characters from Filler Letters set (or full alphabet if unset)
- Apply Letter Case rules to all letters

### Step 4 — Generate Metadata
- Build word bank with repeat counts
- Collect hints
- Store word positions for interactive solver

## Interactive Solver

- **Click** a letter to start selection
- **Drag/click** a second letter to highlight a line (snaps to valid directions)
- Matching words are "found": cells stay highlighted in a unique color, word crossed off in bank
- Each found word gets a different color from a cycling palette
- Progress indicator: "5 / 12 words found"
- "Reveal All" button for giving up

### Grid Rendering
DOM-based (`<div>` per cell) for:
- CSS styling and animations
- Accessibility
- Simple event handling
- Clean print/export capture

## Concept-Based Word Generation

- "Search Words" input in the word list panel
- User types a concept (e.g., "ocean animals")
- App fetches related words via web search (Node.js main process, using word-association APIs/sites)
- Returns word list with checkboxes for selection
- Selected words added with default configs
- Graceful fallback on network failure

No API keys required.

## Export

### PDF
- Electron `printToPDF()` on a dedicated print view
- Includes: title, grid (with chosen font/size), word bank, hints
- Optimized for Letter/A4 paper

### PNG
- `html2canvas` capture of print view
- Configurable resolution/quality

## Save/Load

- Save word list + all configs as JSON file
- Load JSON to restore full session
- Electron native file dialogs
