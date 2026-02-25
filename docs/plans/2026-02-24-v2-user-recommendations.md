# WordSearch V2 User Recommendations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all 12 user-reported UX improvements: layout restructure, generation reliability, compact word list, deferred input validation, selection highlight fix, circled found words, duplicate word finding, grid styling, clear all button, font improvements, export scaling, and case behavior fix.

**Architecture:** Layout-first approach — restructure the sidebar/settings layout first since it touches the most components, then layer in engine fixes (generation, case), solver improvements (circles, duplicates), and visual polish (fonts, selection, export scaling).

**Tech Stack:** React 19, TypeScript, Tailwind CSS 3, Electron (renderer process only for these changes), Canvas API for export.

---

### Task 1: Types & Reducer — Add "preserve" and "random" case options (#12)

**Files:**
- Modify: `src/renderer/src/types.ts:12` — extend `LetterCase` union
- Modify: `src/renderer/src/state/puzzleReducer.ts` — no changes needed (generic partial updates)

**Step 1: Update LetterCase type**

In `src/renderer/src/types.ts`, change line 12:

```ts
// Before:
export type LetterCase = 'uppercase' | 'lowercase' | 'both'

// After:
export type LetterCase = 'uppercase' | 'lowercase' | 'preserve' | 'random'
```

**Step 2: Update generatePuzzle.ts applyCase**

In `src/renderer/src/engine/generatePuzzle.ts`, replace `applyCase`:

```ts
function applyCase(word: string, letterCase: string): string {
  if (letterCase === 'lowercase') return word.toLowerCase()
  if (letterCase === 'uppercase') return word.toUpperCase()
  if (letterCase === 'preserve') return word  // keep original casing as entered
  // 'random' — randomly pick upper/lower per character
  return word
    .split('')
    .map((ch) => (Math.random() < 0.5 ? ch.toUpperCase() : ch.toLowerCase()))
    .join('')
}
```

Also update `randomChar` to handle the new cases:

```ts
function randomChar(fillerLetters: string, letterCase: string): string {
  const pool = fillerLetters.length > 0 ? fillerLetters.toUpperCase() : ALPHABET
  const ch = pool[Math.floor(Math.random() * pool.length)]
  if (letterCase === 'lowercase') return ch.toLowerCase()
  if (letterCase === 'uppercase') return ch.toUpperCase()
  // 'preserve' and 'random' both get random case for filler
  return Math.random() < 0.5 ? ch.toUpperCase() : ch.toLowerCase()
}
```

**Step 3: Update ConfigPanel dropdown**

In `src/renderer/src/components/ConfigPanel.tsx`, replace the Letter Case `<select>` options:

```tsx
<option value="uppercase">Uppercase</option>
<option value="lowercase">Lowercase</option>
<option value="preserve">Preserve</option>
<option value="random">Random</option>
```

**Step 4: Commit**

```bash
git add src/renderer/src/types.ts src/renderer/src/engine/generatePuzzle.ts src/renderer/src/components/ConfigPanel.tsx
git commit -m "feat: replace 'Both' case with 'Preserve' and 'Random' options (#12)"
```

---

### Task 2: Generation Retry Logic (#1)

**Files:**
- Modify: `src/renderer/src/engine/generatePuzzle.ts:114-176` — add retry with escalating attempts

**Step 1: Add targeted placement helper**

Add this function before `generatePuzzle()` in `generatePuzzle.ts`:

```ts
function tryPlaceTargeted(
  grid: (string | null)[][],
  word: string,
  directions: DirectionVector[],
  maxAttempts: number,
  intersectNorm: number
): PlacementCandidate | null {
  const height = grid.length
  const width = grid[0].length

  // Collect cells where existing letters match any letter in the word
  const matchingCells: Array<{ row: number; col: number; charIdx: number }> = []
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] !== null) {
        for (let ci = 0; ci < word.length; ci++) {
          if (grid[r][c] === word[ci]) {
            matchingCells.push({ row: r, col: c, charIdx: ci })
          }
        }
      }
    }
  }

  if (matchingCells.length === 0) return null

  let best: PlacementCandidate | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const match = matchingCells[Math.floor(Math.random() * matchingCells.length)]
    const dir = directions[Math.floor(Math.random() * directions.length)]

    // Calculate starting position so word[charIdx] lands on the matching cell
    const startRow = match.row - dir.dRow * match.charIdx
    const startCol = match.col - dir.dCol * match.charIdx

    const endRow = startRow + dir.dRow * (word.length - 1)
    const endCol = startCol + dir.dCol * (word.length - 1)
    if (startRow < 0 || startRow >= height || startCol < 0 || startCol >= width) continue
    if (endRow < 0 || endRow >= height || endCol < 0 || endCol >= width) continue

    let valid = true
    let intersections = 0
    const cells: Array<{ row: number; col: number }> = []

    for (let i = 0; i < word.length; i++) {
      const r = startRow + dir.dRow * i
      const c = startCol + dir.dCol * i
      const existing = grid[r][c]
      if (existing !== null && existing !== word[i]) {
        valid = false
        break
      }
      if (existing === word[i]) intersections++
      cells.push({ row: r, col: c })
    }

    if (!valid) continue

    const score = intersections * intersectNorm + Math.random() * 0.1
    if (best === null || score > best.score) {
      best = { row: startRow, col: startCol, dir, score, cells }
    }
    if (best.score > 1) break
  }

  return best
}
```

**Step 2: Update generatePuzzle loop to retry with escalating attempts**

Replace the placement loop in `generatePuzzle()`:

```ts
for (const entry of placementList) {
  const candidate =
    tryPlace(grid, entry.word, directions, maxAttempts, intersectNorm) ??
    tryPlace(grid, entry.word, directions, maxAttempts * 2, intersectNorm) ??
    tryPlaceTargeted(grid, entry.word, directions, maxAttempts * 2, intersectNorm)

  if (candidate) {
    for (let i = 0; i < entry.word.length; i++) {
      const r = candidate.cells[i].row
      const c = candidate.cells[i].col
      grid[r][c] = entry.word[i]
    }

    placedWords.push({
      word: entry.word,
      startRow: candidate.row,
      startCol: candidate.col,
      direction: candidate.dir.name,
      cells: candidate.cells
    })

    wordCounts[entry.word] = (wordCounts[entry.word] || 0) + 1

    if (entry.hint) {
      hints.push({ word: entry.word, hint: entry.hint })
    }
  } else {
    if (!skippedWords.includes(entry.word)) {
      skippedWords.push(entry.word)
    }
  }
}
```

**Step 3: Run tests**

```bash
npx vitest run src/renderer/src/engine/__tests__/
```

**Step 4: Commit**

```bash
git add src/renderer/src/engine/generatePuzzle.ts
git commit -m "feat: smarter word placement with escalating retries and targeted placement (#1)"
```

---

### Task 3: Layout Restructure — Move Settings to Left Sidebar (#3)

**Files:**
- Modify: `src/renderer/src/App.tsx` — remove bottom settings panel, move config/display into left area
- Modify: `src/renderer/src/components/WordListPanel.tsx` — accept settings panels as children or render them inline

**Step 1: Restructure App.tsx layout**

Replace the App component's return to place ConfigPanel and DisplaySettingsPanel above the WordListPanel content in the left sidebar:

```tsx
export default function App() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      )
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 200)
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className="flex flex-col h-screen bg-gray-950 text-white">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar: settings + word list */}
          <div className="w-80 flex-shrink-0 border-r border-gray-800 flex flex-col bg-gray-950 overflow-y-auto">
            <ConfigPanel />
            <DisplaySettingsPanel />
            <WordListPanel />
          </div>
          {/* Right: puzzle area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-6">
              <PuzzleGrid />
              <WordBankDisplay />
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} />
      </div>
    </ToastContext.Provider>
  )
}
```

Remove the `showSettings` state and bottom settings toggle entirely.

**Step 2: Update WordListPanel to not include its own outer container width**

Remove the `w-80 flex-shrink-0 border-r border-gray-800` wrapper from WordListPanel since the parent now provides it. Change the root element to:

```tsx
<div className="flex flex-col flex-1 min-h-0">
```

The `min-h-0` ensures the word list can scroll within the flex column.

**Step 3: Verify layout works**

```bash
npm run dev
```

**Step 4: Commit**

```bash
git add src/renderer/src/App.tsx src/renderer/src/components/WordListPanel.tsx
git commit -m "feat: move settings panels to left sidebar above word list (#3)"
```

---

### Task 4: Compact Word List Redesign (#2)

**Files:**
- Rewrite: `src/renderer/src/components/WordCard.tsx` — compact single-line with popover

**Step 1: Rewrite WordCard as a compact inline row**

Replace `WordCard.tsx` with a compact design where each word is a single row. The word text is directly editable inline. Options (optional, repeat, spawn weight, hint) appear in a hover popover.

```tsx
import { useState, useRef, useEffect } from 'react'
import type { WordEntry } from '../types'

interface WordCardProps {
  word: WordEntry
  onUpdate: (changes: Partial<WordEntry>) => void
  onRemove: () => void
}

export default function WordCard({ word, onUpdate, onRemove }: WordCardProps) {
  const [showPopover, setShowPopover] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPopover) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPopover])

  return (
    <div className="group flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-800/60 transition-colors relative">
      {/* Editable word text */}
      <input
        type="text"
        value={word.word}
        onChange={(e) => onUpdate({ word: e.target.value })}
        placeholder="word..."
        className="flex-1 min-w-0 bg-transparent text-sm text-gray-100 placeholder-gray-600 outline-none border-b border-transparent focus:border-blue-500/50 transition-colors py-0.5"
      />

      {/* Inline badges */}
      {word.optional && (
        <span className="text-[9px] uppercase tracking-wider text-amber-400/70 bg-amber-400/10 px-1 rounded flex-shrink-0" title="Optional">opt</span>
      )}
      {word.canRepeatedlySpawn && (
        <span className="text-[9px] uppercase tracking-wider text-green-400/70 bg-green-400/10 px-1 rounded flex-shrink-0" title={`Repeat (weight: ${word.spawnWeight})`}>x{Math.floor(word.spawnWeight) + 1}</span>
      )}
      {word.hint && (
        <span className="text-[9px] text-blue-400/70 flex-shrink-0" title={word.hint}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </span>
      )}

      {/* Settings gear button */}
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        className="text-gray-600 hover:text-gray-300 transition-colors p-0.5 flex-shrink-0"
        title="Word settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Delete button */}
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-600 hover:text-red-400 transition-colors p-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100"
        title="Delete word"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Popover */}
      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl shadow-black/40 p-3 w-64 space-y-2.5"
        >
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={word.optional} onChange={(e) => onUpdate({ optional: e.target.checked })} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
              Optional
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={word.canRepeatedlySpawn} onChange={(e) => onUpdate({ canRepeatedlySpawn: e.target.checked })} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
              Can Repeat
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Spawn Weight</span>
            <input type="number" value={word.spawnWeight} onChange={(e) => onUpdate({ spawnWeight: parseFloat(e.target.value) || 0 })} step={0.1} min={0} className="w-full mt-0.5 bg-gray-900 text-white rounded px-2 py-1 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Hint</span>
            <input type="text" value={word.hint} onChange={(e) => onUpdate({ hint: e.target.value })} placeholder="Enter hint..." className="w-full mt-0.5 bg-gray-900 text-white rounded px-2 py-1 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Update WordListPanel spacing**

Change the word list container from `space-y-2` to `space-y-0.5` since cards are now single-line.

**Step 3: Commit**

```bash
git add src/renderer/src/components/WordCard.tsx src/renderer/src/components/WordListPanel.tsx
git commit -m "feat: compact single-line word list with popover settings (#2)"
```

---

### Task 5: Clear All Words Button (#9)

**Files:**
- Modify: `src/renderer/src/components/WordListPanel.tsx` — add clear all button
- Modify: `src/renderer/src/state/puzzleReducer.ts` — add CLEAR_WORDS action

**Step 1: Add CLEAR_WORDS action to reducer**

In `puzzleReducer.ts`, add to the `Action` union:

```ts
| { type: 'CLEAR_WORDS' }
```

Add case in the switch:

```ts
case 'CLEAR_WORDS':
  return { ...state, words: [] }
```

**Step 2: Add clear all button in WordListPanel header**

Add a trash icon button between the search and add buttons:

```tsx
<button
  type="button"
  onClick={() => {
    if (state.words.length > 0 && confirm('Clear all words?')) {
      dispatch({ type: 'CLEAR_WORDS' })
    }
  }}
  className="bg-gray-800 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 border border-gray-700/50"
  title="Clear all words"
  disabled={state.words.length === 0}
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
</button>
```

**Step 3: Commit**

```bash
git add src/renderer/src/state/puzzleReducer.ts src/renderer/src/components/WordListPanel.tsx
git commit -m "feat: add clear all words button (#9)"
```

---

### Task 6: Deferred Number Input Validation (#4)

**Files:**
- Modify: `src/renderer/src/components/ConfigPanel.tsx:119-139` — grid size inputs
- Modify: `src/renderer/src/components/DisplaySettingsPanel.tsx:77-99` — font size, cell spacing

**Step 1: Create a reusable pattern — use local state + onBlur clamping**

For each number input, change from direct clamped `onChange` to local string state that clamps `onBlur`.

In `ConfigPanel.tsx`, replace the Grid Width input (and similarly Grid Height):

```tsx
// Add at top of ConfigPanel component:
const [localGridWidth, setLocalGridWidth] = useState(String(config.gridWidth))
const [localGridHeight, setLocalGridHeight] = useState(String(config.gridHeight))

// Sync from external state changes
useEffect(() => { setLocalGridWidth(String(config.gridWidth)) }, [config.gridWidth])
useEffect(() => { setLocalGridHeight(String(config.gridHeight)) }, [config.gridHeight])

// In JSX for width:
<input
  type="number"
  min={5}
  max={50}
  value={localGridWidth}
  onChange={(e) => setLocalGridWidth(e.target.value)}
  onBlur={() => {
    const v = Math.max(5, Math.min(50, Number(localGridWidth) || 5))
    setLocalGridWidth(String(v))
    updateConfig({ gridWidth: v })
  }}
  className="..."
/>
```

Apply same pattern to Grid Height, Font Size (8-48), and Cell Spacing (0-16) in `DisplaySettingsPanel.tsx`.

**Step 2: Commit**

```bash
git add src/renderer/src/components/ConfigPanel.tsx src/renderer/src/components/DisplaySettingsPanel.tsx
git commit -m "feat: defer number input clamping to onBlur for easier typing (#4)"
```

---

### Task 7: Text Selection Highlight Fix (#5)

**Files:**
- Modify: `src/renderer/src/index.css:100-103`

**Step 1: Replace transparent selection with a visible color**

Change the `::selection` rule to only apply within the puzzle grid, and add a visible selection elsewhere:

```css
/* Global text selection — high contrast */
::selection {
  background: #3b82f6;
  color: #ffffff;
}

/* Suppress text selection on the puzzle grid only */
.puzzle-grid-area ::selection {
  background: transparent;
}
```

**Step 2: Add the class to PuzzleGrid container**

In `PuzzleGrid.tsx`, add `puzzle-grid-area` class to the grid's outermost container `<div>`.

**Step 3: Commit**

```bash
git add src/renderer/src/index.css src/renderer/src/components/PuzzleGrid.tsx
git commit -m "fix: text selection highlight visible outside puzzle grid (#5)"
```

---

### Task 8: Grid Styling to Match Export (#8)

**Files:**
- Modify: `src/renderer/src/components/PuzzleGrid.tsx:130-183` — grid container and cell styling

**Step 1: Update grid container**

Replace the rounded grid container with a clean bordered look:

```tsx
<div className="inline-block border-2 border-gray-300 shadow-lg shadow-black/30 bg-gray-900/50">
  <div
    className="inline-grid"
    style={{
      gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
      gap: '0px'
    }}
    ...
  >
```

Note: `gap: 0px` — use CSS borders for grid lines instead of gap spacing. The `cellSpacing` setting now only affects the export canvas.

**Step 2: Update cell styling**

Each cell gets a thin border instead of rounded background:

```tsx
<div
  key={cellKey}
  className={`flex items-center justify-center select-none cursor-pointer font-medium transition-all duration-150 border border-gray-700/40 ${
    isHighlighted
      ? 'bg-blue-500/50 scale-105'
      : foundColor
        ? ''
        : 'hover:bg-gray-800/50'
  }`}
  style={{
    width: cellSize,
    height: cellSize,
    fontFamily: display.fontFamily,
    fontSize: `${display.fontSize}px`,
    lineHeight: 1,
    ...(foundColor && !isHighlighted ? { backgroundColor: foundColor, opacity: 0.85 } : {})
  }}
  ...
>
```

Removed: `rounded-md`, `bg-gray-800`, cell spacing gap. Added: `border border-gray-700/40`.

**Step 3: Commit**

```bash
git add src/renderer/src/components/PuzzleGrid.tsx
git commit -m "feat: grid style matches export — thick border, faint lines, no rounding (#8)"
```

---

### Task 9: Circle Found Words Instead of Coloring Cells (#6)

**Files:**
- Modify: `src/renderer/src/components/PuzzleGrid.tsx` — add SVG overlay for found word circles
- Modify: `src/renderer/src/types.ts` — update SolverState to store found word cell ranges
- Modify: `src/renderer/src/state/puzzleReducer.ts` — store found word segments for circle drawing

**Step 1: Update SolverState to track word segments**

In `types.ts`, update `SolverState`:

```ts
export interface FoundWordSegment {
  word: string
  cells: Array<{ row: number; col: number }>
  color: string
}

export interface SolverState {
  foundWords: Set<string>
  selectionStart: { row: number; col: number } | null
  selectionEnd: { row: number; col: number } | null
  foundSegments: FoundWordSegment[]
}
```

Remove `foundCells` map — we no longer color individual cells.

**Step 2: Update puzzleReducer**

Update `resetSolver`:

```ts
function resetSolver(): SolverState {
  return {
    foundWords: new Set<string>(),
    selectionStart: null,
    selectionEnd: null,
    foundSegments: []
  }
}
```

Update `MARK_WORD_FOUND`:

```ts
case 'MARK_WORD_FOUND': {
  const newFoundWords = new Set(state.solver.foundWords)
  newFoundWords.add(action.payload.word)
  return {
    ...state,
    solver: {
      ...state.solver,
      foundWords: newFoundWords,
      foundSegments: [
        ...state.solver.foundSegments,
        { word: action.payload.word, cells: action.payload.cells, color: action.payload.color }
      ]
    }
  }
}
```

**Step 3: Render SVG circles in PuzzleGrid**

After the CSS grid div, render an absolutely-positioned SVG overlay that draws oval/capsule shapes along each found word's cell path:

```tsx
{/* SVG overlay for found word circles */}
{solver.foundSegments.length > 0 && (
  <svg
    className="absolute top-0 left-0 pointer-events-none"
    style={{ width: cols * cellSize, height: puzzle.grid.length * cellSize }}
  >
    {solver.foundSegments.map((seg, i) => {
      const firstCell = seg.cells[0]
      const lastCell = seg.cells[seg.cells.length - 1]
      const cx1 = firstCell.col * cellSize + cellSize / 2
      const cy1 = firstCell.row * cellSize + cellSize / 2
      const cx2 = lastCell.col * cellSize + cellSize / 2
      const cy2 = lastCell.row * cellSize + cellSize / 2

      // Draw a rotated rounded rect (capsule) from first to last cell
      const midX = (cx1 + cx2) / 2
      const midY = (cy1 + cy2) / 2
      const dx = cx2 - cx1
      const dy = cy2 - cy1
      const length = Math.sqrt(dx * dx + dy * dy) + cellSize * 0.8
      const angle = Math.atan2(dy, dx) * (180 / Math.PI)

      return (
        <rect
          key={i}
          x={midX - length / 2}
          y={midY - cellSize * 0.45}
          width={length}
          height={cellSize * 0.9}
          rx={cellSize * 0.45}
          ry={cellSize * 0.45}
          fill="none"
          stroke={seg.color}
          strokeWidth={2.5}
          opacity={0.8}
          transform={`rotate(${angle}, ${midX}, ${midY})`}
        />
      )
    })}
  </svg>
)}
```

The grid container needs `position: relative` so the SVG can overlay. Remove cell-level `backgroundColor` logic for `foundColor`.

**Step 4: Commit**

```bash
git add src/renderer/src/types.ts src/renderer/src/state/puzzleReducer.ts src/renderer/src/components/PuzzleGrid.tsx
git commit -m "feat: circle found words with SVG ovals instead of coloring cells (#6)"
```

---

### Task 10: Find Duplicate Words (#7)

**Files:**
- Modify: `src/renderer/src/engine/solverUtils.ts` — return placement index instead of word string
- Modify: `src/renderer/src/components/PuzzleGrid.tsx` — match against specific placement, not just word name
- Modify: `src/renderer/src/types.ts` — foundWords tracks placement indices

**Step 1: Update checkWordMatch to return the PlacedWord index**

In `solverUtils.ts`:

```ts
export function checkWordMatch(selectedCells: Cell[], placedWords: PlacedWord[]): number | null {
  for (let idx = 0; idx < placedWords.length; idx++) {
    const pw = placedWords[idx]
    if (pw.cells.length !== selectedCells.length) continue
    const forwardMatch = pw.cells.every(
      (c, i) => c.row === selectedCells[i].row && c.col === selectedCells[i].col
    )
    const reverseMatch = pw.cells.every(
      (c, i) =>
        c.row === selectedCells[selectedCells.length - 1 - i].row &&
        c.col === selectedCells[selectedCells.length - 1 - i].col
    )
    if (forwardMatch || reverseMatch) return idx
  }
  return null
}
```

**Step 2: Update SolverState to track found placement indices**

In `types.ts`, change `foundWords` from `Set<string>` to `Set<number>` (indices into `placedWords`):

```ts
export interface SolverState {
  foundWords: Set<number>  // indices into puzzle.placedWords
  selectionStart: { row: number; col: number } | null
  selectionEnd: { row: number; col: number } | null
  foundSegments: FoundWordSegment[]
}
```

**Step 3: Update MARK_WORD_FOUND action**

The payload changes to include the placement index:

```ts
| { type: 'MARK_WORD_FOUND'; payload: { index: number; word: string; cells: Array<{ row: number; col: number }>; color: string } }
```

Reducer:

```ts
case 'MARK_WORD_FOUND': {
  const newFoundWords = new Set(state.solver.foundWords)
  newFoundWords.add(action.payload.index)
  return {
    ...state,
    solver: {
      ...state.solver,
      foundWords: newFoundWords,
      foundSegments: [
        ...state.solver.foundSegments,
        { word: action.payload.word, cells: action.payload.cells, color: action.payload.color }
      ]
    }
  }
}
```

**Step 4: Update PuzzleGrid**

In `handleMouseUp`, use the new index-based return:

```ts
const matchedIdx = checkWordMatch(highlightedCells, puzzle.placedWords)
if (matchedIdx !== null && !solver.foundWords.has(matchedIdx)) {
  const color = getNextColor()
  const pw = puzzle.placedWords[matchedIdx]
  dispatch({
    type: 'MARK_WORD_FOUND',
    payload: { index: matchedIdx, word: pw.word, cells: highlightedCells, color }
  })
}
```

In `handleRevealAll`:

```ts
puzzle.placedWords.forEach((pw, idx) => {
  if (!solver.foundWords.has(idx)) {
    const color = getNextColor()
    dispatch({
      type: 'MARK_WORD_FOUND',
      payload: { index: idx, word: pw.word, cells: pw.cells, color }
    })
  }
})
```

**Step 5: Update WordBankDisplay**

Word bank needs to check if ALL placements of a word are found:

```ts
const isFound = puzzle.placedWords
  .map((pw, idx) => ({ pw, idx }))
  .filter(({ pw }) => pw.word === word)
  .every(({ idx }) => solver.foundWords.has(idx))
```

Progress counter uses `solver.foundWords.size` / `puzzle.placedWords.length` (already correct).

**Step 6: Run tests and commit**

```bash
npx vitest run
git add src/renderer/src/engine/solverUtils.ts src/renderer/src/types.ts src/renderer/src/state/puzzleReducer.ts src/renderer/src/components/PuzzleGrid.tsx src/renderer/src/components/WordBankDisplay.tsx
git commit -m "feat: solver finds duplicate word placements independently (#7)"
```

---

### Task 11: Font Improvements (#10)

**Files:**
- Modify: `src/renderer/src/components/DisplaySettingsPanel.tsx:4-12` — expand font list, style options

**Step 1: Expand font list and preview fonts in dropdown**

```ts
const FONT_OPTIONS = [
  'Courier New',
  'Arial',
  'Georgia',
  'Comic Sans MS',
  'Impact',
  'Consolas',
  'Trebuchet MS',
  'Verdana',
  'Times New Roman',
  'Palatino Linotype',
  'Lucida Console',
  'monospace'
]
```

Update the `<select>` to show each option in its own font:

```tsx
<select
  value={display.fontFamily}
  onChange={(e) => updateDisplay({ fontFamily: e.target.value })}
  className="mt-1.5 w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
  style={{ fontFamily: display.fontFamily }}
>
  {FONT_OPTIONS.map((font) => (
    <option key={font} value={font} style={{ fontFamily: font }}>
      {font}
    </option>
  ))}
</select>
```

**Step 2: Commit**

```bash
git add src/renderer/src/components/DisplaySettingsPanel.tsx
git commit -m "feat: more font options with preview in dropdown (#10)"
```

---

### Task 12: Export Scaling Fix (#11)

**Files:**
- Modify: `src/renderer/src/engine/renderPuzzle.ts` — add auto-scaling for large puzzles

**Step 1: Add scaling logic**

After calculating `canvasWidth` and `contentHeight`, add a scaling pass for the PDF target (Letter page = 816x1056 at 72dpi, minus margins):

```ts
// Target max dimensions for Letter page (72dpi) with 0.4in margins
const maxPageWidth = 816 - 80  // ~736px logical
const maxPageHeight = 1056 - 80 // ~976px logical

let scaleFactor = 1
if (canvasWidth > maxPageWidth || contentHeight > maxPageHeight) {
  scaleFactor = Math.min(maxPageWidth / canvasWidth, maxPageHeight / contentHeight)
}

// Apply scale factor to all size calculations
const effectiveCellSize = cellSize * scaleFactor
const effectivePadding = padding * scaleFactor
const effectiveFontSize = display.fontSize * scaleFactor
const effectiveTitleFontSize = titleFontSize * scaleFactor
const effectiveBodyFontSize = bodyFontSize * scaleFactor
```

Then use the `effective*` values throughout the rendering. Recalculate `canvasWidth`/`canvasHeight` after scaling.

This ensures large puzzles (e.g., 40x40 with many words) shrink proportionally to fit the page.

**Step 2: Run dev and test export with a large puzzle**

```bash
npm run dev
```

**Step 3: Commit**

```bash
git add src/renderer/src/engine/renderPuzzle.ts
git commit -m "fix: auto-scale large puzzles to fit page in export (#11)"
```

---

### Task 13: Final Integration Testing

**Step 1: Run all unit tests**

```bash
npx vitest run
```

**Step 2: Run dev and manually verify all 12 items**

```bash
npm run dev
```

Checklist:
- [ ] (#1) Generate a 10x10 puzzle with 20+ words — most should place
- [ ] (#2) Word list is compact single-line, settings in popover
- [ ] (#3) Settings panels are in the left sidebar above word list
- [ ] (#4) Can type "20" in grid width without it clamping mid-type
- [ ] (#5) Text selection outside grid is visible (blue highlight)
- [ ] (#6) Found words show circled/oval outline, not colored cells
- [ ] (#7) Duplicate words each require separate finding
- [ ] (#8) Grid has thick border, faint lines, no rounded cells
- [ ] (#9) Clear all button works with confirmation
- [ ] (#10) Font dropdown shows preview; new fonts available
- [ ] (#11) Large puzzle exports fit on page without squishing
- [ ] (#12) "Preserve" keeps original case; "Random" randomizes per-letter

**Step 3: Build production**

```bash
npm run build:win
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: v2 user recommendations — all 12 items implemented"
```
