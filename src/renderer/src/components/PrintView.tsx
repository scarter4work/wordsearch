import type { GeneratedPuzzle, PuzzleConfig, DisplaySettings } from '../types'

interface PrintViewProps {
  puzzle: GeneratedPuzzle
  config: PuzzleConfig
  display: DisplaySettings
}

export default function PrintView({ puzzle, config, display }: PrintViewProps) {
  const { grid, hints } = puzzle
  const cellSize = display.fontSize + display.cellSpacing * 2 + 4

  return (
    <div
      style={{
        background: '#fff',
        color: '#000',
        padding: '32px',
        fontFamily: display.fontFamily,
        width: 'fit-content'
      }}
    >
      {/* Title */}
      <h1
        style={{
          textAlign: 'center',
          fontSize: display.fontSize * 1.8,
          fontWeight: 700,
          marginBottom: 24
        }}
      >
        {config.title}
      </h1>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${grid[0].length}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${grid.length}, ${cellSize}px)`,
          border: '1px solid #000',
          width: 'fit-content',
          margin: '0 auto 24px'
        }}
      >
        {grid.flatMap((row, r) =>
          row.map((letter, c) => (
            <div
              key={`${r}-${c}`}
              style={{
                width: cellSize,
                height: cellSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: display.fontSize,
                fontFamily: display.fontFamily,
                border: '1px solid #ccc',
                boxSizing: 'border-box'
              }}
            >
              {letter}
            </div>
          ))
        )}
      </div>

      {/* Hints */}
      {config.showHints && hints.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: display.fontSize * 1.2, fontWeight: 600, marginBottom: 8 }}>
            Hints
          </h2>
          <ol style={{ paddingLeft: 24, margin: 0, fontSize: display.fontSize * 0.9 }}>
            {hints.map((h, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {h.hint}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Word Bank */}
      {config.wordBank && (
        <div>
          <h2 style={{ fontSize: display.fontSize * 1.2, fontWeight: 600, marginBottom: 8 }}>
            Word Bank
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: display.fontSize * 0.9 }}>
            {puzzle.placedWords.map((pw, i) => (
              <span key={i}>{pw.word}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
