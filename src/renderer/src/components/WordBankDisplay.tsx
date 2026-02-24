import { usePuzzle } from '@/state/PuzzleContext'

export default function WordBankDisplay() {
  const { state } = usePuzzle()
  const { puzzle, config, solver } = state

  if (!config.wordBank || !puzzle) return null

  const wordEntries = Object.entries(puzzle.wordCounts)
  const hasHints = config.showHints && puzzle.hints.length > 0

  return (
    <div className="mt-6">
      {hasHints && (
        <div className="mb-5 bg-gray-800/50 rounded-xl border border-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Hints</h3>
          <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1.5">
            {puzzle.hints.map((h, i) => (
              <li key={i}>{h.hint}</li>
            ))}
          </ol>
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Word Bank</h3>
      <div className="flex flex-wrap gap-2">
        {wordEntries.map(([word, count]) => {
          // Check if all placements of this word are found
          const isFound = puzzle.placedWords
            .map((pw, idx) => ({ pw, idx }))
            .filter(({ pw }) => pw.word === word)
            .every(({ idx }) => solver.foundWords.has(idx))
          return (
            <span
              key={word}
              className={`px-3 py-1 text-sm bg-gray-800 rounded-full border border-gray-700/50 transition-all duration-300 ${
                isFound ? 'line-through opacity-40 scale-95' : 'text-gray-200'
              }`}
            >
              {word}
              {count > 1 && (
                <span className="ml-1 text-gray-500">(x{count})</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
