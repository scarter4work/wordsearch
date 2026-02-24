import { usePuzzle } from '@/state/PuzzleContext'

export default function PuzzleGrid() {
  const { state } = usePuzzle()
  const { puzzle, display } = state

  if (!puzzle) {
    return (
      <p className="text-gray-500 text-lg text-center py-12">
        Add words and click Generate to create your puzzle
      </p>
    )
  }

  const cols = puzzle.grid[0]?.length ?? 0
  const cellSize = display.fontSize + 16

  return (
    <div
      className="inline-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap: `${display.cellSpacing}px`
      }}
    >
      {puzzle.grid.flatMap((row, rowIdx) =>
        row.map((letter, colIdx) => (
          <div
            key={`${rowIdx}-${colIdx}`}
            className="bg-gray-700 rounded flex items-center justify-center select-none"
            style={{
              width: cellSize,
              height: cellSize,
              fontFamily: display.fontFamily,
              fontSize: `${display.fontSize}px`,
              lineHeight: 1
            }}
          >
            {letter}
          </div>
        ))
      )}
    </div>
  )
}
