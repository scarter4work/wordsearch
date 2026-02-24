import { usePuzzle } from '@/state/PuzzleContext'
import { generatePuzzle } from '@/engine/generatePuzzle'

export default function Header() {
  const { state, dispatch } = usePuzzle()

  function handleGenerate() {
    if (state.words.length === 0) return
    const result = generatePuzzle(state.words, state.config)
    dispatch({ type: 'SET_PUZZLE', payload: result })
  }

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
      <h1 className="text-lg font-semibold truncate">{state.config.title}</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={state.words.length === 0}
          className="px-4 py-1.5 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Generate
        </button>
        <button
          type="button"
          disabled
          className="px-3 py-1.5 text-sm rounded bg-gray-700 opacity-40 cursor-not-allowed"
        >
          Export PDF
        </button>
        <button
          type="button"
          disabled
          className="px-3 py-1.5 text-sm rounded bg-gray-700 opacity-40 cursor-not-allowed"
        >
          Export PNG
        </button>
      </div>
    </header>
  )
}
