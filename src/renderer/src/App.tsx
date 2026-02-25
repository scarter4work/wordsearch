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
          {/* Left sidebar: settings + word list */}
          <div className="w-80 flex-shrink-0 border-r border-gray-800 flex flex-col bg-gray-950">
            <div className="flex-shrink-0 overflow-y-auto max-h-[60vh]">
              <ConfigPanel />
              <DisplaySettingsPanel />
            </div>
            <WordListPanel />
          </div>
          {/* Right: puzzle area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-6">
              <PuzzleGrid />
              <WordBankDisplay />
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} />
      </div>
    </ToastContext.Provider>
  )
}
