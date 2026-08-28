import { describe, expect, it } from 'vitest'
import { formatBackupRelative } from './backupRelative'
import { strings } from '../i18n'

describe('formatBackupRelative', () => {
  const now = new Date(2026, 7, 28, 15, 0, 0) // 28 ago 2026 local

  it('nunca deve retornar copy de nunca quando lastBackupAt é null', () => {
    expect(formatBackupRelative(null, now)).toEqual({
      kind: 'never',
      label: strings.home.backupNever,
    })
  })

  it('nunca deve retornar copy de nunca quando lastBackupAt é inválido', () => {
    expect(formatBackupRelative('não-é-data', now).kind).toBe('never')
  })

  it('hoje deve retornar copy de hoje no mesmo dia civil', () => {
    const sameDay = new Date(2026, 7, 28, 8, 0, 0).toISOString()
    expect(formatBackupRelative(sameDay, now)).toEqual({
      kind: 'today',
      label: strings.home.backupToday,
    })
  })

  it('há N dias deve retornar 1 dia no singular', () => {
    const yesterday = new Date(2026, 7, 27, 12, 0, 0).toISOString()
    expect(formatBackupRelative(yesterday, now)).toEqual({
      kind: 'days',
      days: 1,
      label: strings.home.backupDaysAgoOne,
    })
  })

  it('há N dias deve retornar plural para vários dias', () => {
    const threeDaysAgo = new Date(2026, 7, 25, 12, 0, 0).toISOString()
    expect(formatBackupRelative(threeDaysAgo, now)).toEqual({
      kind: 'days',
      days: 3,
      label: strings.home.backupDaysAgo.replace('{{n}}', '3'),
    })
  })
})
