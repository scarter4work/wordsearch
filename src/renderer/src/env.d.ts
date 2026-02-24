interface Window {
  api: {
    exportPdf: (dataUrl: string) => Promise<string | null>
    exportPng: (dataUrl: string) => Promise<string | null>
    saveProject: (data: string) => Promise<string | null>
    loadProject: () => Promise<string | null>
    searchWords: (concept: string) => Promise<string[]>
  }
}
