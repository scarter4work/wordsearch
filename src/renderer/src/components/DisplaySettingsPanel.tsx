import { useState } from 'react'
import { usePuzzle } from '../state/PuzzleContext'

const FONT_OPTIONS = [
  'Courier New',
  'Arial',
  'Georgia',
  'Comic Sans MS',
  'Impact',
  'Consolas',
  'monospace'
]

export default function DisplaySettingsPanel() {
  const { state, dispatch } = usePuzzle()
  const { display } = state
  const [collapsed, setCollapsed] = useState(false)

  function updateDisplay(changes: Partial<typeof display>) {
    dispatch({ type: 'UPDATE_DISPLAY', payload: changes })
  }

  if (collapsed) {
    return (
      <div className="border-t border-gray-700">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <span className="text-xs">&#9654;</span> Display Settings
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
        <span className="text-xs">&#9660;</span> Display Settings
      </button>

      <div className="px-4 pb-4 space-y-4">
        {/* Font Family */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Font
          </span>
          <select
            value={display.fontFamily}
            onChange={(e) => updateDisplay({ fontFamily: e.target.value })}
            className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>

        {/* Font Size */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Font Size
          </span>
          <input
            type="number"
            min={8}
            max={48}
            value={display.fontSize}
            onChange={(e) => updateDisplay({ fontSize: Math.max(8, Math.min(48, Number(e.target.value))) })}
            className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </label>

        {/* Cell Spacing */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Cell Spacing
          </span>
          <input
            type="number"
            min={0}
            max={16}
            value={display.cellSpacing}
            onChange={(e) => updateDisplay({ cellSpacing: Math.max(0, Math.min(16, Number(e.target.value))) })}
            className="mt-1 w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </label>
      </div>
    </div>
  )
}
