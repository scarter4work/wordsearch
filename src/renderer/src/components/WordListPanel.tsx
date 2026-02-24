import { useState } from 'react'
import { usePuzzle } from '../state/PuzzleContext'
import WordCard from './WordCard'
import WordSearchModal from './WordSearchModal'

export default function WordListPanel() {
  const { state, dispatch } = usePuzzle()
  const [searchOpen, setSearchOpen] = useState(false)

  function addWord() {
    dispatch({
      type: 'ADD_WORD',
      payload: {
        id: crypto.randomUUID(),
        word: '',
        optional: false,
        canRepeatedlySpawn: false,
        spawnWeight: 1,
        hint: ''
      }
    })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-100">
          Word List
          <span className="ml-2 text-sm font-normal text-gray-500">({state.words.length})</span>
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (state.words.length > 0 && confirm('Clear all words?')) {
                dispatch({ type: 'CLEAR_WORDS' })
              }
            }}
            className="bg-gray-800 hover:bg-red-500/20 text-gray-300 hover:text-red-400 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 border border-gray-700/50"
            title="Clear all words"
            disabled={state.words.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 border border-gray-700/50 hover:scale-[1.05]"
            title="Search for words"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={addWord}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-[1.05] hover:shadow-lg hover:shadow-blue-500/20"
            title="Add word"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable word list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {state.words.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            onUpdate={(changes) =>
              dispatch({ type: 'UPDATE_WORD', payload: { id: word.id, changes } })
            }
            onRemove={() => dispatch({ type: 'REMOVE_WORD', payload: word.id })}
          />
        ))}
        {state.words.length === 0 && (
          <div className="text-center mt-12 px-4">
            <div className="text-gray-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No words yet.</p>
            <p className="text-gray-600 text-xs mt-1">Click + to add one, or use search to find words by concept.</p>
          </div>
        )}
      </div>

      <WordSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
