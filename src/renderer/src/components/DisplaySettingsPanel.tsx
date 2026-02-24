import { useState } from 'react'
import { usePuzzle } from '../state/PuzzleContext'

const FONT_OPTIONS = [
  'Courier New',
  'Arial',
  'Georgia',
  'Comic Sans MS',
  'Impact',
  'Consolas',
  'Trebuchet MS',
  'Verdana',
  'Times New Roman',
  'Palatino Linotype',
  'Lucida Console',
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
      <div className="border-t border-gray-800">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full px-4 py-2.5 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Display Settings
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
        Display Settings
      </button>

      <div className="px-4 pb-4 space-y-4">
        {/* Font Family */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Font
          </span>
          <select
            value={display.fontFamily}
            onChange={(e) => updateDisplay({ fontFamily: e.target.value })}
            className="mt-1.5 w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            style={{ fontFamily: display.fontFamily }}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </label>

        {/* Font Size */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Font Size
          </span>
          <input
            type="number"
            min={8}
            max={48}
            value={display.fontSize}
            onChange={(e) => updateDisplay({ fontSize: Math.max(8, Math.min(48, Number(e.target.value))) })}
            className="mt-1.5 w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </label>

        {/* Cell Spacing */}
        <label className="block">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Cell Spacing
          </span>
          <input
            type="number"
            min={0}
            max={16}
            value={display.cellSpacing}
            onChange={(e) => updateDisplay({ cellSpacing: Math.max(0, Math.min(16, Number(e.target.value))) })}
            className="mt-1.5 w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </label>
      </div>
    </div>
  )
}
