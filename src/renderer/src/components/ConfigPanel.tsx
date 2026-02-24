import { useState } from 'react'
import { usePuzzle } from '../state/PuzzleContext'
import type { LetterCase } from '../types'

export default function ConfigPanel() {
  const { state, dispatch } = usePuzzle()
  const { config } = state
  const [collapsed, setCollapsed] = useState(false)

  function updateConfig(changes: Parameters<typeof dispatch>[0] extends { type: 'UPDATE_CONFIG'; payload: infer P } ? P : never) {
    dispatch({ type: 'UPDATE_CONFIG', payload: changes })
  }

  if (collapsed) {
    return (
      <div className="border-t border-gray-700">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <span className="text-xs">&#9654;</span> Configuration
        </button>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-700">
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="w-full px-4 py-2 text-left text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
      >
        <span className="text-xs">&#9660;</span> Configuration
      </button>

      <div className="px-4 pb-4 space-y-4">
        {/* Word Directions */}
        <fieldset>
          <legend className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Word Directions
          </legend>
          <div className="space-y-1">
            {([
              ['up', 'Up'],
              ['down', 'Down'],
              ['upwardHorizontal', 'Upward Diagonal'],
              ['downwardHorizontal', 'Downward Diagonal'],
              ['reverse', 'Reverse']
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
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

        <hr className="border-gray-700" />

        {/* Filler Letters */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Filler Letters
          </span>
          <input
            type="text"
            value={config.fillerLetters}
            onChange={(e) => updateConfig({ fillerLetters: e.target.value })}
            placeholder="Leave empty for full alphabet"
            className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </label>

        <hr className="border-gray-700" />

        {/* Letter Case */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Letter Case
          </span>
          <select
            value={config.letterCase}
            onChange={(e) => updateConfig({ letterCase: e.target.value as LetterCase })}
            className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="uppercase">Uppercase</option>
            <option value="lowercase">Lowercase</option>
            <option value="both">Both</option>
          </select>
        </label>

        <hr className="border-gray-700" />

        {/* Grid Size */}
        <fieldset>
          <legend className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Grid Size
          </legend>
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="text-xs text-gray-500">X</span>
              <input
                type="number"
                min={5}
                max={50}
                value={config.gridWidth}
                onChange={(e) => updateConfig({ gridWidth: Math.max(5, Math.min(50, Number(e.target.value))) })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>
            <label className="flex-1">
              <span className="text-xs text-gray-500">Y</span>
              <input
                type="number"
                min={5}
                max={50}
                value={config.gridHeight}
                onChange={(e) => updateConfig({ gridHeight: Math.max(5, Math.min(50, Number(e.target.value))) })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </label>
          </div>
        </fieldset>

        <hr className="border-gray-700" />

        {/* Title */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Title
          </span>
          <input
            type="text"
            value={config.title}
            onChange={(e) => updateConfig({ title: e.target.value })}
            className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </label>

        <hr className="border-gray-700" />

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.wordBank}
              onChange={(e) => updateConfig({ wordBank: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            Show Word Bank
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showHints}
              onChange={(e) => updateConfig({ showHints: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            Show Hints
          </label>
        </div>

        <hr className="border-gray-700" />

        {/* Word Intersection */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Word Intersection
          </span>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="range"
              min={1}
              max={5}
              value={config.intersectWords}
              onChange={(e) => updateConfig({ intersectWords: Number(e.target.value) })}
              className="flex-1 accent-blue-500"
            />
            <span className="text-sm text-gray-300 w-6 text-right">{config.intersectWords}</span>
          </div>
        </label>

        {/* Generation Effort */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Generation Effort
          </span>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="range"
              min={1}
              max={100}
              value={config.generationEffort}
              onChange={(e) => updateConfig({ generationEffort: Number(e.target.value) })}
              className="flex-1 accent-blue-500"
            />
            <span className="text-sm text-gray-300 w-8 text-right">{config.generationEffort}</span>
          </div>
        </label>
      </div>
    </div>
  )
}
