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

  it('returns cells in a vertical line', () => {
    const cells = getLineCells({ row: 0, col: 0 }, { row: 3, col: 0 })
    expect(cells).toEqual([
      { row: 0, col: 0 }, { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }
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

  it('returns single cell when start equals end', () => {
    const cells = getLineCells({ row: 2, col: 2 }, { row: 2, col: 2 })
    expect(cells).toEqual([{ row: 2, col: 2 }])
  })
})

describe('checkWordMatch', () => {
  it('matches a placed word by cells (forward)', () => {
    const placed: PlacedWord[] = [{
      word: 'CAT', startRow: 0, startCol: 0, direction: 'horizontal',
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
    }]
    const selectedCells = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
    expect(checkWordMatch(selectedCells, placed)).toBe(0)
  })

  it('matches a placed word by cells (reverse selection)', () => {
    const placed: PlacedWord[] = [{
      word: 'CAT', startRow: 0, startCol: 0, direction: 'horizontal',
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
    }]
    const selectedCells = [{ row: 0, col: 2 }, { row: 0, col: 1 }, { row: 0, col: 0 }]
    expect(checkWordMatch(selectedCells, placed)).toBe(0)
  })

  it('returns null for non-matching selection', () => {
    const placed: PlacedWord[] = [{
      word: 'CAT', startRow: 0, startCol: 0, direction: 'horizontal',
      cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]
    }]
    const selectedCells = [{ row: 0, col: 0 }, { row: 0, col: 1 }]
    expect(checkWordMatch(selectedCells, placed)).toBeNull()
  })
})
