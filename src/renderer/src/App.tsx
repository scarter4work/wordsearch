import { useState } from 'react'
import Header from './components/Header'
import WordListPanel from './components/WordListPanel'
import PuzzleGrid from './components/PuzzleGrid'
import WordBankDisplay from './components/WordBankDisplay'
import ConfigPanel from './components/ConfigPanel'
import DisplaySettingsPanel from './components/DisplaySettingsPanel'

export default function App() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: WordListPanel */}
        <WordListPanel />
        {/* Right: puzzle + settings */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Puzzle area */}
          <div className="flex-1 overflow-auto p-4">
            <PuzzleGrid />
            <WordBankDisplay />
          </div>
          {/* Settings toggle */}
          <div className="border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xs">{showSettings ? '\u25BC' : '\u25B2'}</span>
              Settings
            </button>
          </div>
          {/* Collapsible settings panels */}
          {showSettings && (
            <div className="max-h-80 overflow-y-auto bg-gray-900">
              <ConfigPanel />
              <DisplaySettingsPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
