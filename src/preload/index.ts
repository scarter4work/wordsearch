import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  exportPdf: (): Promise<string | null> => ipcRenderer.invoke('export-pdf'),
  exportPng: (dataUrl: string): Promise<string | null> => ipcRenderer.invoke('export-png', dataUrl)
})
