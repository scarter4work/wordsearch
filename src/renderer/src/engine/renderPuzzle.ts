import type { GeneratedPuzzle, PuzzleConfig, DisplaySettings } from '../types'

/**
 * Renders the puzzle to a canvas with pixel-perfect text centering.
 * Returns a data URL of the rendered image.
 *
 * Uses a two-pass approach: first pass measures text to calculate exact layout,
 * second pass renders to the correctly-sized canvas.
 */
export function renderPuzzleToDataUrl(
  puzzle: GeneratedPuzzle,
  config: PuzzleConfig,
  display: DisplaySettings
): string {
  const { grid, hints } = puzzle
  const rows = grid.length
  const cols = grid[0].length
  const cellSize = display.fontSize + display.cellSpacing * 2 + 8
  const padding = 40
  const scale = 2 // hi-dpi for crisp output
  const gridWidth = cols * cellSize
  const gridHeight = rows * cellSize
  const titleFontSize = display.fontSize * 1.8
  const bodyFontSize = display.fontSize * 0.85
  const sectionGap = 24
  const hasTitle = config.title.trim().length > 0
  const canvasWidth = Math.max(gridWidth + padding * 2, 400)
  const availableWidth = canvasWidth - padding * 2

  // --- Measurement pass (temporary canvas for measureText) ---
  const measureCanvas = document.createElement('canvas')
  measureCanvas.width = 1
  measureCanvas.height = 1
  const mctx = measureCanvas.getContext('2d')!

  // Prepare hint layout
  let hintCols = 1
  let hintTexts: string[] = []
  if (config.showHints && hints.length > 0) {
    mctx.font = `${bodyFontSize}px ${display.fontFamily}`
    hintTexts = hints.map((h, i) => `${i + 1}. ${h.hint}`)
    const maxHintWidth = Math.max(...hintTexts.map(h => mctx.measureText(h).width), 50)
    hintCols = Math.max(1, Math.min(3, Math.floor(availableWidth / (maxHintWidth + 16))))
  }

  // Prepare word bank layout
  let wordBankCols = 3
  let uniqueWords: string[] = []
  if (config.wordBank) {
    mctx.font = `${bodyFontSize}px ${display.fontFamily}`
    const words = puzzle.placedWords.map(pw => {
      const count = puzzle.wordCounts[pw.word]
      return count > 1 ? `${pw.word} (x${count})` : pw.word
    })
    uniqueWords = [...new Set(words)]
    const maxWordWidth = Math.max(...uniqueWords.map(w => mctx.measureText(w).width), 50)
    wordBankCols = Math.max(1, Math.min(5, Math.floor(availableWidth / (maxWordWidth + 16))))
  }

  // --- Calculate exact content height ---
  let contentHeight = padding + (hasTitle ? titleFontSize + 20 : 0) + gridHeight + sectionGap

  if (config.showHints && hintTexts.length > 0) {
    contentHeight += bodyFontSize * 1.5 // heading
    contentHeight += Math.ceil(hintTexts.length / hintCols) * (bodyFontSize * 1.6)
    contentHeight += sectionGap
  }

  if (config.wordBank && uniqueWords.length > 0) {
    contentHeight += bodyFontSize * 1.5 // heading
    contentHeight += Math.ceil(uniqueWords.length / wordBankCols) * (bodyFontSize * 1.8)
  }

  contentHeight += padding

  const canvasHeight = contentHeight

  // --- Scaling to fit Letter page (72dpi) with 0.4in margins ---
  const maxPageWidth = 736  // 816 - 80
  const maxPageHeight = 976 // 1056 - 80

  let scaleFactor = 1
  if (canvasWidth > maxPageWidth || canvasHeight > maxPageHeight) {
    scaleFactor = Math.min(maxPageWidth / canvasWidth, maxPageHeight / canvasHeight, 1)
  }

  const effectiveWidth = Math.round(canvasWidth * scaleFactor)
  const effectiveHeight = Math.round(canvasHeight * scaleFactor)

  // --- Render pass ---
  const canvas = document.createElement('canvas')
  canvas.width = effectiveWidth * scale
  canvas.height = effectiveHeight * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale * scaleFactor, scale * scaleFactor)

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  ctx.fillStyle = '#000000'

  // Title
  let y = padding
  if (hasTitle) {
    ctx.font = `bold ${titleFontSize}px ${display.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(config.title, canvasWidth / 2, y)
    y += titleFontSize + 20
  }

  // Grid
  const gridLeft = (canvasWidth - gridWidth) / 2

  ctx.font = `600 ${display.fontSize}px ${display.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gridLeft + c * cellSize
      const cellY = y + r * cellSize

      // Cell border
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      ctx.strokeRect(x, cellY, cellSize, cellSize)

      // Letter — perfectly centered
      ctx.fillStyle = '#000000'
      ctx.fillText(grid[r][c], x + cellSize / 2, cellY + cellSize / 2)
    }
  }

  // Outer grid border
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  ctx.strokeRect(gridLeft, y, gridWidth, gridHeight)

  y += gridHeight + sectionGap

  // Hints (multi-column)
  if (config.showHints && hintTexts.length > 0) {
    ctx.font = `bold ${bodyFontSize * 1.2}px ${display.fontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('Hints', padding, y)
    y += bodyFontSize * 1.5

    ctx.font = `${bodyFontSize}px ${display.fontFamily}`
    const hintColWidth = availableWidth / hintCols
    hintTexts.forEach((text, i) => {
      const col = i % hintCols
      const row = Math.floor(i / hintCols)
      ctx.fillText(text, padding + col * hintColWidth, y + row * bodyFontSize * 1.6)
    })
    y += Math.ceil(hintTexts.length / hintCols) * bodyFontSize * 1.6
    y += sectionGap / 2
  }

  // Word bank (dynamic columns)
  if (config.wordBank && uniqueWords.length > 0) {
    ctx.font = `bold ${bodyFontSize * 1.2}px ${display.fontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('Word Bank', padding, y)
    y += bodyFontSize * 1.5

    ctx.font = `${bodyFontSize}px ${display.fontFamily}`
    const colWidth = availableWidth / wordBankCols
    uniqueWords.forEach((word, i) => {
      const col = i % wordBankCols
      const row = Math.floor(i / wordBankCols)
      ctx.fillText(word, padding + col * colWidth, y + row * bodyFontSize * 1.8)
    })
  }

  return canvas.toDataURL('image/png')
}
