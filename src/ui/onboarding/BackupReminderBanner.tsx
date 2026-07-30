import { IonButton, IonText } from '@ionic/react'
import { strings } from '../../shared/i18n'

export interface BackupReminderBannerProps {
  onExport: () => void
  onDismiss: () => void
}

export function BackupReminderBanner({ onExport, onDismiss }: BackupReminderBannerProps) {
  return (
    <aside
      data-testid="backup-reminder"
      role="status"
      style={{
        marginBottom: '1rem',
        padding: '0.75rem 1rem',
        border: '1px solid var(--ion-color-warning)',
        borderRadius: '8px',
        background: 'rgba(var(--ion-color-warning-rgb), 0.12)',
      }}
    >
      <IonText>
        <h3 style={{ marginTop: 0 }}>{strings.backupReminder.title}</h3>
        <p>{strings.backupReminder.body}</p>
      </IonText>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <IonButton data-testid="backup-reminder-export" size="small" onClick={onExport}>
          {strings.backupReminder.export}
        </IonButton>
        <IonButton
          data-testid="backup-reminder-dismiss"
          size="small"
          fill="clear"
          onClick={onDismiss}
        >
          {strings.backupReminder.dismiss}
        </IonButton>
      </div>
    </aside>
  )
}
