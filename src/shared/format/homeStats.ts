import { formatBackupRelative } from './backupRelative'
import { strings } from '../i18n'

export interface HomeStatsInput {
  veiculosCount: number
  manutencoesTotal: number
  lastBackupAt: string | null
  now?: Date
}

export interface HomeStats {
  veiculos: number
  manutencoes: number
  backupLabel: string
}

/** Monta os três valores da faixa de estatísticas da home. */
export function buildHomeStats(input: HomeStatsInput): HomeStats {
  return {
    veiculos: input.veiculosCount,
    manutencoes: input.manutencoesTotal,
    backupLabel: formatBackupRelative(input.lastBackupAt, input.now).label,
  }
}

/** Copy i18n da contagem de manutenções de um veículo. */
export function formatManutencoesCountLabel(count: number): string {
  if (count === 1) return strings.veiculos.manutencoesCountOne
  return strings.veiculos.manutencoesCountMany.replace('{{count}}', String(count))
}
