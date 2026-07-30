import { useCallback, useMemo, useState } from 'react'
import {
  appPrefsStore,
  shouldShowBackupReminder,
  type AppPrefs,
  type AppPrefsStore,
} from '../../shared/appPrefs'

export interface UseAppPrefsResult {
  prefs: AppPrefs
  termoAccepted: boolean
  showBackupReminder: boolean
  acceptTermo: () => void
  recordEdit: () => void
  recordBackupConfirmed: () => void
  dismissReminderForSession: () => void
}

export function useAppPrefs(store: AppPrefsStore = appPrefsStore): UseAppPrefsResult {
  const [prefs, setPrefs] = useState<AppPrefs>(() => store.read())
  const [dismissedThisSession, setDismissedThisSession] = useState(false)

  const acceptTermo = useCallback(() => {
    setPrefs(store.acceptTermo())
  }, [store])

  const recordEdit = useCallback(() => {
    setPrefs(store.recordEdit())
  }, [store])

  const recordBackupConfirmed = useCallback(() => {
    setPrefs(store.recordBackupConfirmed())
    setDismissedThisSession(false)
  }, [store])

  const dismissReminderForSession = useCallback(() => {
    setDismissedThisSession(true)
  }, [])

  const showBackupReminder = useMemo(
    () =>
      shouldShowBackupReminder({
        prefs,
        dismissedThisSession,
      }),
    [prefs, dismissedThisSession],
  )

  return {
    prefs,
    termoAccepted: prefs.termoAccepted,
    showBackupReminder,
    acceptTermo,
    recordEdit,
    recordBackupConfirmed,
    dismissReminderForSession,
  }
}
