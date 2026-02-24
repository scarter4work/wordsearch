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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="modal-enter bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-2xl shadow-black/40 p-6 max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Search for Words</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-gray-700/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
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
            className="flex-1 bg-gray-900 text-white rounded-lg px-3 py-2.5 text-sm border border-gray-600 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !concept.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
          >
            Search
          </button>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="text-center py-8">
              <svg className="animate-spin h-6 w-6 mx-auto text-blue-500 mb-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-400 text-sm">Searching...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">Search failed. Please try again.</p>
            </div>
          )}

          {!loading && !error && !searched && (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <p className="text-gray-500 text-sm">Enter a concept and search</p>
            </div>
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
                  className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                >
                  {selected.size === results.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-1">
                {results.map((word) => (
                  <label
                    key={word}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                      selected.has(word) ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-gray-700/50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(word)}
                      onChange={() => toggleWord(word)}
                      className="accent-blue-500"
                    />
                    <span className="text-gray-200 text-sm">{word}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && !loading && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white px-4 py-2 text-sm transition-colors duration-200 rounded-lg hover:bg-gray-700/50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={addSelected}
              disabled={selected.size === 0}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
            >
              Add Selected ({selected.size})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
