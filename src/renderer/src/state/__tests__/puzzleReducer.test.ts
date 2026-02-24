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

  it('loads state with fresh solver and null puzzle', () => {
    const loaded = {
      words: [{ id: '1', word: 'HELLO', optional: false, canRepeatedlySpawn: false, spawnWeight: 1, hint: '' }],
      config: { ...initialState.config, title: 'Loaded Puzzle' },
      display: { ...initialState.display, fontSize: 24 }
    }
    const state = puzzleReducer(initialState, { type: 'LOAD_STATE', payload: loaded })
    expect(state.words).toHaveLength(1)
    expect(state.words[0].word).toBe('HELLO')
    expect(state.config.title).toBe('Loaded Puzzle')
    expect(state.display.fontSize).toBe(24)
    expect(state.puzzle).toBeNull()
    expect(state.solver.foundWords).toBeInstanceOf(Set)
    expect(state.solver.foundCells).toBeInstanceOf(Map)
  })

  it('resets solver when new puzzle is generated', () => {
    const stateWithFound = { ...initialState, solver: { ...initialState.solver, foundWords: new Set(['TEST']) } }
    const puzzle = { grid: [['A']], placedWords: [], skippedWords: [], wordCounts: {}, hints: [] }
    const state = puzzleReducer(stateWithFound, { type: 'SET_PUZZLE', payload: puzzle })
    expect(state.solver.foundWords.size).toBe(0)
  })
})
