import { useState, type ReactNode } from 'react'
import { IonAlert, IonButton, IonIcon, IonText } from '@ionic/react'
import {
  addOutline,
  carOutline,
  chevronForwardOutline,
  clipboardOutline,
  lockClosedOutline,
  speedometerOutline,
  timeOutline,
} from 'ionicons/icons'
import type { Veiculo } from '../../domain'
import { buildHomeStats, formatManutencoesCountLabel } from '../../shared/format'
import { strings } from '../../shared/i18n'
import { KebabMenu } from '../components/KebabMenu'
import { HomeStatsStrip } from './HomeStatsStrip'

export interface VeiculosListProps {
  veiculos: Veiculo[]
  lastBackupAt: string | null
  onAdd: () => void
  onEdit: (veiculo: Veiculo) => void
  onOpenHistorico: (veiculo: Veiculo) => void
  getManutencoesCount: (id: number) => number
  onConfirmDelete: (veiculo: Veiculo, cascadeConfirmed: boolean) => Promise<void>
  /** Banner de lembrete posicionado após as stats (visual do print). */
  backupBanner?: ReactNode
}

export function VeiculosList({
  veiculos,
  lastBackupAt,
  onAdd,
  onEdit,
  onOpenHistorico,
  getManutencoesCount,
  onConfirmDelete,
  backupBanner,
}: VeiculosListProps) {
  const [pendingDelete, setPendingDelete] = useState<Veiculo | null>(null)
  const [cascadeMode, setCascadeMode] = useState(false)

  const manutencoesTotal = veiculos.reduce(
    (sum, veiculo) => sum + getManutencoesCount(veiculo.id),
    0,
  )

  const stats = buildHomeStats({
    veiculosCount: veiculos.length,
    manutencoesTotal,
    lastBackupAt,
  })

  function openDelete(veiculo: Veiculo) {
    const count = getManutencoesCount(veiculo.id)
    setCascadeMode(count > 0)
    setPendingDelete(veiculo)
  }

  return (
    <section data-testid="veiculos-section">
      <header className="hvcf-home-header">
        <div className="hvcf-home-header__text">
          <p className="hvcf-home-header__eyebrow">{strings.appName}</p>
          <h1 className="hvcf-home-header__title" data-testid="home-veiculos-title">
            {strings.home.meusVeiculos}
          </h1>
        </div>
        {veiculos.length > 0 && (
          <IonButton
            data-testid="veiculo-add"
            className="hvcf-home-header__cta"
            size="small"
            onClick={onAdd}
          >
            <IonIcon slot="start" icon={addOutline} aria-hidden="true" />
            {strings.home.novoVeiculo}
          </IonButton>
        )}
      </header>

      <HomeStatsStrip
        veiculos={stats.veiculos}
        manutencoes={stats.manutencoes}
        backupLabel={stats.backupLabel}
      />

      {backupBanner}

      {veiculos.length === 0 ? (
        <div className="hvcf-empty" data-testid="veiculos-empty">
          <IonText>
            <h3>{strings.veiculos.emptyTitle}</h3>
            <p>{strings.veiculos.emptyBody}</p>
          </IonText>
          <IonButton data-testid="veiculo-empty-cta" expand="block" onClick={onAdd}>
            {strings.veiculos.emptyCta}
          </IonButton>
        </div>
      ) : (
        <ul className="hvcf-veiculo-list" data-testid="veiculos-list">
          {veiculos.map((veiculo) => {
            const count = getManutencoesCount(veiculo.id)
            return (
              <li
                key={veiculo.id}
                className="hvcf-veiculo-card"
                data-testid={`veiculo-item-${veiculo.id}`}
              >
                <div className="hvcf-veiculo-card__header">
                  <span className="hvcf-veiculo-card__chip" aria-hidden="true">
                    <IonIcon icon={carOutline} />
                  </span>
                  <div className="hvcf-veiculo-card__identity">
                    <div className="hvcf-veiculo-card__placa-row">
                      <h2
                        className="hvcf-veiculo-card__placa"
                        data-testid={`veiculo-placa-${veiculo.id}`}
                      >
                        {veiculo.placa}
                      </h2>
                      {veiculo.anoModelo !== null && (
                        <span
                          className="hvcf-veiculo-card__ano"
                          data-testid={`veiculo-ano-${veiculo.id}`}
                        >
                          {veiculo.anoModelo}
                        </span>
                      )}
                    </div>
                    <p
                      className="hvcf-veiculo-card__marca"
                      data-testid={`veiculo-marca-${veiculo.id}`}
                    >
                      {veiculo.marcaModelo}
                    </p>
                  </div>
                  <KebabMenu
                    className="hvcf-veiculo-card__menu"
                    triggerLabel={`${strings.veiculos.menuOpen}: ${veiculo.placa}`}
                    triggerTestId={`veiculo-menu-${veiculo.id}`}
                    actions={[
                      {
                        id: 'edit',
                        label: strings.veiculos.menuEdit,
                        testId: `veiculo-edit-${veiculo.id}`,
                        onSelect: () => onEdit(veiculo),
                      },
                      {
                        id: 'delete',
                        label: strings.veiculos.menuDelete,
                        role: 'destructive',
                        testId: `veiculo-delete-${veiculo.id}`,
                        onSelect: () => openDelete(veiculo),
                      },
                    ]}
                  />
                </div>

                <div className="hvcf-veiculo-card__meta">
                  <span className="hvcf-veiculo-card__meta-item">
                    <IonIcon icon={speedometerOutline} aria-hidden="true" />
                    <span>
                      {veiculo.kmAtual.toLocaleString('pt-BR')} {strings.veiculos.kmSuffix}
                    </span>
                  </span>
                  <span className="hvcf-veiculo-card__meta-item">
                    <IonIcon icon={clipboardOutline} aria-hidden="true" />
                    <span data-testid={`veiculo-manutencoes-count-${veiculo.id}`}>
                      {formatManutencoesCountLabel(count)}
                    </span>
                  </span>
                </div>

                {veiculo.proximaTroca ? (
                  <div
                    className="hvcf-veiculo-card__alert"
                    data-testid={`veiculo-proxima-troca-${veiculo.id}`}
                  >
                    <IonIcon icon={timeOutline} aria-hidden="true" />
                    <span className="hvcf-veiculo-card__alert-text">{veiculo.proximaTroca}</span>
                  </div>
                ) : null}

                <IonButton
                  data-testid={`veiculo-historico-${veiculo.id}`}
                  className="hvcf-veiculo-card__cta"
                  expand="block"
                  onClick={() => onOpenHistorico(veiculo)}
                >
                  {strings.veiculos.openHistorico}
                  <IonIcon slot="end" icon={chevronForwardOutline} aria-hidden="true" />
                </IonButton>
              </li>
            )
          })}
        </ul>
      )}

      <p className="hvcf-trust-footer" data-testid="home-trust-footer">
        <IonIcon icon={lockClosedOutline} aria-hidden="true" />
        <span>{strings.home.trustFooter}</span>
      </p>

      <IonAlert
        isOpen={pendingDelete !== null && !cascadeMode}
        header={strings.veiculos.deleteTitle}
        message={strings.veiculos.deleteMessage}
        buttons={[
          {
            text: strings.veiculos.deleteCancel,
            role: 'cancel',
            handler: () => setPendingDelete(null),
          },
          {
            text: strings.veiculos.deleteConfirm,
            role: 'destructive',
            handler: () => {
              const target = pendingDelete
              setPendingDelete(null)
              if (target) void onConfirmDelete(target, false)
            },
          },
        ]}
        onDidDismiss={() => {
          if (!cascadeMode) setPendingDelete(null)
        }}
      />

      <IonAlert
        isOpen={pendingDelete !== null && cascadeMode}
        header={strings.veiculos.deleteWithHistoryTitle}
        message={strings.veiculos.deleteWithHistoryMessage}
        buttons={[
          {
            text: strings.veiculos.deleteCancel,
            role: 'cancel',
            handler: () => setPendingDelete(null),
          },
          {
            text: strings.veiculos.deleteWithHistoryConfirm,
            role: 'destructive',
            handler: () => {
              const target = pendingDelete
              setPendingDelete(null)
              if (target) void onConfirmDelete(target, true)
            },
          },
        ]}
        onDidDismiss={() => {
          if (cascadeMode) setPendingDelete(null)
        }}
      />
    </section>
  )
}
