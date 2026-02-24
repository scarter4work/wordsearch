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
