import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { is } from '@electron-toolkit/utils'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())

ipcMain.handle('export-pdf', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return null
  const { filePath } = await dialog.showSaveDialog(win, {
    defaultPath: 'wordsearch.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (!filePath) return null
  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    landscape: false,
    pageSize: 'Letter'
  })
  await writeFile(filePath, pdf)
  return filePath
})

ipcMain.handle('export-png', async (_event, dataUrl: string) => {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null
  const { filePath } = await dialog.showSaveDialog(win, {
    defaultPath: 'wordsearch.png',
    filters: [{ name: 'PNG', extensions: ['png'] }]
  })
  if (!filePath) return null
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  await writeFile(filePath, Buffer.from(base64, 'base64'))
  return filePath
})
