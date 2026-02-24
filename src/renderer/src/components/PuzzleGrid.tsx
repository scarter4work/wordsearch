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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <p className="text-gray-500 text-lg font-medium">No puzzle yet</p>
        <p className="text-gray-600 text-sm mt-1">Add words and click Generate to create your puzzle</p>
      </div>
    )
  }

  const cols = puzzle.grid[0]?.length ?? 0
  const cellSize = display.fontSize + 16
  const totalWords = puzzle.placedWords.length
  const foundCount = solver.foundWords.size

  // Build a set of highlighted cell keys for fast lookup
  const highlightSet = new Set(highlightedCells.map((c) => `${c.row},${c.col}`))

  // Progress percentage
  const progressPct = totalWords > 0 ? (foundCount / totalWords) * 100 : 0

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300 font-medium">
            {foundCount} / {totalWords} words found
          </span>
          <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleRevealAll}
          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700/50 transition-all duration-200 hover:scale-[1.02] text-gray-300 hover:text-white"
        >
          Reveal All
        </button>
      </div>

      {/* Grid container */}
      <div className="puzzle-grid-area inline-block border-2 border-gray-300 shadow-lg shadow-black/30 bg-gray-900/50">
        <div
          className="inline-grid"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gap: '0px'
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

              return (
                <div
                  key={cellKey}
                  className={`flex items-center justify-center select-none cursor-pointer font-medium transition-all duration-150 border-[0.5px] border-gray-700/40 ${
                    isHighlighted
                      ? 'bg-blue-500/50'
                      : 'hover:bg-gray-800/50'
                  }`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    fontFamily: display.fontFamily,
                    fontSize: `${display.fontSize}px`,
                    lineHeight: 1,
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
    </div>
  )
}
