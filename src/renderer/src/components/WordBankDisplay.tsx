import { usePuzzle } from '@/state/PuzzleContext'

export default function WordBankDisplay() {
  const { state } = usePuzzle()
  const { puzzle, config } = state

  if (!config.wordBank || !puzzle) return null

  const wordEntries = Object.entries(puzzle.wordCounts)
  const hasHints = config.showHints && puzzle.hints.length > 0

  return (
    <div className="mt-6">
      {hasHints && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Hints</h3>
          <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
            {puzzle.hints.map((h, i) => (
              <li key={i}>{h.hint}</li>
            ))}
          </ol>
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-300 mb-2">Word Bank</h3>
      <div className="flex flex-wrap gap-2">
        {wordEntries.map(([word, count]) => (
          <span
            key={word}
            className="px-2 py-1 text-sm bg-gray-700 rounded"
          >
            {word}
            {count > 1 && ` (x${count})`}
          </span>
        ))}
      </div>
    </div>
  )
}
