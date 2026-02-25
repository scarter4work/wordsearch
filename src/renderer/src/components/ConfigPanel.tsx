import { useState, useEffect } from 'react'
import { usePuzzle } from '../state/PuzzleContext'
import { useToast } from '../App'
import type { LetterCase } from '../types'

export default function ConfigPanel() {
  const { state, dispatch } = usePuzzle()
  const { config } = state
  const { addToast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [localGridWidth, setLocalGridWidth] = useState(String(config.gridWidth))
  const [localGridHeight, setLocalGridHeight] = useState(String(config.gridHeight))

  useEffect(() => { setLocalGridWidth(String(config.gridWidth)) }, [config.gridWidth])
  useEffect(() => { setLocalGridHeight(String(config.gridHeight)) }, [config.gridHeight])

  function updateConfig(changes: Parameters<typeof dispatch>[0] extends { type: 'UPDATE_CONFIG'; payload: infer P } ? P : never) {
    dispatch({ type: 'UPDATE_CONFIG', payload: changes })
  }

  if (collapsed) {
    return (
      <div className="border-t border-gray-800">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full px-4 py-2.5 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Configuration
        </button>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-800">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Configuration
      </button>

      <div className="px-4 pb-4 space-y-4">
        {/* Word Directions */}
        <fieldset>
          <legend className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Word Directions
          </legend>
          <div className="space-y-1.5">
            {([
              ['up', 'Up'],
              ['down', 'Down'],
              ['upwardHorizontal', 'Upward Diagonal'],
              ['downwardHorizontal', 'Downward Diagonal'],
              ['reverse', 'Reverse']
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={config.directions[key]}
                  onChange={(e) =>
                    updateConfig({
                      directions: { ...config.directions, [key]: e.target.checked }
                    })
                  }
                  className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <hr className="border-gray-800" />

        {/* Filler Letters */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Filler Letters
          </span>
          <input
            type="text"
            value={config.fillerLetters}
            onChange={(e) => updateConfig({ fillerLetters: e.target.value })}
            placeholder="Leave empty for full alphabet"
            className="mt-1.5 w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </label>

        <hr className="border-gray-800" />

        {/* Letter Case */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Letter Case
          </span>
          <select
            value={config.letterCase}
            onChange={(e) => updateConfig({ letterCase: e.target.value as LetterCase })}
            className="mt-1.5 w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="uppercase">Uppercase</option>
            <option value="lowercase">Lowercase</option>
            <option value="preserve">Preserve</option>
            <option value="random">Random</option>
          </select>
        </label>

        <hr className="border-gray-800" />

        {/* Grid Size */}
        <fieldset>
          <legend className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
            Grid Size
          </legend>
          <div className="flex gap-3">
            <label className="flex-1">
              <span className="text-xs text-gray-500">Width</span>
              <input
                type="number"
                min={5}
                max={50}
                value={localGridWidth}
                onChange={(e) => {
                  setLocalGridWidth(e.target.value)
                  const num = Number(e.target.value)
                  if (!isNaN(num) && num >= 5 && num <= 50) {
                    updateConfig({ gridWidth: num })
                  }
                }}
                onBlur={() => {
                  const raw = Number(localGridWidth) || 5
                  const v = Math.max(5, Math.min(50, raw))
                  if (v !== raw) addToast(`Grid width clamped to ${v} (range: 5–50)`)
                  setLocalGridWidth(String(v))
                  updateConfig({ gridWidth: v })
                }}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </label>
            <label className="flex-1">
              <span className="text-xs text-gray-500">Height</span>
              <input
                type="number"
                min={5}
                max={50}
                value={localGridHeight}
                onChange={(e) => {
                  setLocalGridHeight(e.target.value)
                  const num = Number(e.target.value)
                  if (!isNaN(num) && num >= 5 && num <= 50) {
                    updateConfig({ gridHeight: num })
                  }
                }}
                onBlur={() => {
                  const raw = Number(localGridHeight) || 5
                  const v = Math.max(5, Math.min(50, raw))
                  if (v !== raw) addToast(`Grid height clamped to ${v} (range: 5–50)`)
                  setLocalGridHeight(String(v))
                  updateConfig({ gridHeight: v })
                }}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </label>
          </div>
        </fieldset>

        <hr className="border-gray-800" />

        {/* Title */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Title
          </span>
          <input
            type="text"
            value={config.title}
            onChange={(e) => updateConfig({ title: e.target.value })}
            placeholder="Enter a title for your puzzle"
            className="mt-1.5 w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </label>

        <hr className="border-gray-800" />

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={config.wordBank}
              onChange={(e) => updateConfig({ wordBank: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            Show Word Bank
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={config.showHints}
              onChange={(e) => updateConfig({ showHints: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            Show Hints
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={config.allowParallelContainment}
              onChange={(e) => updateConfig({ allowParallelContainment: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            Allow Parallel Containment
          </label>
        </div>

        <hr className="border-gray-800" />

        {/* Word Intersection */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Word Intersection
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <input
              type="range"
              min={1}
              max={5}
              value={config.intersectWords}
              onChange={(e) => updateConfig({ intersectWords: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm text-gray-300 w-6 text-right font-medium">{config.intersectWords}</span>
          </div>
        </label>

        {/* Generation Effort */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Generation Effort
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <input
              type="range"
              min={1}
              max={100}
              value={config.generationEffort}
              onChange={(e) => updateConfig({ generationEffort: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm text-gray-300 w-8 text-right font-medium">{config.generationEffort}</span>
          </div>
        </label>
      </div>
    </div>
  )
}
