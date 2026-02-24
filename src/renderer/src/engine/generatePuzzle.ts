import type { WordEntry, PuzzleConfig, GeneratedPuzzle, PlacedWord } from '../types'
import { getEnabledDirections, type DirectionVector } from './directions'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function applyCase(word: string, letterCase: string): string {
  if (letterCase === 'lowercase') return word.toLowerCase()
  if (letterCase === 'uppercase') return word.toUpperCase()
  if (letterCase === 'preserve') return word  // keep original casing as entered
  // 'random' — randomly pick upper/lower per character
  return word
    .split('')
    .map((ch) => (Math.random() < 0.5 ? ch.toUpperCase() : ch.toLowerCase()))
    .join('')
}

function randomChar(fillerLetters: string, letterCase: string): string {
  const pool = fillerLetters.length > 0 ? fillerLetters.toUpperCase() : ALPHABET
  const ch = pool[Math.floor(Math.random() * pool.length)]
  if (letterCase === 'lowercase') return ch.toLowerCase()
  if (letterCase === 'uppercase') return ch.toUpperCase()
  // 'preserve' and 'random' both get random case for filler
  return Math.random() < 0.5 ? ch.toUpperCase() : ch.toLowerCase()
}

interface PlacementCandidate {
  row: number
  col: number
  dir: DirectionVector
  score: number
  cells: Array<{ row: number; col: number }>
}

function tryPlace(
  grid: (string | null)[][],
  word: string,
  directions: DirectionVector[],
  maxAttempts: number,
  intersectNorm: number
): PlacementCandidate | null {
  const height = grid.length
  const width = grid[0].length

  if (word.length > Math.max(width, height)) return null

  let best: PlacementCandidate | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const dir = directions[Math.floor(Math.random() * directions.length)]
    const row = Math.floor(Math.random() * height)
    const col = Math.floor(Math.random() * width)

    // Check if word fits
    const endRow = row + dir.dRow * (word.length - 1)
    const endCol = col + dir.dCol * (word.length - 1)
    if (endRow < 0 || endRow >= height || endCol < 0 || endCol >= width) continue

    let valid = true
    let intersections = 0
    const cells: Array<{ row: number; col: number }> = []

    for (let i = 0; i < word.length; i++) {
      const r = row + dir.dRow * i
      const c = col + dir.dCol * i
      const existing = grid[r][c]
      if (existing !== null && existing !== word[i]) {
        valid = false
        break
      }
      if (existing === word[i]) {
        intersections++
      }
      cells.push({ row: r, col: c })
    }

    if (!valid) continue

    const score = intersections * intersectNorm + Math.random() * 0.1
    if (best === null || score > best.score) {
      best = { row, col, dir, score, cells }
    }

    // Early exit if we found a good enough placement
    if (best.score > 1) break
  }

  return best
}

function buildPlacementList(words: WordEntry[], letterCase: string): Array<{ word: string; hint: string }> {
  const list: Array<{ word: string; hint: string }> = []

  for (const entry of words) {
    const casedWord = applyCase(entry.word, letterCase)

    if (entry.optional) {
      // Optional spawn chance = spawnWeight / (spawnWeight + 1)
      // weight 0 = never, weight 1 = 50%, etc.
      const chance = entry.spawnWeight / (entry.spawnWeight + 1)
      if (Math.random() >= chance) continue
    }

    list.push({ word: casedWord, hint: entry.hint })

    if (entry.canRepeatedlySpawn) {
      const extraCopies = Math.floor(entry.spawnWeight)
      for (let i = 0; i < extraCopies; i++) {
        list.push({ word: casedWord, hint: entry.hint })
      }
    }
  }

  // Sort by word length descending (longest first)
  list.sort((a, b) => b.word.length - a.word.length)

  return list
}

export function generatePuzzle(words: WordEntry[], config: PuzzleConfig): GeneratedPuzzle {
  const { gridWidth, gridHeight, fillerLetters, letterCase, intersectWords, generationEffort } = config

  // Initialize grid with nulls
  const grid: (string | null)[][] = Array.from({ length: gridHeight }, () =>
    Array.from({ length: gridWidth }, () => null)
  )

  const directions = getEnabledDirections(config.directions)
  const maxAttempts = Math.round(50 + (generationEffort / 100) * 4950)
  const intersectNorm = (intersectWords - 3) / 2

  const placementList = buildPlacementList(words, letterCase)

  const placedWords: PlacedWord[] = []
  const skippedWords: string[] = []
  const wordCounts: Record<string, number> = {}
  const hints: Array<{ word: string; hint: string }> = []

  for (const entry of placementList) {
    const candidate = tryPlace(grid, entry.word, directions, maxAttempts, intersectNorm)

    if (candidate) {
      // Place the word on the grid
      for (let i = 0; i < entry.word.length; i++) {
        const r = candidate.cells[i].row
        const c = candidate.cells[i].col
        grid[r][c] = entry.word[i]
      }

      placedWords.push({
        word: entry.word,
        startRow: candidate.row,
        startCol: candidate.col,
        direction: candidate.dir.name,
        cells: candidate.cells
      })

      wordCounts[entry.word] = (wordCounts[entry.word] || 0) + 1

      if (entry.hint) {
        hints.push({ word: entry.word, hint: entry.hint })
      }
    } else {
      if (!skippedWords.includes(entry.word)) {
        skippedWords.push(entry.word)
      }
    }
  }

  // Fill empty cells
  const finalGrid: string[][] = grid.map((row) =>
    row.map((cell) => (cell !== null ? cell : randomChar(fillerLetters, letterCase)))
  )

  return {
    grid: finalGrid,
    placedWords,
    skippedWords,
    wordCounts,
    hints
  }
}
