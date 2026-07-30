import { APP_PREFS_STORAGE_KEY } from './constants'
import { DEFAULT_APP_PREFS, type AppPrefs, type PrefsStorage } from './types'

function browserLocalStorage(): PrefsStorage | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

function isAppPrefs(value: unknown): value is AppPrefs {
  if (value === null || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.termoAccepted === 'boolean' &&
    (record.termoAcceptedAt === null || typeof record.termoAcceptedAt === 'string') &&
    (record.firstUseAt === null || typeof record.firstUseAt === 'string') &&
    (record.lastBackupAt === null || typeof record.lastBackupAt === 'string') &&
    typeof record.editsSinceBackup === 'number'
  )
}

export interface AppPrefsStoreOptions {
  storage?: PrefsStorage | null
  now?: () => string
}

export interface AppPrefsStore {
  read(): AppPrefs
  write(prefs: AppPrefs): void
  acceptTermo(): AppPrefs
  recordEdit(): AppPrefs
  recordBackupConfirmed(): AppPrefs
  reset(): void
}

export function createAppPrefsStore(options: AppPrefsStoreOptions = {}): AppPrefsStore {
  const storage = options.storage === undefined ? browserLocalStorage() : options.storage
  const now = options.now ?? (() => new Date().toISOString())

  function read(): AppPrefs {
    if (!storage) return { ...DEFAULT_APP_PREFS }
    try {
      const raw = storage.getItem(APP_PREFS_STORAGE_KEY)
      if (!raw) return { ...DEFAULT_APP_PREFS }
      const parsed: unknown = JSON.parse(raw)
      if (!isAppPrefs(parsed)) return { ...DEFAULT_APP_PREFS }
      return {
        ...DEFAULT_APP_PREFS,
        ...parsed,
        editsSinceBackup: Math.max(0, Math.floor(parsed.editsSinceBackup)),
      }
    } catch {
      return { ...DEFAULT_APP_PREFS }
    }
  }

  function write(prefs: AppPrefs): void {
    if (!storage) return
    storage.setItem(APP_PREFS_STORAGE_KEY, JSON.stringify(prefs))
  }

  return {
    read,
    write,
    acceptTermo(): AppPrefs {
      const current = read()
      if (current.termoAccepted) return current
      const at = now()
      const next: AppPrefs = {
        ...current,
        termoAccepted: true,
        termoAcceptedAt: at,
        firstUseAt: current.firstUseAt ?? at,
      }
      write(next)
      return next
    },
    recordEdit(): AppPrefs {
      const current = read()
      const next: AppPrefs = {
        ...current,
        editsSinceBackup: current.editsSinceBackup + 1,
      }
      write(next)
      return next
    },
    recordBackupConfirmed(): AppPrefs {
      const current = read()
      const next: AppPrefs = {
        ...current,
        lastBackupAt: now(),
        editsSinceBackup: 0,
      }
      write(next)
      return next
    },
    reset(): void {
      if (!storage) return
      storage.removeItem(APP_PREFS_STORAGE_KEY)
    },
  }
}

/** Store padrão (localStorage do navegador). */
export const appPrefsStore = createAppPrefsStore()
