import { strings } from '../i18n'

export type BackupRelativeKind = 'never' | 'today' | 'days'

export interface BackupRelativeResult {
  kind: BackupRelativeKind
  /** Dias decorridos desde o backup (apenas quando kind === 'days'). */
  days?: number
  label: string
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Formata o tempo relativo desde o último export confirmado (`lastBackupAt`).
 * Função pura — sem React.
 */
export function formatBackupRelative(
  lastBackupAt: string | null,
  now: Date = new Date(),
): BackupRelativeResult {
  if (lastBackupAt === null || lastBackupAt === '') {
    return { kind: 'never', label: strings.home.backupNever }
  }

  const last = new Date(lastBackupAt)
  if (Number.isNaN(last.getTime())) {
    return { kind: 'never', label: strings.home.backupNever }
  }

  const diffDays = Math.round(
    (startOfLocalDay(now).getTime() - startOfLocalDay(last).getTime()) / 86_400_000,
  )

  if (diffDays <= 0) {
    return { kind: 'today', label: strings.home.backupToday }
  }

  if (diffDays === 1) {
    return { kind: 'days', days: 1, label: strings.home.backupDaysAgoOne }
  }

  return {
    kind: 'days',
    days: diffDays,
    label: strings.home.backupDaysAgo.replace('{{n}}', String(diffDays)),
  }
}
