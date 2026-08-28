import { IonButton, IonIcon } from '@ionic/react'
import { shieldCheckmarkOutline } from 'ionicons/icons'
import type { RefObject } from 'react'
import { formatBackupRelative } from '../../shared/format'
import { strings } from '../../shared/i18n'

export interface CofreMetaView {
  contentVersion: number
  modifiedAt: string
}

export interface AjustesBackupPanelProps {
  session: unknown | null
  meta: CofreMetaView | null
  lastBackupAt: string | null
  fileInputRef: RefObject<HTMLInputElement | null>
  onCreate: () => void
  onImportClick: () => void
  onExport: () => void
  onOpenTermo: () => void
  onImportChange: (files: FileList | null) => void
  formatModifiedAt: (iso: string) => string
}

export function AjustesBackupPanel({
  session,
  meta,
  lastBackupAt,
  fileInputRef,
  onCreate,
  onImportClick,
  onExport,
  onOpenTermo,
  onImportChange,
  formatModifiedAt,
}: AjustesBackupPanelProps) {
  const backupRelative = formatBackupRelative(lastBackupAt)
  const neverBackedUp = backupRelative.kind === 'never'

  return (
    <section data-testid="tab-panel-config" className="hvcf-ajustes">
      <header className="hvcf-ajustes__header">
        <h2 className="hvcf-ajustes__title">{strings.shell.configTitle}</h2>
        <p className="hvcf-ajustes__subtitle">{strings.shell.configSubtitle}</p>
      </header>

      <div className="hvcf-ajustes-card" data-testid="cofre-status-card">
        <div className="hvcf-ajustes-card__row">
          <span className="hvcf-ajustes-card__icon" aria-hidden="true">
            <IonIcon icon={shieldCheckmarkOutline} />
          </span>
          <div className="hvcf-ajustes-card__text">
            <h3 className="hvcf-ajustes-card__title">{strings.cofre.title}</h3>
            {session ? (
              <p className="hvcf-ajustes-card__status" data-testid="cofre-status-active">
                {strings.cofre.statusActive}
              </p>
            ) : (
              <p className="hvcf-ajustes-card__status" data-testid="cofre-empty">
                {strings.cofre.emptyState}
              </p>
            )}
          </div>
        </div>

        {session && meta && (
          <div className="hvcf-ajustes-card__meta" data-testid="cofre-meta">
            <p>
              {strings.cofre.contentVersion}:{' '}
              <strong data-testid="cofre-content-version">{meta.contentVersion}</strong>
            </p>
            <p>
              {strings.cofre.modifiedAt}:{' '}
              <span data-testid="cofre-modified-at">{formatModifiedAt(meta.modifiedAt)}</span>
            </p>
          </div>
        )}
      </div>

      <section className="hvcf-ajustes-section" aria-labelledby="ajustes-backup-heading">
        <h3 id="ajustes-backup-heading" className="hvcf-ajustes-section__title">
          {strings.cofre.backupSection}
        </h3>
        <p className="hvcf-ajustes-section__body">{strings.cofre.backupIntro}</p>
        {neverBackedUp ? (
          <p className="hvcf-ajustes-section__backup-status" data-testid="backup-never">
            {strings.cofre.backupNever}
          </p>
        ) : (
          <p className="hvcf-ajustes-section__backup-status" data-testid="backup-last">
            {strings.cofre.backupLastLabel}: {backupRelative.label}
          </p>
        )}
        <IonButton
          data-testid="cofre-export"
          className="hvcf-ajustes__cta-primary"
          disabled={!session}
          onClick={onExport}
        >
          {strings.cofre.export}
        </IonButton>
      </section>

      <section className="hvcf-ajustes-section" aria-labelledby="ajustes-manage-heading">
        <h3 id="ajustes-manage-heading" className="hvcf-ajustes-section__title">
          {strings.cofre.manageSection}
        </h3>
        <div className="hvcf-ajustes__actions">
          <IonButton
            data-testid="cofre-create"
            className="hvcf-ajustes__cta-secondary"
            fill={session ? 'outline' : 'solid'}
            onClick={onCreate}
          >
            {strings.cofre.create}
          </IonButton>
          <IonButton
            data-testid="cofre-import"
            className="hvcf-ajustes__cta-secondary"
            fill="outline"
            onClick={onImportClick}
          >
            {strings.cofre.import}
          </IonButton>
        </div>
      </section>

      <IonButton
        data-testid="termo-open"
        className="hvcf-ajustes__termo"
        fill="clear"
        onClick={onOpenTermo}
      >
        {strings.termo.open}
      </IonButton>

      <input
        ref={fileInputRef}
        data-testid="cofre-import-input"
        type="file"
        accept=".cofre,application/octet-stream"
        hidden
        onChange={(event) => {
          onImportChange(event.target.files)
        }}
      />
    </section>
  )
}
