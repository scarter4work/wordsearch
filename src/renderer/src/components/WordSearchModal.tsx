import { useState } from 'react'
import { usePuzzle } from '../state/PuzzleContext'

interface WordSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WordSearchModal({ isOpen, onClose }: WordSearchModalProps) {
  const { dispatch } = usePuzzle()
  const [concept, setConcept] = useState('')
  const [results, setResults] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [searched, setSearched] = useState(false)

  if (!isOpen) return null

  async function handleSearch() {
    if (!concept.trim()) return
    setLoading(true)
    setError(false)
    setSearched(true)
    setSelected(new Set())
    try {
      const words = await window.api.searchWords(concept.trim())
      if (words && words.length > 0) {
        setResults(words)
      } else {
        setResults([])
      }
    } catch {
      setError(true)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function toggleWord(word: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(word)) {
        next.delete(word)
      } else {
        next.add(word)
      }
      return next
    })
  }

  function toggleAll() {
    if (selected.size === results.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(results))
    }
  }

  function addSelected() {
    for (const word of selected) {
      dispatch({
        type: 'ADD_WORD',
        payload: {
          id: crypto.randomUUID(),
          word,
          optional: false,
          canRepeatedlySpawn: false,
          spawnWeight: 1,
          hint: ''
        }
      })
    }
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Search for Words</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Search input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a concept, e.g. 'ocean animals'"
            className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !concept.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <p className="text-gray-400 text-sm text-center py-8">Searching...</p>
          )}

          {error && !loading && (
            <p className="text-red-400 text-sm text-center py-8">
              Search failed. Please try again.
            </p>
          )}

          {!loading && !error && !searched && (
            <p className="text-gray-500 text-sm text-center py-8">
              Enter a concept and search
            </p>
          )}

          {!loading && !error && searched && results.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No words found</p>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-xs">
                  {results.length} results &mdash; {selected.size} selected
                </span>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  {selected.size === results.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-1">
                {results.map((word) => (
                  <label
                    key={word}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(word)}
                      onChange={() => toggleWord(word)}
                      className="accent-blue-500"
                    />
                    <span className="text-white text-sm">{word}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && !loading && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white px-4 py-2 text-sm transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={addSelected}
              disabled={selected.size === 0}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              Add Selected ({selected.size})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
