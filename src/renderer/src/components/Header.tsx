import { useCallback, useState } from 'react'
import { usePuzzle } from '@/state/PuzzleContext'
import { generatePuzzle } from '@/engine/generatePuzzle'
import { renderPuzzleToDataUrl } from '@/engine/renderPuzzle'
import { useToast } from '../App'

export default function Header() {
  const { state, dispatch } = usePuzzle()
  const { addToast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  function handleGenerate() {
    if (state.words.length === 0) return
    const validWords = state.words.filter((w) => w.word.trim().length > 0)
    if (validWords.length === 0) {
      addToast('No valid words to generate — words must be at least 1 character')
      return
    }
    const emptyCount = state.words.length - validWords.length
    if (emptyCount > 0) {
      addToast(`Skipped ${emptyCount} empty word${emptyCount > 1 ? 's' : ''}`)
    }
    const maxDim = Math.max(state.config.gridWidth, state.config.gridHeight)
    const oversized = validWords.filter((w) => w.word.trim().length > maxDim)
    if (oversized.length > 0) {
      addToast(`Warning: ${oversized.map((w) => `"${w.word.trim()}"`).join(', ')} longer than grid size (${maxDim}) — may not be placed`)
    }
    setIsGenerating(true)
    // Use a microtask to allow UI to update before generating
    setTimeout(() => {
      const result = generatePuzzle(validWords, state.config)
      dispatch({ type: 'SET_PUZZLE', payload: result })
      const placed = result.placedWords.length
      const skipped = result.skippedWords.length
      if (skipped > 0) {
        addToast(`Puzzle generated! ${placed} placed, ${skipped} skipped: ${result.skippedWords.join(', ')}`)
      } else {
        addToast(`Puzzle generated! ${placed} words placed`)
      }
      setIsGenerating(false)
    }, 50)
  }

  const handleExportPdf = useCallback(async () => {
    if (!state.puzzle) return
    const dataUrl = renderPuzzleToDataUrl(state.puzzle, state.config, state.display)
    await window.api.exportPdf(dataUrl)
    addToast('Export complete')
  }, [state.puzzle, state.config, state.display, addToast])

  const handleExportPng = useCallback(async () => {
    if (!state.puzzle) return
    const dataUrl = renderPuzzleToDataUrl(state.puzzle, state.config, state.display)
    await window.api.exportPng(dataUrl)
    addToast('Export complete')
  }, [state.puzzle, state.config, state.display, addToast])

  const handleSave = useCallback(async () => {
    const json = JSON.stringify({ version: 1, words: state.words, config: state.config, display: state.display })
    await window.api.saveProject(json)
    addToast('Project saved')
  }, [state.words, state.config, state.display, addToast])

  const handleLoad = useCallback(async () => {
    const result = await window.api.loadProject()
    if (result) {
      const data = JSON.parse(result)
      dispatch({ type: 'LOAD_STATE', payload: { words: data.words, config: data.config, display: data.display } })
      addToast('Project loaded')
    }
  }, [dispatch, addToast])

  const hasPuzzle = state.puzzle !== null

  return (
    <>
      <header className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 shrink-0 relative">
        {/* Accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-600/0 via-blue-500/40 to-blue-600/0" />

        <h1 className="text-lg font-semibold truncate text-gray-100">{state.config.title || <span className="text-gray-500 italic">Word Search Generator</span>}</h1>
        <div className="flex items-center gap-2">
          {/* File operations */}
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/50 transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            Save
          </button>
          <button
            type="button"
            onClick={handleLoad}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/50 transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
              <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
            </svg>
            Load
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-700/50 mx-1" />

          {/* Generate */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={state.words.length === 0 || isGenerating}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Generate
              </>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-700/50 mx-1" />

          {/* Export */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!hasPuzzle}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            PDF
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            disabled={!hasPuzzle}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            PNG
          </button>
        </div>
      </header>
    </>
  )
}
