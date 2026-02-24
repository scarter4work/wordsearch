import { useState, useCallback, createContext, useContext } from 'react'
import Header from './components/Header'
import WordListPanel from './components/WordListPanel'
import PuzzleGrid from './components/PuzzleGrid'
import WordBankDisplay from './components/WordBankDisplay'
import ConfigPanel from './components/ConfigPanel'
import DisplaySettingsPanel from './components/DisplaySettingsPanel'

// --- Toast system ---
interface Toast {
  id: string
  message: string
  exiting?: boolean
}

interface ToastContextType {
  addToast: (message: string) => void
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} })
export const useToast = () => useContext(ToastContext)

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 shadow-lg shadow-black/30 text-sm text-gray-200 max-w-xs ${
            t.exiting ? 'toast-exit' : 'toast-enter'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      )
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 200)
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className="flex flex-col h-screen bg-gray-950 text-white">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {/* Left: WordListPanel */}
          <WordListPanel />
          {/* Right: puzzle + settings */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Puzzle area */}
            <div className="flex-1 overflow-auto p-6">
              <PuzzleGrid />
              <WordBankDisplay />
            </div>
            {/* Settings toggle */}
            <div className="border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="w-full px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3 w-3 transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Settings
              </button>
            </div>
            {/* Collapsible settings panels */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                showSettings ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="overflow-y-auto max-h-80 bg-gray-900/80">
                <ConfigPanel />
                <DisplaySettingsPanel />
              </div>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} />
      </div>
    </ToastContext.Provider>
  )
}
