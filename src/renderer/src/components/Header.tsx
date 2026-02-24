import { useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { usePuzzle } from '@/state/PuzzleContext'
import { generatePuzzle } from '@/engine/generatePuzzle'
import PrintView from './PrintView'

export default function Header() {
  const { state, dispatch } = usePuzzle()
  const printRef = useRef<HTMLDivElement>(null)

  function handleGenerate() {
    if (state.words.length === 0) return
    const result = generatePuzzle(state.words, state.config)
    dispatch({ type: 'SET_PUZZLE', payload: result })
  }

  const handleExportPdf = useCallback(async () => {
    await window.api.exportPdf()
  }, [])

  const handleExportPng = useCallback(async () => {
    const el = printRef.current
    if (!el) return
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff' })
    const dataUrl = canvas.toDataURL('image/png')
    await window.api.exportPng(dataUrl)
  }, [])

  const hasPuzzle = state.puzzle !== null

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <h1 className="text-lg font-semibold truncate">{state.config.title}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={state.words.length === 0}
            className="px-4 py-1.5 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Generate
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!hasPuzzle}
            className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            disabled={!hasPuzzle}
            className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export PNG
          </button>
        </div>
      </header>

      {/* Off-screen PrintView for PNG capture */}
      {state.puzzle && (
        <div
          ref={printRef}
          style={{ position: 'absolute', left: '-9999px', top: 0 }}
        >
          <PrintView
            puzzle={state.puzzle}
            config={state.config}
            display={state.display}
          />
        </div>
      )}
    </>
  )
}
