import WordListPanel from './components/WordListPanel'

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header area - to be added in Task 6 */}
      <div className="flex flex-1 overflow-hidden">
        <WordListPanel />
        <div className="flex-1 p-4 flex items-center justify-center">
          <p className="text-gray-500 text-lg">
            Puzzle area — generate a puzzle to see it here
          </p>
        </div>
      </div>
    </div>
  )
}
