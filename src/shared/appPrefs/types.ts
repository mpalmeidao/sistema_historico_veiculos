export interface AppPrefs {
  /** Termo de isenção aceito (pré-requisito para criar/usar cofre no primeiro uso). */
  termoAccepted: boolean
  /** ISO quando o termo foi aceito; null se ainda não aceito. */
  termoAcceptedAt: string | null
  /** ISO do primeiro uso após aceite (baseline se nunca houve backup). */
  firstUseAt: string | null
  /** ISO do último export confirmado; null = nunca exportou nesta instalação. */
  lastBackupAt: string | null
  /** Contagem de edições (mutações) desde o último export confirmado. */
  editsSinceBackup: number
}

export interface PrefsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const DEFAULT_APP_PREFS: AppPrefs = {
  termoAccepted: false,
  termoAcceptedAt: null,
  firstUseAt: null,
  lastBackupAt: null,
  editsSinceBackup: 0,
}
