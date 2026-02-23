import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Will be populated with IPC methods in later tasks
})
