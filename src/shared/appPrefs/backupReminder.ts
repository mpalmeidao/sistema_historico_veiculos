import { BACKUP_REMINDER_DAYS_THRESHOLD, BACKUP_REMINDER_EDIT_THRESHOLD } from './constants'
import type { AppPrefs } from './types'

export interface BackupReminderInput {
  prefs: AppPrefs
  /** Lembrete já dispensado nesta sessão de página (não persiste). */
  dismissedThisSession: boolean
  /** Instante atual (injetável nos testes). */
  now?: Date
  editThreshold?: number
  daysThreshold?: number
}

/**
 * Regra pura: lembrete não bloqueante após N edições ou M dias sem export confirmado.
 * Dispensar na sessão impede novo disparo até reload (evita spam).
 */
export function shouldShowBackupReminder(input: BackupReminderInput): boolean {
  const {
    prefs,
    dismissedThisSession,
    now = new Date(),
    editThreshold = BACKUP_REMINDER_EDIT_THRESHOLD,
    daysThreshold = BACKUP_REMINDER_DAYS_THRESHOLD,
  } = input

  if (!prefs.termoAccepted) return false
  if (dismissedThisSession) return false

  if (prefs.editsSinceBackup >= editThreshold) return true

  const baselineIso = prefs.lastBackupAt ?? prefs.firstUseAt ?? prefs.termoAcceptedAt
  if (!baselineIso) return false

  const baselineMs = Date.parse(baselineIso)
  if (Number.isNaN(baselineMs)) return false

  const elapsedMs = now.getTime() - baselineMs
  const days = elapsedMs / (24 * 60 * 60 * 1000)
  return days >= daysThreshold
}
