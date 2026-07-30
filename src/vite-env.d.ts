/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'sql.js/dist/sql-wasm.wasm?url' {
  const wasmUrl: string
  export default wasmUrl
}

/** Tipagem mínima da File System Access API (nem todos os lib.dom a expõem). */
interface SaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: FileSystemWriteChunkType): Promise<void>
  close(): Promise<void>
}

type FileSystemWriteChunkType = BufferSource | Blob | string

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface Window {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>
  /** Mock de OCR para E2E/CI — evita Tesseract real e download do modelo. */
  __HVCF_MOCK_OCR__?: (bytes: Uint8Array, signal?: AbortSignal) => Promise<{ text: string }>
  /**
   * Mock de suporte mínimo (OPFS / Safari 16.4+) para E2E.
   * `false` força o aviso de navegador abaixo do suporte.
   */
  __HVCF_MOCK_MINIMUM_BROWSER__?: boolean
}
