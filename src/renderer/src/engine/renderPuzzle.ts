import type { GeneratedPuzzle, PuzzleConfig, DisplaySettings } from '../types'

/**
 * Renders the puzzle to a canvas with pixel-perfect text centering.
 * Returns a data URL of the rendered image.
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

  // Pre-calculate content height
  let contentHeight = padding + (hasTitle ? titleFontSize + 20 : 0) + gridHeight + sectionGap

  // Hints section height
  if (config.showHints && hints.length > 0) {
    contentHeight += bodyFontSize * 1.5 // "Hints" heading
    contentHeight += hints.length * (bodyFontSize * 1.6)
    contentHeight += sectionGap
  }

  // Word bank height
  if (config.wordBank) {
    contentHeight += bodyFontSize * 1.5 // "Word Bank" heading
    contentHeight += Math.ceil(puzzle.placedWords.length / 5) * (bodyFontSize * 1.8)
  }

  contentHeight += padding

  const canvasWidth = Math.max(gridWidth + padding * 2, 400)
  const canvasHeight = contentHeight

  // Target max dimensions for Letter page (72dpi) with 0.4in margins
  const maxPageWidth = 736  // 816 - 80
  const maxPageHeight = 976 // 1056 - 80

  let scaleFactor = 1
  if (canvasWidth > maxPageWidth || canvasHeight > maxPageHeight) {
    scaleFactor = Math.min(maxPageWidth / canvasWidth, maxPageHeight / canvasHeight, 1)
  }

  const effectiveWidth = Math.round(canvasWidth * scaleFactor)
  const effectiveHeight = Math.round(canvasHeight * scaleFactor)

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

  // Draw grid cells and letters
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

  // Hints
  if (config.showHints && hints.length > 0) {
    ctx.font = `bold ${bodyFontSize * 1.2}px ${display.fontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('Hints', padding, y)
    y += bodyFontSize * 1.5

    ctx.font = `${bodyFontSize}px ${display.fontFamily}`
    hints.forEach((h, i) => {
      ctx.fillText(`${i + 1}. ${h.hint}`, padding + 8, y)
      y += bodyFontSize * 1.6
    })
    y += sectionGap / 2
  }

  // Word bank
  if (config.wordBank) {
    ctx.font = `bold ${bodyFontSize * 1.2}px ${display.fontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('Word Bank', padding, y)
    y += bodyFontSize * 1.5

    ctx.font = `${bodyFontSize}px ${display.fontFamily}`
    const words = puzzle.placedWords.map(pw => {
      const count = puzzle.wordCounts[pw.word]
      return count > 1 ? `${pw.word} (x${count})` : pw.word
    })
    // Deduplicate
    const unique = [...new Set(words)]
    const colWidth = (canvasWidth - padding * 2) / 5
    unique.forEach((word, i) => {
      const col = i % 5
      const row = Math.floor(i / 5)
      ctx.fillText(word, padding + col * colWidth, y + row * bodyFontSize * 1.8)
    })
  }

  return canvas.toDataURL('image/png')
}
