import type { AppState, WordEntry, PuzzleConfig, DisplaySettings, GeneratedPuzzle, SolverState, FoundWordSegment } from '../types'

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
    title: '',
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
    foundWords: new Set<number>(),
    selectionStart: null,
    selectionEnd: null,
    foundSegments: []
  }
}

export type Action =
  | { type: 'ADD_WORD'; payload: WordEntry }
  | { type: 'REMOVE_WORD'; payload: string }
  | { type: 'UPDATE_WORD'; payload: { id: string; changes: Partial<WordEntry> } }
  | { type: 'SET_WORDS'; payload: WordEntry[] }
  | { type: 'UPDATE_CONFIG'; payload: Partial<PuzzleConfig> }
  | { type: 'UPDATE_DISPLAY'; payload: Partial<DisplaySettings> }
  | { type: 'SET_PUZZLE'; payload: GeneratedPuzzle }
  | { type: 'MARK_WORD_FOUND'; payload: { index: number; word: string; cells: Array<{ row: number; col: number }>; color: string } }
  | { type: 'RESET_SOLVER' }
  | { type: 'SET_SELECTION'; payload: { start: { row: number; col: number } | null; end: { row: number; col: number } | null } }
  | { type: 'CLEAR_WORDS' }
  | { type: 'LOAD_STATE'; payload: { words: WordEntry[]; config: PuzzleConfig; display: DisplaySettings } }

function resetSolver(): SolverState {
  return {
    foundWords: new Set<number>(),
    selectionStart: null,
    selectionEnd: null,
    foundSegments: []
  }
}

export function puzzleReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_WORD':
      return { ...state, words: [...state.words, action.payload] }

    case 'REMOVE_WORD':
      return { ...state, words: state.words.filter((w) => w.id !== action.payload) }

    case 'UPDATE_WORD':
      return {
        ...state,
        words: state.words.map((w) =>
          w.id === action.payload.id ? { ...w, ...action.payload.changes } : w
        )
      }

    case 'SET_WORDS':
      return { ...state, words: action.payload }

    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } }

    case 'UPDATE_DISPLAY':
      return { ...state, display: { ...state.display, ...action.payload } }

    case 'SET_PUZZLE':
      return { ...state, puzzle: action.payload, solver: resetSolver() }

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

    case 'RESET_SOLVER':
      return { ...state, solver: resetSolver() }

    case 'SET_SELECTION':
      return {
        ...state,
        solver: {
          ...state.solver,
          selectionStart: action.payload.start,
          selectionEnd: action.payload.end
        }
      }

    case 'CLEAR_WORDS':
      return { ...state, words: [] }

    case 'LOAD_STATE':
      return {
        words: action.payload.words,
        config: { ...initialState.config, ...action.payload.config },
        display: { ...initialState.display, ...action.payload.display },
        puzzle: null,
        solver: resetSolver()
      }

    default:
      return state
  }
}
