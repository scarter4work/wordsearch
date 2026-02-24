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

  it('skips optional words with spawnWeight 0', () => {
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
      expect(result.grid[placed.cells[0].row][placed.cells[0].col]).toBe('A')
      expect(result.grid[placed.cells[1].row][placed.cells[1].col]).toBe('B')
    }
  })
})
