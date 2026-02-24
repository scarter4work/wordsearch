import type { PlacedWord } from '../types'

type Cell = { row: number; col: number }

export function getLineCells(start: Cell, end: Cell): Cell[] | null {
  const dRow = end.row - start.row
  const dCol = end.col - start.col
  const absR = Math.abs(dRow)
  const absC = Math.abs(dCol)

  // Must be horizontal, vertical, or 45-degree diagonal
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

export function checkWordMatch(selectedCells: Cell[], placedWords: PlacedWord[]): string | null {
  for (const pw of placedWords) {
    if (pw.cells.length !== selectedCells.length) continue
    const forwardMatch = pw.cells.every(
      (c, i) => c.row === selectedCells[i].row && c.col === selectedCells[i].col
    )
    const reverseMatch = pw.cells.every(
      (c, i) =>
        c.row === selectedCells[selectedCells.length - 1 - i].row &&
        c.col === selectedCells[selectedCells.length - 1 - i].col
    )
    if (forwardMatch || reverseMatch) return pw.word
  }
  return null
}
