import { useState, useRef, useEffect } from 'react'
import type { WordEntry } from '../types'
import { usePuzzle } from '../state/PuzzleContext'

interface WordCardProps {
  word: WordEntry
  onUpdate: (changes: Partial<WordEntry>) => void
  onRemove: () => void
}

export default function WordCard({ word, onUpdate, onRemove }: WordCardProps) {
  const { state } = usePuzzle()
  const maxDim = Math.max(state.config.gridWidth, state.config.gridHeight)
  const isTooLong = word.word.trim().length > maxDim
  const [showPopover, setShowPopover] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const gearRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showPopover) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        gearRef.current && !gearRef.current.contains(target)
      ) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPopover])

  return (
    <div className="group flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-800/60 transition-colors relative">
      {/* Editable word text */}
      <input
        type="text"
        value={word.word}
        onChange={(e) => onUpdate({ word: e.target.value })}
        placeholder="word..."
        className={`flex-1 min-w-0 bg-transparent text-sm placeholder-gray-600 outline-none border-b transition-colors py-0.5 ${isTooLong ? 'text-amber-400 border-amber-500/50' : 'text-gray-100 border-transparent focus:border-blue-500/50'}`}
      />
      {isTooLong && (
        <span className="text-[9px] uppercase tracking-wider text-amber-400/70 bg-amber-400/10 px-1 rounded flex-shrink-0" title={`Word is ${word.word.trim().length} chars, grid max is ${maxDim}`}>!</span>
      )}

      {/* Inline badges */}
      {word.optional && (
        <span className="text-[9px] uppercase tracking-wider text-amber-400/70 bg-amber-400/10 px-1 rounded flex-shrink-0" title="Optional">opt</span>
      )}
      {word.canRepeatedlySpawn && (
        <span className="text-[9px] uppercase tracking-wider text-green-400/70 bg-green-400/10 px-1 rounded flex-shrink-0" title={`Repeat (weight: ${word.spawnWeight})`}>x{Math.floor(word.spawnWeight) + 1}</span>
      )}
      {word.hint && (
        <span className="text-[9px] text-blue-400/70 flex-shrink-0" title={word.hint}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </span>
      )}

      {/* Settings gear button */}
      <button
        ref={gearRef}
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        className="text-gray-600 hover:text-gray-300 transition-colors p-0.5 flex-shrink-0"
        title="Word settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Delete button */}
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-600 hover:text-red-400 transition-colors p-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100"
        title="Delete word"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Popover */}
      {showPopover && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full mt-1 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl shadow-black/40 p-3 w-64 space-y-2.5"
        >
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={word.optional} onChange={(e) => onUpdate({ optional: e.target.checked })} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
              Optional
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={word.canRepeatedlySpawn} onChange={(e) => onUpdate({ canRepeatedlySpawn: e.target.checked })} className="rounded bg-gray-700 border-gray-600 text-blue-500" />
              Can Repeat
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Spawn Weight</span>
            <input type="number" value={word.spawnWeight} onChange={(e) => onUpdate({ spawnWeight: parseFloat(e.target.value) || 0 })} step={0.1} min={0} className="w-full mt-0.5 bg-gray-900 text-white rounded px-2 py-1 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Hint</span>
            <input type="text" value={word.hint} onChange={(e) => onUpdate({ hint: e.target.value })} placeholder="Enter hint..." className="w-full mt-0.5 bg-gray-900 text-white rounded px-2 py-1 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
        </div>
      )}
    </div>
  )
}
