import { IonButton, IonIcon, IonText } from '@ionic/react'
import { shieldOutline } from 'ionicons/icons'
import { strings } from '../../shared/i18n'

export interface BackupReminderBannerProps {
  onExport: () => void
  onDismiss: () => void
}

export function BackupReminderBanner({ onExport, onDismiss }: BackupReminderBannerProps) {
  return (
    <aside data-testid="backup-reminder" role="status" className="hvcf-backup-banner">
      <div className="hvcf-backup-banner__row">
        <span className="hvcf-backup-banner__icon" aria-hidden="true">
          <IonIcon icon={shieldOutline} />
        </span>
        <div>
          <IonText>
            <h3 className="hvcf-backup-banner__title">{strings.backupReminder.title}</h3>
            <p className="hvcf-backup-banner__body">{strings.backupReminder.body}</p>
          </IonText>
        </div>
      </div>
      <div className="hvcf-backup-banner__actions">
        <IonButton
          data-testid="backup-reminder-export"
          className="hvcf-backup-banner__export"
          size="small"
          onClick={onExport}
        >
          {strings.backupReminder.export}
        </IonButton>
        <IonButton
          data-testid="backup-reminder-dismiss"
          className="hvcf-backup-banner__dismiss"
          size="small"
          fill="clear"
          color="medium"
          onClick={onDismiss}
        >
          {strings.backupReminder.dismiss}
        </IonButton>
      </div>
    </aside>
  )
}
