import { useRef, useState, useCallback } from 'react'
import { usePuzzle } from '@/state/PuzzleContext'
import { getLineCells, checkWordMatch } from '@/engine/solverUtils'

const WORD_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e',
  '#a855f7', '#6366f1'
]

export default function PuzzleGrid() {
  const { state, dispatch } = usePuzzle()
  const { puzzle, display, solver } = state

  const isDragging = useRef(false)
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null)
  const [highlightedCells, setHighlightedCells] = useState<Array<{ row: number; col: number }>>([])

  const nextColorIndex = useRef(0)

  const getNextColor = useCallback(() => {
    const color = WORD_COLORS[nextColorIndex.current % WORD_COLORS.length]
    nextColorIndex.current++
    return color
  }, [])

  const handleMouseDown = useCallback((row: number, col: number) => {
    isDragging.current = true
    setDragStart({ row, col })
    setHighlightedCells([{ row, col }])
    dispatch({ type: 'SET_SELECTION', payload: { start: { row, col }, end: null } })
  }, [dispatch])

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (!isDragging.current || !dragStart) return
    const cells = getLineCells(dragStart, { row, col })
    if (cells) {
      setHighlightedCells(cells)
      dispatch({ type: 'SET_SELECTION', payload: { start: dragStart, end: { row, col } } })
    }
  }, [dragStart, dispatch])

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !puzzle) {
      isDragging.current = false
      setDragStart(null)
      setHighlightedCells([])
      return
    }

    isDragging.current = false

    if (highlightedCells.length > 0) {
      const matchedWord = checkWordMatch(highlightedCells, puzzle.placedWords)
      if (matchedWord && !solver.foundWords.has(matchedWord)) {
        const color = getNextColor()
        dispatch({
          type: 'MARK_WORD_FOUND',
          payload: { word: matchedWord, cells: highlightedCells, color }
        })
      }
    }

    setDragStart(null)
    setHighlightedCells([])
    dispatch({ type: 'SET_SELECTION', payload: { start: null, end: null } })
  }, [puzzle, highlightedCells, solver.foundWords, getNextColor, dispatch])

  const handleRevealAll = useCallback(() => {
    if (!puzzle) return
    for (const pw of puzzle.placedWords) {
      if (!solver.foundWords.has(pw.word)) {
        const color = getNextColor()
        dispatch({
          type: 'MARK_WORD_FOUND',
          payload: { word: pw.word, cells: pw.cells, color }
        })
      }
    }
  }, [puzzle, solver.foundWords, getNextColor, dispatch])

  if (!puzzle) {
    return (
      <p className="text-gray-500 text-lg text-center py-12">
        Add words and click Generate to create your puzzle
      </p>
    )
  }

  const cols = puzzle.grid[0]?.length ?? 0
  const cellSize = display.fontSize + 16
  const totalWords = puzzle.placedWords.length
  const foundCount = solver.foundWords.size

  // Build a set of highlighted cell keys for fast lookup
  const highlightSet = new Set(highlightedCells.map((c) => `${c.row},${c.col}`))

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-300">
          {foundCount} / {totalWords} words found
        </span>
        <button
          type="button"
          onClick={handleRevealAll}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          Reveal All
        </button>
      </div>

      {/* Grid */}
      <div
        className="inline-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap: `${display.cellSpacing}px`
        }}
        onMouseLeave={() => {
          if (isDragging.current) {
            isDragging.current = false
            setDragStart(null)
            setHighlightedCells([])
            dispatch({ type: 'SET_SELECTION', payload: { start: null, end: null } })
          }
        }}
      >
        {puzzle.grid.flatMap((row, rowIdx) =>
          row.map((letter, colIdx) => {
            const cellKey = `${rowIdx},${colIdx}`
            const foundColor = solver.foundCells.get(cellKey)
            const isHighlighted = highlightSet.has(cellKey)

            let bgStyle: string | undefined
            let bgColor: string | undefined

            if (isHighlighted) {
              bgStyle = undefined
              bgColor = undefined
            } else if (foundColor) {
              bgStyle = undefined
              bgColor = foundColor
            }

            return (
              <div
                key={cellKey}
                className={`rounded flex items-center justify-center select-none cursor-pointer ${
                  isHighlighted
                    ? 'bg-blue-500/50'
                    : foundColor
                      ? ''
                      : 'bg-gray-700'
                }`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  fontFamily: display.fontFamily,
                  fontSize: `${display.fontSize}px`,
                  lineHeight: 1,
                  ...(foundColor && !isHighlighted ? { backgroundColor: foundColor, opacity: 0.8 } : {})
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleMouseDown(rowIdx, colIdx)
                }}
                onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                onMouseUp={handleMouseUp}
              >
                {letter}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
