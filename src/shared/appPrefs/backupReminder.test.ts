import { describe, expect, it } from 'vitest'
import { shouldShowBackupReminder } from './backupReminder'
import { DEFAULT_APP_PREFS, type AppPrefs } from './types'

function prefs(partial: Partial<AppPrefs>): AppPrefs {
  return {
    ...DEFAULT_APP_PREFS,
    termoAccepted: true,
    firstUseAt: '2026-07-01T00:00:00.000Z',
    ...partial,
  }
}

describe('shouldShowBackupReminder', () => {
  it('não deve exibir se o termo não foi aceito', () => {
    expect(
      shouldShowBackupReminder({
        prefs: prefs({ termoAccepted: false, editsSinceBackup: 99 }),
        dismissedThisSession: false,
        editThreshold: 5,
      }),
    ).toBe(false)
  })

  it('não deve exibir se dispensado nesta sessão', () => {
    expect(
      shouldShowBackupReminder({
        prefs: prefs({ editsSinceBackup: 99 }),
        dismissedThisSession: true,
        editThreshold: 5,
      }),
    ).toBe(false)
  })

  it('deve exibir após N edições sem export', () => {
    expect(
      shouldShowBackupReminder({
        prefs: prefs({ editsSinceBackup: 5, lastBackupAt: '2026-07-28T00:00:00.000Z' }),
        dismissedThisSession: false,
        now: new Date('2026-07-29T00:00:00.000Z'),
        editThreshold: 5,
        daysThreshold: 7,
      }),
    ).toBe(true)
  })

  it('não deve exibir com edições abaixo do limiar e tempo recente', () => {
    expect(
      shouldShowBackupReminder({
        prefs: prefs({
          editsSinceBackup: 4,
          lastBackupAt: '2026-07-28T00:00:00.000Z',
        }),
        dismissedThisSession: false,
        now: new Date('2026-07-29T00:00:00.000Z'),
        editThreshold: 5,
        daysThreshold: 7,
      }),
    ).toBe(false)
  })

  it('deve exibir após M dias sem export (usa lastBackupAt)', () => {
    expect(
      shouldShowBackupReminder({
        prefs: prefs({
          editsSinceBackup: 0,
          lastBackupAt: '2026-07-01T00:00:00.000Z',
        }),
        dismissedThisSession: false,
        now: new Date('2026-07-08T00:00:00.000Z'),
        editThreshold: 5,
        daysThreshold: 7,
      }),
    ).toBe(true)
  })

  it('deve usar firstUseAt como baseline quando nunca exportou', () => {
    expect(
      shouldShowBackupReminder({
        prefs: prefs({
          editsSinceBackup: 0,
          lastBackupAt: null,
          firstUseAt: '2026-07-01T00:00:00.000Z',
        }),
        dismissedThisSession: false,
        now: new Date('2026-07-08T12:00:00.000Z'),
        editThreshold: 5,
        daysThreshold: 7,
      }),
    ).toBe(true)
  })

  it('não deve exibir no dia anterior ao limiar de dias', () => {
    expect(
      shouldShowBackupReminder({
        prefs: prefs({
          editsSinceBackup: 0,
          lastBackupAt: '2026-07-01T00:00:00.000Z',
        }),
        dismissedThisSession: false,
        now: new Date('2026-07-07T23:59:59.000Z'),
        editThreshold: 5,
        daysThreshold: 7,
      }),
    ).toBe(false)
  })
})
