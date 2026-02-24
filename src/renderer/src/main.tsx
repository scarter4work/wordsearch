import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { PuzzleProvider } from './state/PuzzleContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PuzzleProvider>
      <App />
    </PuzzleProvider>
  </React.StrictMode>
)
