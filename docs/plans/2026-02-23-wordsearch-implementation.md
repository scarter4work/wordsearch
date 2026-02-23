# Word Search Puzzle Generator — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Electron desktop app that generates configurable word search puzzles with interactive solving, PDF/PNG export, save/load, and concept-based word generation.

**Architecture:** Electron main process handles file I/O, PDF/PNG export, and web search. React renderer manages the full UI with Context + useReducer state. Puzzle generation is a pure TypeScript module tested independently.

**Tech Stack:** Electron, React 18, TypeScript, Vite (via electron-vite), Tailwind CSS, Vitest, html2canvas

---

### Task 1: Scaffold Electron + React + Vite Project

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`
- Create: `src/main/index.ts`
- Create: `src/preload/index.ts`
- Create: `src/renderer/index.html`
- Create: `src/renderer/src/main.tsx`
- Create: `src/renderer/src/App.tsx`
- Create: `tailwind.config.js`, `postcss.config.js`
- Create: `src/renderer/src/index.css`

**Step 1: Initialize the project with electron-vite**

```bash
npm create @anthropic-ai/electron-vite@latest -- --template react-ts wordsearch-app
```

If this template isn't available, manually scaffold:

```bash
npm init -y
npm install electron electron-vite react react-dom
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 2: Configure electron-vite**

Create `electron.vite.config.ts`:
```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
```

**Step 3: Create minimal Electron main process**

Create `src/main/index.ts`:
```typescript
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
```

**Step 4: Create preload script**

Create `src/preload/index.ts`:
```typescript
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Will be populated with IPC methods in later tasks
})
```

**Step 5: Create minimal React app**

Create `src/renderer/src/App.tsx`:
```tsx
export default function App() {
  return <div className="min-h-screen bg-gray-900 text-white p-4">
    <h1 className="text-2xl font-bold">Word Search Generator</h1>
  </div>
}
```

**Step 6: Set up Tailwind CSS**

```bash
npx tailwindcss init -p
```

Configure `tailwind.config.js` to scan `src/renderer/src/**/*.{ts,tsx}`.

Create `src/renderer/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 7: Verify it runs**

```bash
npm run dev
```

Expected: Electron window opens showing "Word Search Generator" on a dark background.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Electron + React + Vite project with Tailwind"
```

---

### Task 2: Define TypeScript Types and State Management

**Files:**
- Create: `src/renderer/src/types.ts`
- Create: `src/renderer/src/state/puzzleReducer.ts`
- Create: `src/renderer/src/state/PuzzleContext.tsx`
- Test: `src/renderer/src/state/__tests__/puzzleReducer.test.ts`

**Step 1: Write types**

Create `src/renderer/src/types.ts`:
```typescript
export interface WordEntry {
  id: string
  word: string
  optional: boolean
  canRepeatedlySpawn: boolean
  spawnWeight: number
  hint: string
}

export type Direction = 'up' | 'down' | 'upwardHorizontal' | 'downwardHorizontal'

export type LetterCase = 'uppercase' | 'lowercase' | 'both'

export interface PuzzleConfig {
  directions: {
    up: boolean
    down: boolean
    upwardHorizontal: boolean
    downwardHorizontal: boolean
    reverse: boolean
  }
  fillerLetters: string
  letterCase: LetterCase
  gridWidth: number
  gridHeight: number
  title: string
  wordBank: boolean
  showHints: boolean
  intersectWords: number // 1-5
  generationEffort: number // 1-100
}

export interface DisplaySettings {
  fontFamily: string
  fontSize: number
  cellSpacing: number
}

export interface PlacedWord {
  word: string
  startRow: number
  startCol: number
  direction: string // includes reverse variants
  cells: Array<{ row: number; col: number }>
}

export interface GeneratedPuzzle {
  grid: string[][]
  placedWords: PlacedWord[]
  skippedWords: string[]
  wordCounts: Record<string, number>
  hints: Array<{ word: string; hint: string }>
}

export interface SolverState {
  foundWords: Set<string>
  selectionStart: { row: number; col: number } | null
  selectionEnd: { row: number; col: number } | null
  foundCells: Map<string, string> // "row,col" -> color
}

export interface AppState {
  words: WordEntry[]
  config: PuzzleConfig
  display: DisplaySettings
  puzzle: GeneratedPuzzle | null
  solver: SolverState
}
```

**Step 2: Write failing test for reducer**

Create `src/renderer/src/state/__tests__/puzzleReducer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { puzzleReducer, initialState } from '../puzzleReducer'

describe('puzzleReducer', () => {
  it('adds a word entry', () => {
    const state = puzzleReducer(initialState, {
      type: 'ADD_WORD',
      payload: { id: '1', word: 'TEST', optional: false, canRepeatedlySpawn: false, spawnWeight: 1, hint: '' }
    })
    expect(state.words).toHaveLength(1)
    expect(state.words[0].word).toBe('TEST')
  })

  it('removes a word entry', () => {
    const withWord = { ...initialState, words: [{ id: '1', word: 'TEST', optional: false, canRepeatedlySpawn: false, spawnWeight: 1, hint: '' }] }
    const state = puzzleReducer(withWord, { type: 'REMOVE_WORD', payload: '1' })
    expect(state.words).toHaveLength(0)
  })

  it('updates a word entry', () => {
    const withWord = { ...initialState, words: [{ id: '1', word: 'TEST', optional: false, canRepeatedlySpawn: false, spawnWeight: 1, hint: '' }] }
    const state = puzzleReducer(withWord, { type: 'UPDATE_WORD', payload: { id: '1', changes: { optional: true } } })
    expect(state.words[0].optional).toBe(true)
  })

  it('updates config', () => {
    const state = puzzleReducer(initialState, { type: 'UPDATE_CONFIG', payload: { title: 'My Puzzle' } })
    expect(state.config.title).toBe('My Puzzle')
  })

  it('updates display settings', () => {
    const state = puzzleReducer(initialState, { type: 'UPDATE_DISPLAY', payload: { fontSize: 20 } })
    expect(state.display.fontSize).toBe(20)
  })

  it('sets generated puzzle', () => {
    const puzzle = { grid: [['A']], placedWords: [], skippedWords: [], wordCounts: {}, hints: [] }
    const state = puzzleReducer(initialState, { type: 'SET_PUZZLE', payload: puzzle })
    expect(state.puzzle).toEqual(puzzle)
  })

  it('resets solver when new puzzle is generated', () => {
    const stateWithFound = { ...initialState, solver: { ...initialState.solver, foundWords: new Set(['TEST']) } }
    const puzzle = { grid: [['A']], placedWords: [], skippedWords: [], wordCounts: {}, hints: [] }
    const state = puzzleReducer(stateWithFound, { type: 'SET_PUZZLE', payload: puzzle })
    expect(state.solver.foundWords.size).toBe(0)
  })
})
```

**Step 3: Run tests to verify they fail**

```bash
npx vitest run src/renderer/src/state/__tests__/puzzleReducer.test.ts
```

Expected: FAIL — module not found.

**Step 4: Implement reducer**

Create `src/renderer/src/state/puzzleReducer.ts`:
```typescript
import type { AppState, WordEntry, PuzzleConfig, DisplaySettings, GeneratedPuzzle } from '../types'

export const initialState: AppState = {
  words: [],
  config: {
    directions: {
      up: true,
      down: true,
      upwardHorizontal: true,
      downwardHorizontal: true,
      reverse: false
    },
    fillerLetters: '',
    letterCase: 'uppercase',
    gridWidth: 15,
    gridHeight: 15,
    title: 'Input Title',
    wordBank: true,
    showHints: false,
    intersectWords: 3,
    generationEffort: 20
  },
  display: {
    fontFamily: 'monospace',
    fontSize: 16,
    cellSpacing: 4
  },
  puzzle: null,
  solver: {
    foundWords: new Set(),
    selectionStart: null,
    selectionEnd: null,
    foundCells: new Map()
  }
}

type Action =
  | { type: 'ADD_WORD'; payload: WordEntry }
  | { type: 'REMOVE_WORD'; payload: string }
  | { type: 'UPDATE_WORD'; payload: { id: string; changes: Partial<WordEntry> } }
  | { type: 'UPDATE_CONFIG'; payload: Partial<PuzzleConfig> }
  | { type: 'UPDATE_DISPLAY'; payload: Partial<DisplaySettings> }
  | { type: 'SET_PUZZLE'; payload: GeneratedPuzzle }
  | { type: 'SET_WORDS'; payload: WordEntry[] }
  | { type: 'MARK_WORD_FOUND'; payload: { word: string; cells: Array<{ row: number; col: number }>; color: string } }
  | { type: 'RESET_SOLVER' }
  | { type: 'SET_SELECTION'; payload: { start: { row: number; col: number } | null; end: { row: number; col: number } | null } }
  | { type: 'LOAD_STATE'; payload: { words: WordEntry[]; config: PuzzleConfig; display: DisplaySettings } }

export function puzzleReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_WORD':
      return { ...state, words: [...state.words, action.payload] }

    case 'REMOVE_WORD':
      return { ...state, words: state.words.filter(w => w.id !== action.payload) }

    case 'UPDATE_WORD':
      return {
        ...state,
        words: state.words.map(w =>
          w.id === action.payload.id ? { ...w, ...action.payload.changes } : w
        )
      }

    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } }

    case 'UPDATE_DISPLAY':
      return { ...state, display: { ...state.display, ...action.payload } }

    case 'SET_PUZZLE':
      return {
        ...state,
        puzzle: action.payload,
        solver: { foundWords: new Set(), selectionStart: null, selectionEnd: null, foundCells: new Map() }
      }

    case 'SET_WORDS':
      return { ...state, words: action.payload }

    case 'MARK_WORD_FOUND': {
      const newFoundWords = new Set(state.solver.foundWords)
      newFoundWords.add(action.payload.word)
      const newFoundCells = new Map(state.solver.foundCells)
      for (const cell of action.payload.cells) {
        newFoundCells.set(`${cell.row},${cell.col}`, action.payload.color)
      }
      return { ...state, solver: { ...state.solver, foundWords: newFoundWords, foundCells: newFoundCells, selectionStart: null, selectionEnd: null } }
    }

    case 'RESET_SOLVER':
      return { ...state, solver: { foundWords: new Set(), selectionStart: null, selectionEnd: null, foundCells: new Map() } }

    case 'SET_SELECTION':
      return { ...state, solver: { ...state.solver, selectionStart: action.payload.start, selectionEnd: action.payload.end } }

    case 'LOAD_STATE':
      return { ...state, words: action.payload.words, config: action.payload.config, display: action.payload.display, puzzle: null, solver: { foundWords: new Set(), selectionStart: null, selectionEnd: null, foundCells: new Map() } }

    default:
      return state
  }
}

export type { Action }
```

**Step 5: Run tests to verify they pass**

```bash
npx vitest run src/renderer/src/state/__tests__/puzzleReducer.test.ts
```

Expected: All 7 tests PASS.

**Step 6: Create React Context provider**

Create `src/renderer/src/state/PuzzleContext.tsx`:
```tsx
import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import { puzzleReducer, initialState, type Action } from './puzzleReducer'
import type { AppState } from '../types'

const PuzzleContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null)

export function PuzzleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(puzzleReducer, initialState)
  return <PuzzleContext.Provider value={{ state, dispatch }}>{children}</PuzzleContext.Provider>
}

export function usePuzzle() {
  const context = useContext(PuzzleContext)
  if (!context) throw new Error('usePuzzle must be used within PuzzleProvider')
  return context
}
```

**Step 7: Wrap App in PuzzleProvider**

Update `src/renderer/src/main.tsx` to wrap `<App />` in `<PuzzleProvider>`.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add TypeScript types, state reducer with tests, and context provider"
```

---

### Task 3: Puzzle Generation Engine (Core Algorithm)

**Files:**
- Create: `src/renderer/src/engine/generatePuzzle.ts`
- Create: `src/renderer/src/engine/directions.ts`
- Test: `src/renderer/src/engine/__tests__/generatePuzzle.test.ts`

**Step 1: Write direction vectors**

Create `src/renderer/src/engine/directions.ts`:
```typescript
export interface DirectionVector {
  name: string
  dRow: number
  dCol: number
}

// Base directions (non-reversed)
const BASE_DIRECTIONS: Record<string, DirectionVector> = {
  up: { name: 'up', dRow: -1, dCol: 0 },
  down: { name: 'down', dRow: 1, dCol: 0 },
  upwardHorizontal: { name: 'upwardHorizontal', dRow: -1, dCol: 1 },
  downwardHorizontal: { name: 'downwardHorizontal', dRow: 1, dCol: 1 }
}

// Reversed versions
const REVERSE_DIRECTIONS: Record<string, DirectionVector> = {
  up: { name: 'up-reverse', dRow: 1, dCol: 0 },
  down: { name: 'down-reverse', dRow: -1, dCol: 0 },
  upwardHorizontal: { name: 'upwardHorizontal-reverse', dRow: 1, dCol: -1 },
  downwardHorizontal: { name: 'downwardHorizontal-reverse', dRow: -1, dCol: -1 }
}

// Also need pure horizontal: left-to-right and right-to-left
// "down" direction with dRow:1, dCol:0 is vertical down
// We need horizontal right: dRow:0, dCol:1
// Re-interpreting the spec: Up = vertical up, Down = vertical down
// UpwardHorizontal = diagonal up-right, DownwardHorizontal = diagonal down-right
// But we also need plain horizontal. Let's add it as implied by "DownwardHorizontal" naming.
// Actually, looking at the spec again: the 4 base + reverse covers 8 directions.
// But we're missing pure horizontal (left-to-right). Let's add it.

export function getEnabledDirections(config: {
  up: boolean
  down: boolean
  upwardHorizontal: boolean
  downwardHorizontal: boolean
  reverse: boolean
}): DirectionVector[] {
  const dirs: DirectionVector[] = []

  // Add a horizontal-right direction always (standard word search has horizontal)
  dirs.push({ name: 'horizontal', dRow: 0, dCol: 1 })

  if (config.up) dirs.push(BASE_DIRECTIONS.up)
  if (config.down) dirs.push(BASE_DIRECTIONS.down)
  if (config.upwardHorizontal) dirs.push(BASE_DIRECTIONS.upwardHorizontal)
  if (config.downwardHorizontal) dirs.push(BASE_DIRECTIONS.downwardHorizontal)

  if (config.reverse) {
    dirs.push({ name: 'horizontal-reverse', dRow: 0, dCol: -1 })
    if (config.up) dirs.push(REVERSE_DIRECTIONS.up)
    if (config.down) dirs.push(REVERSE_DIRECTIONS.down)
    if (config.upwardHorizontal) dirs.push(REVERSE_DIRECTIONS.upwardHorizontal)
    if (config.downwardHorizontal) dirs.push(REVERSE_DIRECTIONS.downwardHorizontal)
  }

  return dirs
}
```

**Step 2: Write failing tests for puzzle generation**

Create `src/renderer/src/engine/__tests__/generatePuzzle.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { generatePuzzle } from '../generatePuzzle'
import type { WordEntry, PuzzleConfig } from '../../types'

const defaultConfig: PuzzleConfig = {
  directions: { up: true, down: true, upwardHorizontal: true, downwardHorizontal: true, reverse: false },
  fillerLetters: '',
  letterCase: 'uppercase',
  gridWidth: 15,
  gridHeight: 15,
  title: 'Test',
  wordBank: true,
  showHints: false,
  intersectWords: 3,
  generationEffort: 20
}

function makeWord(word: string, overrides?: Partial<WordEntry>): WordEntry {
  return { id: word, word, optional: false, canRepeatedlySpawn: false, spawnWeight: 1, hint: '', ...overrides }
}

describe('generatePuzzle', () => {
  it('returns a grid of correct dimensions', () => {
    const result = generatePuzzle([makeWord('HELLO')], { ...defaultConfig, gridWidth: 10, gridHeight: 10 })
    expect(result.grid).toHaveLength(10)
    expect(result.grid[0]).toHaveLength(10)
  })

  it('places a single short word successfully', () => {
    const result = generatePuzzle([makeWord('CAT')], defaultConfig)
    expect(result.placedWords).toHaveLength(1)
    expect(result.placedWords[0].word).toBe('CAT')
  })

  it('fills empty cells with filler letters', () => {
    const result = generatePuzzle([], { ...defaultConfig, gridWidth: 3, gridHeight: 3 })
    for (const row of result.grid) {
      for (const cell of row) {
        expect(cell).toMatch(/[A-Z]/)
      }
    }
  })

  it('uses custom filler letters when specified', () => {
    const result = generatePuzzle([], { ...defaultConfig, gridWidth: 5, gridHeight: 5, fillerLetters: 'XY' })
    for (const row of result.grid) {
      for (const cell of row) {
        expect('XY').toContain(cell)
      }
    }
  })

  it('applies uppercase letter case', () => {
    const result = generatePuzzle([makeWord('hello')], { ...defaultConfig, letterCase: 'uppercase' })
    expect(result.placedWords[0].word).toBe('HELLO')
  })

  it('applies lowercase letter case', () => {
    const result = generatePuzzle([makeWord('HELLO')], { ...defaultConfig, letterCase: 'lowercase' })
    expect(result.placedWords[0].word).toBe('hello')
  })

  it('skips optional words based on spawn logic', () => {
    // With spawnWeight 0, optional word should never appear
    const results = Array.from({ length: 10 }, () =>
      generatePuzzle([makeWord('RARE', { optional: true, spawnWeight: 0 })], defaultConfig)
    )
    expect(results.every(r => r.placedWords.length === 0)).toBe(true)
  })

  it('can place repeated words', () => {
    const result = generatePuzzle(
      [makeWord('HI', { canRepeatedlySpawn: true, spawnWeight: 3 })],
      { ...defaultConfig, generationEffort: 50 }
    )
    expect(result.placedWords.length).toBeGreaterThanOrEqual(1)
    expect(result.wordCounts['HI']).toBeGreaterThanOrEqual(1)
  })

  it('reports skipped words that could not be placed', () => {
    // Try to place a very long word in a tiny grid
    const result = generatePuzzle(
      [makeWord('SUPERLONGWORD')],
      { ...defaultConfig, gridWidth: 3, gridHeight: 3 }
    )
    expect(result.skippedWords).toContain('SUPERLONGWORD')
  })

  it('collects hints for placed words', () => {
    const result = generatePuzzle(
      [makeWord('CAT', { hint: 'A furry pet' })],
      defaultConfig
    )
    expect(result.hints).toEqual([{ word: 'CAT', hint: 'A furry pet' }])
  })

  it('builds word counts in metadata', () => {
    const result = generatePuzzle([makeWord('DOG'), makeWord('CAT')], defaultConfig)
    for (const pw of result.placedWords) {
      expect(result.wordCounts[pw.word]).toBe(1)
    }
  })

  it('stores cell positions for each placed word', () => {
    const result = generatePuzzle([makeWord('AB')], { ...defaultConfig, gridWidth: 5, gridHeight: 5 })
    if (result.placedWords.length > 0) {
      const placed = result.placedWords[0]
      expect(placed.cells).toHaveLength(2)
      // Verify the grid contains the word letters at those positions
      expect(result.grid[placed.cells[0].row][placed.cells[0].col]).toBe('A')
      expect(result.grid[placed.cells[1].row][placed.cells[1].col]).toBe('B')
    }
  })
})
```

**Step 3: Run tests to verify they fail**

```bash
npx vitest run src/renderer/src/engine/__tests__/generatePuzzle.test.ts
```

Expected: FAIL — module not found.

**Step 4: Implement puzzle generation**

Create `src/renderer/src/engine/generatePuzzle.ts`:
```typescript
import type { WordEntry, PuzzleConfig, GeneratedPuzzle, PlacedWord } from '../types'
import { getEnabledDirections, type DirectionVector } from './directions'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function generatePuzzle(words: WordEntry[], config: PuzzleConfig): GeneratedPuzzle {
  const directions = getEnabledDirections(config.directions)
  const maxAttempts = Math.round(50 + (config.generationEffort / 100) * 4950)

  // Step 1: Build placement list
  const placementList = buildPlacementList(words, config)

  // Step 2: Place words
  const grid: (string | null)[][] = Array.from({ length: config.gridHeight }, () =>
    Array(config.gridWidth).fill(null)
  )
  const placedWords: PlacedWord[] = []
  const skippedWords: string[] = []
  const wordCounts: Record<string, number> = {}

  // Sort by length descending (longest first = hardest to place)
  placementList.sort((a, b) => b.length - a.length)

  for (const word of placementList) {
    const placed = tryPlaceWord(word, grid, directions, config, maxAttempts)
    if (placed) {
      placedWords.push(placed)
      wordCounts[word] = (wordCounts[word] || 0) + 1
    } else {
      if (!skippedWords.includes(word)) skippedWords.push(word)
    }
  }

  // Step 3: Fill empty cells
  fillEmptyCells(grid, config)

  // Step 4: Collect hints
  const hints: Array<{ word: string; hint: string }> = []
  const seenHintWords = new Set<string>()
  for (const pw of placedWords) {
    const entry = words.find(w => applyCase(w.word, config.letterCase) === pw.word)
    if (entry?.hint && !seenHintWords.has(pw.word)) {
      hints.push({ word: pw.word, hint: entry.hint })
      seenHintWords.add(pw.word)
    }
  }

  return {
    grid: grid as string[][],
    placedWords,
    skippedWords,
    wordCounts,
    hints
  }
}

function buildPlacementList(words: WordEntry[], config: PuzzleConfig): string[] {
  const list: string[] = []

  for (const entry of words) {
    const word = applyCase(entry.word, config.letterCase)
    if (!word.trim()) continue

    if (entry.optional) {
      // Roll against spawnWeight: weight of 1 = 50% chance, 2 = ~75%, 0.5 = ~25%, 0 = never
      const chance = entry.spawnWeight / (entry.spawnWeight + 1)
      if (Math.random() >= chance) continue
    }

    list.push(word)

    if (entry.canRepeatedlySpawn) {
      // Add extra copies based on spawnWeight
      const extraCopies = Math.floor(entry.spawnWeight)
      for (let i = 0; i < extraCopies; i++) {
        list.push(word)
      }
    }
  }

  return list
}

function applyCase(word: string, letterCase: string): string {
  if (letterCase === 'uppercase') return word.toUpperCase()
  if (letterCase === 'lowercase') return word.toLowerCase()
  return word // 'both' preserves original case
}

function tryPlaceWord(
  word: string,
  grid: (string | null)[][],
  directions: DirectionVector[],
  config: PuzzleConfig,
  maxAttempts: number
): PlacedWord | null {
  const rows = grid.length
  const cols = grid[0].length

  let bestPlacement: PlacedWord | null = null
  let bestScore = -Infinity

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const dir = directions[Math.floor(Math.random() * directions.length)]
    const startRow = Math.floor(Math.random() * rows)
    const startCol = Math.floor(Math.random() * cols)

    const cells: Array<{ row: number; col: number }> = []
    let valid = true
    let intersections = 0

    for (let i = 0; i < word.length; i++) {
      const r = startRow + dir.dRow * i
      const c = startCol + dir.dCol * i

      if (r < 0 || r >= rows || c < 0 || c >= cols) { valid = false; break }

      const existing = grid[r][c]
      if (existing !== null && existing !== word[i]) { valid = false; break }
      if (existing === word[i]) intersections++

      cells.push({ row: r, col: c })
    }

    if (!valid) continue

    // Score based on intersect preference
    const intersectNorm = (config.intersectWords - 3) / 2 // -1 to 1
    const score = intersections * intersectNorm + Math.random() * 0.1

    if (score > bestScore || bestPlacement === null) {
      bestScore = score
      bestPlacement = { word, startRow, startCol, direction: dir.name, cells }
    }

    // For low effort, accept first valid placement quickly
    if (bestPlacement && attempt > maxAttempts * 0.3) break
  }

  if (bestPlacement) {
    // Write to grid
    for (let i = 0; i < word.length; i++) {
      const { row, col } = bestPlacement.cells[i]
      grid[row][col] = word[i]
    }
  }

  return bestPlacement
}

function fillEmptyCells(grid: (string | null)[][], config: PuzzleConfig): void {
  const fillerSet = config.fillerLetters || ALPHABET
  const chars = config.letterCase === 'lowercase'
    ? fillerSet.toLowerCase()
    : config.letterCase === 'uppercase'
    ? fillerSet.toUpperCase()
    : fillerSet

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = chars[Math.floor(Math.random() * chars.length)]
      }
    }
  }
}
```

**Step 5: Run tests to verify they pass**

```bash
npx vitest run src/renderer/src/engine/__tests__/generatePuzzle.test.ts
```

Expected: All tests PASS.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement puzzle generation engine with direction support and tests"
```

---

### Task 4: Word List Panel UI

**Files:**
- Create: `src/renderer/src/components/WordListPanel.tsx`
- Create: `src/renderer/src/components/WordCard.tsx`
- Modify: `src/renderer/src/App.tsx`

**Step 1: Build WordCard component**

Create `src/renderer/src/components/WordCard.tsx` — a collapsible card for each word showing:
- Word text input (prominent)
- Toggle for Optional
- Toggle for CanRepeatedlySpawn
- Number input for SpawnWeight
- Text input for Hint
- Delete button (trash icon)

Style with Tailwind: dark card (`bg-gray-800`), rounded corners, subtle border, smooth expand/collapse animation.

**Step 2: Build WordListPanel component**

Create `src/renderer/src/components/WordListPanel.tsx`:
- Scrollable list of `WordCard` components
- "+" button at the top to add a new word (dispatches `ADD_WORD` with a generated UUID)
- Each card dispatches `UPDATE_WORD` / `REMOVE_WORD`
- Uses `usePuzzle()` hook for state

**Step 3: Integrate into App layout**

Update `src/renderer/src/App.tsx` to use the two-column layout:
- Left column (fixed width ~320px): `WordListPanel`
- Right column: placeholder "Puzzle area" for now
- Bottom bar: placeholder "Configuration" for now

**Step 4: Verify visually**

```bash
npm run dev
```

Expected: App shows left panel with "+" button. Clicking adds word cards with all config fields. Cards can be deleted.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add word list panel with configurable word cards"
```

---

### Task 5: General Configuration Panel UI

**Files:**
- Create: `src/renderer/src/components/ConfigPanel.tsx`
- Create: `src/renderer/src/components/DisplaySettingsPanel.tsx`
- Modify: `src/renderer/src/App.tsx`

**Step 1: Build ConfigPanel**

Create `src/renderer/src/components/ConfigPanel.tsx` — a collapsible bottom panel or sidebar section with:
- **Directions**: 5 checkboxes (Up, Down, UpwardHorizontal, DownwardHorizontal, Reverse)
- **Filler Letters**: text input
- **Letter Case**: dropdown (Uppercase / Lowercase / Both)
- **Grid Size**: two number inputs (X, Y) side by side
- **Title**: text input
- **Word Bank**: checkbox
- **Show Hints**: checkbox
- **Intersect Words**: slider 1-5 with labels
- **Generation Effort**: slider 1-100

All inputs dispatch `UPDATE_CONFIG`.

**Step 2: Build DisplaySettingsPanel**

Create `src/renderer/src/components/DisplaySettingsPanel.tsx`:
- **Font Family**: dropdown with options (Courier New, Arial, Georgia, Comic Sans MS, Impact, Consolas)
- **Font Size**: slider/number input (8-48, default 16)
- **Cell Spacing**: slider/number input (0-16, default 4)

All inputs dispatch `UPDATE_DISPLAY`.

**Step 3: Integrate into App layout**

Place ConfigPanel and DisplaySettingsPanel in the bottom panel area or as a toggleable settings drawer.

**Step 4: Verify visually**

```bash
npm run dev
```

Expected: All config controls appear and update state when changed.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add general configuration and display settings panels"
```

---

### Task 6: Puzzle Grid Rendering and Generate Button

**Files:**
- Create: `src/renderer/src/components/PuzzleGrid.tsx`
- Create: `src/renderer/src/components/WordBankDisplay.tsx`
- Create: `src/renderer/src/components/Header.tsx`
- Modify: `src/renderer/src/App.tsx`

**Step 1: Build Header with Generate button**

Create `src/renderer/src/components/Header.tsx`:
- App title
- "Generate" button — calls `generatePuzzle()` with current words + config, dispatches `SET_PUZZLE`
- Export buttons (PDF / PNG) — placeholder for now

**Step 2: Build PuzzleGrid component**

Create `src/renderer/src/components/PuzzleGrid.tsx`:
- Renders `puzzle.grid` as a CSS Grid of `<div>` cells
- Applies display settings (fontFamily, fontSize, cellSpacing) as inline styles
- Each cell shows one letter, centered
- Styled: `bg-gray-700` cells with `rounded` corners, subtle gap between cells
- If no puzzle generated yet, show a placeholder message

**Step 3: Build WordBankDisplay**

Create `src/renderer/src/components/WordBankDisplay.tsx`:
- Shows word list below the grid (if `config.wordBank` is true)
- Displays word counts for repeated words (e.g., "HELLO (x2)")
- Shows hints section above word bank (if `config.showHints` is true)

**Step 4: Integrate into App**

Wire up Header, PuzzleGrid, and WordBankDisplay into the main area.

**Step 5: Test end-to-end**

```bash
npm run dev
```

Expected: Add some words, click Generate, see a word search puzzle grid with word bank below.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add puzzle grid rendering, word bank, and generate button"
```

---

### Task 7: Interactive Solver

**Files:**
- Create: `src/renderer/src/components/SolverOverlay.tsx`
- Create: `src/renderer/src/engine/solverUtils.ts`
- Modify: `src/renderer/src/components/PuzzleGrid.tsx`
- Test: `src/renderer/src/engine/__tests__/solverUtils.test.ts`

**Step 1: Write failing test for solver line detection**

Create `src/renderer/src/engine/__tests__/solverUtils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { getLineCells, checkWordMatch } from '../solverUtils'
import type { PlacedWord } from '../../types'

describe('getLineCells', () => {
  it('returns cells in a horizontal line', () => {
    const cells = getLineCells({ row: 0, col: 0 }, { row: 0, col: 3 })
    expect(cells).toEqual([
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }
    ])
  })

  it('returns cells in a diagonal line', () => {
    const cells = getLineCells({ row: 0, col: 0 }, { row: 2, col: 2 })
    expect(cells).toEqual([
      { row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }
    ])
  })

  it('returns null for non-aligned points', () => {
    const cells = getLineCells({ row: 0, col: 0 }, { row: 1, col: 3 })
    expect(cells).toBeNull()
  })
})

describe('checkWordMatch', () => {
  it('matches a placed word by cells', () => {
    const placed: PlacedWord[] = [{
      word: 'CAT', startRow: 0, startCol: 0, direction: 'horizontal',
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
    }]
    const grid = [['C', 'A', 'T', 'X'], ['X', 'X', 'X', 'X']]
    const selectedCells = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
    expect(checkWordMatch(selectedCells, grid, placed)).toBe('CAT')
  })

  it('returns null for non-matching selection', () => {
    const placed: PlacedWord[] = [{
      word: 'CAT', startRow: 0, startCol: 0, direction: 'horizontal',
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
    }]
    const grid = [['C', 'A', 'T', 'X'], ['X', 'X', 'X', 'X']]
    const selectedCells = [{ row: 0, col: 0 }, { row: 0, col: 1 }]
    expect(checkWordMatch(selectedCells, grid, placed)).toBeNull()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/renderer/src/engine/__tests__/solverUtils.test.ts
```

**Step 3: Implement solver utilities**

Create `src/renderer/src/engine/solverUtils.ts`:
```typescript
import type { PlacedWord } from '../types'

type Cell = { row: number; col: number }

export function getLineCells(start: Cell, end: Cell): Cell[] | null {
  const dRow = end.row - start.row
  const dCol = end.col - start.col

  // Must be aligned: horizontal, vertical, or 45-degree diagonal
  const absR = Math.abs(dRow)
  const absC = Math.abs(dCol)
  if (absR !== 0 && absC !== 0 && absR !== absC) return null

  const steps = Math.max(absR, absC)
  if (steps === 0) return [{ ...start }]

  const stepR = dRow / steps
  const stepC = dCol / steps
  const cells: Cell[] = []
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + stepR * i, col: start.col + stepC * i })
  }
  return cells
}

export function checkWordMatch(
  selectedCells: Cell[],
  grid: string[][],
  placedWords: PlacedWord[]
): string | null {
  // Build string from selected cells
  const selectedStr = selectedCells.map(c => grid[c.row]?.[c.col] ?? '').join('')
  const reversedStr = selectedStr.split('').reverse().join('')

  for (const pw of placedWords) {
    if (pw.cells.length !== selectedCells.length) continue
    // Check if cells match exactly (forward or reverse)
    const forwardMatch = pw.cells.every((c, i) => c.row === selectedCells[i].row && c.col === selectedCells[i].col)
    const reverseMatch = pw.cells.every((c, i) => c.row === selectedCells[selectedCells.length - 1 - i].row && c.col === selectedCells[selectedCells.length - 1 - i].col)
    if (forwardMatch || reverseMatch) return pw.word
  }
  return null
}
```

**Step 4: Run tests**

```bash
npx vitest run src/renderer/src/engine/__tests__/solverUtils.test.ts
```

Expected: PASS.

**Step 5: Add click/drag interaction to PuzzleGrid**

Modify `src/renderer/src/components/PuzzleGrid.tsx`:
- On mousedown on a cell: set `selectionStart`
- On mouseenter while dragging: compute line from start to current cell, highlight preview
- On mouseup: check if selection matches a placed word, if so dispatch `MARK_WORD_FOUND`
- Found cells display with their assigned color (cycling palette)
- Show progress: "X / Y words found"
- Add "Reveal All" button

**Step 6: Color palette**

Use a fixed palette of 12+ distinct colors that cycle for each found word.

**Step 7: Verify interactively**

```bash
npm run dev
```

Expected: Generate a puzzle, click-drag to select letters, matching words highlight in color and cross off from word bank.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: add interactive puzzle solver with click-drag selection"
```

---

### Task 8: PDF and PNG Export

**Files:**
- Create: `src/renderer/src/components/PrintView.tsx`
- Modify: `src/main/index.ts` — add IPC handlers for export
- Modify: `src/preload/index.ts` — expose export APIs

**Step 1: Create PrintView component**

Create `src/renderer/src/components/PrintView.tsx`:
- A hidden (off-screen) component rendered only during export
- Clean layout: Title at top, puzzle grid centered, hints (if enabled), word bank at bottom
- Uses display settings for font/size
- White background, black text for print clarity
- No interactive elements

**Step 2: Add IPC handlers in main process**

Modify `src/main/index.ts`:
```typescript
import { ipcMain, dialog } from 'electron'

ipcMain.handle('export-pdf', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  const { filePath } = await dialog.showSaveDialog(win, {
    defaultPath: 'wordsearch.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (!filePath) return
  const pdf = await win.webContents.printToPDF({ printBackground: true })
  await writeFile(filePath, pdf)
  return filePath
})

ipcMain.handle('export-png', async (_event, dataUrl: string) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return
  const { filePath } = await dialog.showSaveDialog(win, {
    defaultPath: 'wordsearch.png',
    filters: [{ name: 'PNG', extensions: ['png'] }]
  })
  if (!filePath) return
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  await writeFile(filePath, Buffer.from(base64, 'base64'))
  return filePath
})
```

**Step 3: Expose in preload**

Modify `src/preload/index.ts`:
```typescript
contextBridge.exposeInMainWorld('api', {
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  exportPng: (dataUrl: string) => ipcRenderer.invoke('export-png', dataUrl)
})
```

**Step 4: Install html2canvas and wire up PNG export**

```bash
npm install html2canvas
```

In the Header export button handler:
- For PNG: render PrintView, use `html2canvas` to capture it, call `window.api.exportPng(canvas.toDataURL())`
- For PDF: switch to PrintView layout, call `window.api.exportPdf()`, switch back

**Step 5: Verify exports**

```bash
npm run dev
```

Generate a puzzle, click Export PDF and Export PNG. Verify files are saved correctly.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add PDF and PNG export with print-ready layout"
```

---

### Task 9: Save/Load Word Lists

**Files:**
- Modify: `src/main/index.ts` — add save/load IPC handlers
- Modify: `src/preload/index.ts` — expose save/load APIs
- Modify: `src/renderer/src/components/Header.tsx` — add Save/Load buttons

**Step 1: Define save file format**

JSON file containing:
```typescript
{
  version: 1,
  words: WordEntry[],
  config: PuzzleConfig,
  display: DisplaySettings
}
```

**Step 2: Add IPC handlers**

In `src/main/index.ts`:
```typescript
ipcMain.handle('save-project', async (event, data: string) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  const { filePath } = await dialog.showSaveDialog(win, {
    defaultPath: 'wordsearch.json',
    filters: [{ name: 'Word Search Project', extensions: ['json'] }]
  })
  if (!filePath) return
  await writeFile(filePath, data, 'utf-8')
  return filePath
})

ipcMain.handle('load-project', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  const { filePaths } = await dialog.showOpenDialog(win, {
    filters: [{ name: 'Word Search Project', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (!filePaths.length) return
  const content = await readFile(filePaths[0], 'utf-8')
  return content
})
```

**Step 3: Expose in preload**

```typescript
saveProject: (data: string) => ipcRenderer.invoke('save-project', data),
loadProject: () => ipcRenderer.invoke('load-project')
```

**Step 4: Wire up Header buttons**

- Save: serialize `{ version: 1, words, config, display }` to JSON, call `window.api.saveProject()`
- Load: call `window.api.loadProject()`, parse JSON, dispatch `LOAD_STATE`

**Step 5: Verify**

Save a project, close app, reopen, load the project. All words and configs restored.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add save/load word list projects as JSON files"
```

---

### Task 10: Concept-Based Word Generation (Web Search)

**Files:**
- Create: `src/renderer/src/components/WordSearchModal.tsx`
- Modify: `src/main/index.ts` — add web search IPC handler
- Modify: `src/preload/index.ts` — expose search API

**Step 1: Add search IPC handler in main process**

In `src/main/index.ts`:
```typescript
ipcMain.handle('search-words', async (_event, concept: string) => {
  try {
    // Use Datamuse API (free, no key needed) for word associations
    const url = `https://api.datamuse.com/words?ml=${encodeURIComponent(concept)}&max=50`
    const response = await fetch(url)
    const data = await response.json()
    return data.map((item: { word: string; score: number }) => item.word)
  } catch {
    return []
  }
})
```

**Step 2: Expose in preload**

```typescript
searchWords: (concept: string) => ipcRenderer.invoke('search-words', concept)
```

**Step 3: Build WordSearchModal**

Create `src/renderer/src/components/WordSearchModal.tsx`:
- Text input for concept
- "Search" button
- Results list with checkboxes
- "Add Selected" button that dispatches `ADD_WORD` for each selected word with default configs
- Loading state and error/empty state handling
- Modal overlay with dark backdrop

**Step 4: Add trigger button in WordListPanel**

Add a "Search Words" button (magnifying glass icon) next to the "+" button.

**Step 5: Verify**

```bash
npm run dev
```

Type "ocean animals" in search, see results like "whale", "dolphin", "shark". Select some, add them.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add concept-based word generation using Datamuse API"
```

---

### Task 11: Polish UI and Final Styling

**Files:**
- Modify: Various component files for styling
- Modify: `src/renderer/src/index.css` — global styles and animations

**Step 1: Apply modern, polished design**

- Dark theme with gradient accents
- Rounded cards with subtle shadows (`shadow-lg`)
- Smooth transitions on hover/focus states
- Collapsible sections with animation
- Custom styled sliders for Intersect Words and Generation Effort
- Responsive layout (panels resize gracefully)
- Custom scrollbar styling for the word list

**Step 2: Add loading/generating state**

- Show a spinner or progress animation while puzzle generates
- Disable Generate button during generation

**Step 3: Add toasts/notifications**

- "Puzzle generated! X words placed, Y skipped"
- "Project saved to [filename]"
- "Export complete"

**Step 4: Verify everything works end-to-end**

Full workflow: Add words -> configure settings -> generate -> solve interactively -> export PDF + PNG -> save project -> load project.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish UI with modern styling, animations, and notifications"
```

---

### Task 12: Build Windows Installer

**Files:**
- Modify: `package.json` — add build config
- Create: `electron-builder.yml`

**Step 1: Install electron-builder**

```bash
npm install -D electron-builder
```

**Step 2: Configure electron-builder**

Create `electron-builder.yml`:
```yaml
appId: com.wordsearch.generator
productName: Word Search Generator
win:
  target:
    - nsis
  icon: resources/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

**Step 3: Add build script to package.json**

```json
{
  "scripts": {
    "build": "electron-vite build",
    "package": "electron-vite build && electron-builder --win"
  }
}
```

**Step 4: Create app icon**

Create a simple icon for the app (or use a placeholder).

**Step 5: Build**

```bash
npm run package
```

Expected: Produces a `.exe` installer in `dist/`.

**Step 6: Test installation**

Install and run the built app on Windows. Verify all features work.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Windows installer build configuration"
```

---

## Task Dependencies

```
Task 1 (Scaffold) ──> Task 2 (Types/State) ──> Task 3 (Engine)
                                              ──> Task 4 (Word List UI)
                                              ──> Task 5 (Config UI)

Tasks 3+4+5 ──> Task 6 (Grid + Generate) ──> Task 7 (Solver)
                                           ──> Task 8 (Export)
                                           ──> Task 9 (Save/Load)
                                           ──> Task 10 (Word Search)

Tasks 7-10 ──> Task 11 (Polish) ──> Task 12 (Windows Build)
```

Tasks 4, 5 can run in parallel with Task 3.
Tasks 7, 8, 9, 10 can run in parallel after Task 6.
