import { beforeEach, describe, expect, it } from 'vitest'
import { APP_PREFS_STORAGE_KEY } from './constants'
import { createAppPrefsStore } from './appPrefsStore'
import { DEFAULT_APP_PREFS, type PrefsStorage } from './types'

function createMemoryPrefsStorage(): PrefsStorage {
  const map = new Map<string, string>()
  return {
    getItem(key) {
      return map.has(key) ? (map.get(key) ?? null) : null
    },
    setItem(key, value) {
      map.set(key, value)
    },
    removeItem(key) {
      map.delete(key)
    },
  }
}

describe('createAppPrefsStore (integração local)', () => {
  let storage: PrefsStorage

  beforeEach(() => {
    storage = createMemoryPrefsStorage()
  })

  it('deve iniciar com defaults e sobreviver a reload (re-leitura)', () => {
    const store = createAppPrefsStore({
      storage,
      now: () => '2026-07-29T10:00:00.000Z',
    })
    expect(store.read()).toEqual(DEFAULT_APP_PREFS)

    const accepted = store.acceptTermo()
    expect(accepted.termoAccepted).toBe(true)
    expect(accepted.termoAcceptedAt).toBe('2026-07-29T10:00:00.000Z')
    expect(accepted.firstUseAt).toBe('2026-07-29T10:00:00.000Z')

    const reloaded = createAppPrefsStore({ storage })
    expect(reloaded.read()).toEqual(accepted)
    expect(storage.getItem(APP_PREFS_STORAGE_KEY)).toContain('"termoAccepted":true')
  })

  it('deve incrementar edições e zerar no export confirmado', () => {
    const store = createAppPrefsStore({
      storage,
      now: () => '2026-07-29T12:00:00.000Z',
    })
    store.acceptTermo()
    store.recordEdit()
    store.recordEdit()
    expect(store.read().editsSinceBackup).toBe(2)

    const afterBackup = store.recordBackupConfirmed()
    expect(afterBackup.editsSinceBackup).toBe(0)
    expect(afterBackup.lastBackupAt).toBe('2026-07-29T12:00:00.000Z')
  })

  it('não deve regravar aceite se já aceito', () => {
    const store = createAppPrefsStore({
      storage,
      now: () => '2026-07-29T10:00:00.000Z',
    })
    store.acceptTermo()
    const again = createAppPrefsStore({
      storage,
      now: () => '2026-07-30T10:00:00.000Z',
    }).acceptTermo()
    expect(again.termoAcceptedAt).toBe('2026-07-29T10:00:00.000Z')
  })

  it('deve tolerar JSON inválido e voltar aos defaults', () => {
    storage.setItem(APP_PREFS_STORAGE_KEY, '{broken')
    const store = createAppPrefsStore({ storage })
    expect(store.read()).toEqual(DEFAULT_APP_PREFS)
  })
})
