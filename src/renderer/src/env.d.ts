interface Window {
  api: {
    exportPdf: () => Promise<string | null>
    exportPng: (dataUrl: string) => Promise<string | null>
  }
}
