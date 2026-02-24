import { usePuzzle } from '../state/PuzzleContext'
import WordCard from './WordCard'

export default function WordListPanel() {
  const { state, dispatch } = usePuzzle()

  function addWord() {
    dispatch({
      type: 'ADD_WORD',
      payload: {
        id: crypto.randomUUID(),
        word: '',
        optional: false,
        canRepeatedlySpawn: false,
        spawnWeight: 1,
        hint: ''
      }
    })
  }

  return (
    <div className="w-80 flex-shrink-0 border-r border-gray-700 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">
          Word List ({state.words.length})
        </h2>
        <button
          type="button"
          onClick={addWord}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-3 py-1 text-sm font-medium transition-colors"
          title="Add word"
        >
          +
        </button>
      </div>

      {/* Scrollable word list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {state.words.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            onUpdate={(changes) =>
              dispatch({ type: 'UPDATE_WORD', payload: { id: word.id, changes } })
            }
            onRemove={() => dispatch({ type: 'REMOVE_WORD', payload: word.id })}
          />
        ))}
        {state.words.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-8">
            No words yet. Click + to add one.
          </p>
        )}
      </div>
    </div>
  )
}
