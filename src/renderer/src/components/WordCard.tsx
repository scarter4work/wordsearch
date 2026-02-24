import { useState } from 'react'
import type { WordEntry } from '../types'

interface WordCardProps {
  word: WordEntry
  onUpdate: (changes: Partial<WordEntry>) => void
  onRemove: () => void
}

export default function WordCard({ word, onUpdate, onRemove }: WordCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-800/80 rounded-xl border border-gray-700/50 shadow-lg shadow-black/20 overflow-hidden transition-all duration-200 hover:border-gray-600/50">
      {/* Header row: word name + delete */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left font-semibold text-gray-100 truncate cursor-pointer hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
          title={word.word || 'Untitled word'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3 w-3 text-gray-500 transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="truncate">{word.word || 'New Word'}</span>
        </button>
        {word.optional && (
          <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
            opt
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-500 hover:text-red-400 transition-colors duration-200 flex-shrink-0 p-1 rounded hover:bg-red-400/10"
          title="Delete word"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Collapsible config section */}
      <div
        className={`transition-all duration-200 ease-in-out ${
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-3 pb-3 space-y-3 border-t border-gray-700/50 pt-3">
          {/* Word text input */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Word</label>
            <input
              type="text"
              value={word.word}
              onChange={(e) => onUpdate({ word: e.target.value })}
              className="w-full bg-gray-900 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter word..."
            />
          </div>

          {/* Toggles row */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={word.optional}
                onChange={(e) => onUpdate({ optional: e.target.checked })}
                className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              Optional
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={word.canRepeatedlySpawn}
                onChange={(e) => onUpdate({ canRepeatedlySpawn: e.target.checked })}
                className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              Can Repeat
            </label>
          </div>

          {/* Spawn Weight */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Spawn Weight</label>
            <input
              type="number"
              value={word.spawnWeight}
              onChange={(e) => onUpdate({ spawnWeight: parseFloat(e.target.value) || 0 })}
              step={0.1}
              min={0}
              className="w-24 bg-gray-900 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Hint */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hint</label>
            <input
              type="text"
              value={word.hint}
              onChange={(e) => onUpdate({ hint: e.target.value })}
              placeholder="Enter hint..."
              className="w-full bg-gray-900 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
