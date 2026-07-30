/**
 * Preferências do app (fora do SQLite do cofre).
 * localStorage — limpar o site apaga prefs e OPFS juntos (coerente com a isenção).
 */

export const APP_PREFS_STORAGE_KEY = 'hvcf.appPrefs.v1'

/**
 * N: edições (mutações de conteúdo) sem export confirmado para sugerir backup.
 * Valor conservador e testável — documentado em CONTEXT.md.
 */
export const BACKUP_REMINDER_EDIT_THRESHOLD = 5

/**
 * M: dias sem export confirmado para sugerir backup.
 * Conta a partir de lastBackupAt; se nunca exportou, a partir de firstUseAt.
 */
export const BACKUP_REMINDER_DAYS_THRESHOLD = 7
