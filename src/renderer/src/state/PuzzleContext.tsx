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
