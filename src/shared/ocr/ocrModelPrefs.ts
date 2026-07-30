/**
 * Preferências locais do modelo OCR (fora do SQLite).
 * Controla o aviso de download na primeira uso.
 */

import type { PrefsStorage } from '../appPrefs/types'

export const OCR_MODEL_PREFS_KEY = 'hvcf.ocrModel.v1'

export interface OcrModelPrefs {
  /** Usuário já foi avisado / confirmou o download do modelo. */
  downloadAcked: boolean
}

export const DEFAULT_OCR_MODEL_PREFS: OcrModelPrefs = {
  downloadAcked: false,
}

function browserLocalStorage(): PrefsStorage | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

function isOcrModelPrefs(value: unknown): value is OcrModelPrefs {
  if (value === null || typeof value !== 'object') return false
  return typeof (value as OcrModelPrefs).downloadAcked === 'boolean'
}

export interface OcrModelPrefsStore {
  read(): OcrModelPrefs
  write(prefs: OcrModelPrefs): void
  acknowledgeDownload(): OcrModelPrefs
  reset(): void
}

export function createOcrModelPrefsStore(storage?: PrefsStorage | null): OcrModelPrefsStore {
  const store = storage === undefined ? browserLocalStorage() : storage

  function read(): OcrModelPrefs {
    if (!store) return { ...DEFAULT_OCR_MODEL_PREFS }
    try {
      const raw = store.getItem(OCR_MODEL_PREFS_KEY)
      if (!raw) return { ...DEFAULT_OCR_MODEL_PREFS }
      const parsed: unknown = JSON.parse(raw)
      if (!isOcrModelPrefs(parsed)) return { ...DEFAULT_OCR_MODEL_PREFS }
      return { downloadAcked: parsed.downloadAcked }
    } catch {
      return { ...DEFAULT_OCR_MODEL_PREFS }
    }
  }

  function write(prefs: OcrModelPrefs): void {
    if (!store) return
    store.setItem(OCR_MODEL_PREFS_KEY, JSON.stringify(prefs))
  }

  return {
    read,
    write,
    acknowledgeDownload(): OcrModelPrefs {
      const next: OcrModelPrefs = { downloadAcked: true }
      write(next)
      return next
    },
    reset(): void {
      if (!store) return
      store.removeItem(OCR_MODEL_PREFS_KEY)
    },
  }
}

export const ocrModelPrefsStore = createOcrModelPrefsStore()
