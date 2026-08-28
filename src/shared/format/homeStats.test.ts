import { describe, expect, it } from 'vitest'
import { buildHomeStats, formatManutencoesCountLabel } from './homeStats'
import { strings } from '../i18n'

describe('buildHomeStats', () => {
  it('deve agregar 0 veículos e 0 manutenções com backup nunca', () => {
    expect(
      buildHomeStats({
        veiculosCount: 0,
        manutencoesTotal: 0,
        lastBackupAt: null,
      }),
    ).toEqual({
      veiculos: 0,
      manutencoes: 0,
      backupLabel: strings.home.backupNever,
    })
  })

  it('deve agregar N veículos e soma de manutenções', () => {
    const now = new Date(2026, 7, 28, 12, 0, 0)
    const threeDaysAgo = new Date(2026, 7, 25, 10, 0, 0).toISOString()
    expect(
      buildHomeStats({
        veiculosCount: 2,
        manutencoesTotal: 20,
        lastBackupAt: threeDaysAgo,
        now,
      }),
    ).toEqual({
      veiculos: 2,
      manutencoes: 20,
      backupLabel: strings.home.backupDaysAgo.replace('{{n}}', '3'),
    })
  })
})

describe('formatManutencoesCountLabel', () => {
  it('deve usar singular para 1', () => {
    expect(formatManutencoesCountLabel(1)).toBe(strings.veiculos.manutencoesCountOne)
  })

  it('deve usar plural para 0 e N', () => {
    expect(formatManutencoesCountLabel(0)).toBe(
      strings.veiculos.manutencoesCountMany.replace('{{count}}', '0'),
    )
    expect(formatManutencoesCountLabel(8)).toBe(
      strings.veiculos.manutencoesCountMany.replace('{{count}}', '8'),
    )
  })
})
