import { useState } from 'react'
import { IonAlert, IonButton, IonIcon, IonText } from '@ionic/react'
import {
  addOutline,
  carOutline,
  documentTextOutline,
  speedometerOutline,
  timeOutline,
} from 'ionicons/icons'
import type { Manutencao, Veiculo } from '../../domain'
import { formatBrl, formatDisplayDate, formatTotalGastoDisplay } from '../../shared/format'
import { strings } from '../../shared/i18n'
import { KebabMenu } from '../components/KebabMenu'

export interface ManutencoesListProps {
  veiculo: Veiculo
  manutencoes: Manutencao[]
  onAdd: () => void
  onEdit: (manutencao: Manutencao) => void
  onConfirmDelete: (manutencao: Manutencao) => Promise<void>
  onGenerateRelatorio?: () => void
  relatorioWorking?: boolean
  relatorioMessage?: string | null
  relatorioError?: string | null
}

function formatMeta(manutencao: Manutencao): string {
  const kmPart = `${manutencao.km.toLocaleString('pt-BR')} ${strings.manutencoes.kmSuffix}`
  if (manutencao.oficina) {
    return `${kmPart} · ${manutencao.oficina}`
  }
  return kmPart
}

export function ManutencoesList({
  veiculo,
  manutencoes,
  onAdd,
  onEdit,
  onConfirmDelete,
  onGenerateRelatorio,
  relatorioWorking = false,
  relatorioMessage = null,
  relatorioError = null,
}: ManutencoesListProps) {
  const [pendingDelete, setPendingDelete] = useState<Manutencao | null>(null)
  const totalGastoLabel = formatTotalGastoDisplay(
    manutencoes.map((item) => item.valor),
    strings.manutencoes.totalGastoAusente,
  )
  const proximaTroca =
    veiculo.proximaTroca && veiculo.proximaTroca.trim() !== '' ? veiculo.proximaTroca : null
  const pdfDisabled = relatorioWorking || manutencoes.length === 0

  return (
    <section className="hvcf-historico" data-testid="manutencoes-section">
      <header className="hvcf-historico-veiculo" data-testid="manutencoes-veiculo-contexto">
        <span className="hvcf-historico-veiculo__chip" aria-hidden="true">
          <IonIcon icon={carOutline} />
        </span>
        <div className="hvcf-historico-veiculo__identity">
          <h2 className="hvcf-historico-veiculo__placa" data-testid="manutencoes-veiculo-titulo">
            {veiculo.placa}
          </h2>
          <p className="hvcf-historico-veiculo__marca" data-testid="manutencoes-veiculo-marca">
            {veiculo.marcaModelo}
          </p>
        </div>
      </header>

      <div
        className="hvcf-historico-stats"
        data-testid="manutencoes-stats"
        role="group"
        aria-label={strings.manutencoes.statsGroupLabel}
      >
        <div className="hvcf-historico-stats__item" data-testid="manutencoes-stat-km">
          <span className="hvcf-historico-stats__label">{strings.manutencoes.statsKmAtual}</span>
          <span className="hvcf-historico-stats__value">
            {veiculo.kmAtual.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="hvcf-historico-stats__item" data-testid="manutencoes-stat-count">
          <span className="hvcf-historico-stats__label">
            {strings.manutencoes.statsManutencoes}
          </span>
          <span className="hvcf-historico-stats__value">{manutencoes.length}</span>
        </div>
        <div className="hvcf-historico-stats__item" data-testid="manutencoes-stat-total">
          <span className="hvcf-historico-stats__label">{strings.manutencoes.statsTotalGasto}</span>
          <span className="hvcf-historico-stats__value">{totalGastoLabel}</span>
        </div>
      </div>

      {proximaTroca ? (
        <div className="hvcf-proxima-troca-card" data-testid="manutencoes-proxima-troca">
          <span className="hvcf-proxima-troca-card__icon" aria-hidden="true">
            <IonIcon icon={timeOutline} />
          </span>
          <div className="hvcf-proxima-troca-card__text">
            <p className="hvcf-proxima-troca-card__title">
              {strings.manutencoes.proximaTrocaTitle}
            </p>
            <p className="hvcf-proxima-troca-card__body">{proximaTroca}</p>
          </div>
        </div>
      ) : null}

      <div className="hvcf-historico-section-header">
        <h3
          className="hvcf-historico-section-header__label"
          data-testid="manutencoes-historico-label"
        >
          {strings.manutencoes.historicoSection}
        </h3>
        {onGenerateRelatorio ? (
          <IonButton
            data-testid="relatorio-gerar"
            className="hvcf-historico-section-header__pdf"
            fill="clear"
            size="small"
            disabled={pdfDisabled}
            aria-disabled={pdfDisabled}
            onClick={onGenerateRelatorio}
          >
            <IonIcon slot="start" icon={documentTextOutline} aria-hidden="true" />
            {relatorioWorking ? strings.relatorio.generating : strings.relatorio.generate}
          </IonButton>
        ) : null}
      </div>

      {onGenerateRelatorio && manutencoes.length === 0 ? (
        <IonText color="medium">
          <p data-testid="relatorio-empty-hint" className="hvcf-historico-pdf-hint">
            {strings.relatorio.emptyHistory}
          </p>
        </IonText>
      ) : null}
      {relatorioMessage ? (
        <IonText color="success">
          <p data-testid="relatorio-message" aria-live="polite">
            {relatorioMessage}
          </p>
        </IonText>
      ) : null}
      {relatorioError ? (
        <IonText color="danger">
          <p data-testid="relatorio-error" aria-live="assertive">
            {relatorioError}
          </p>
        </IonText>
      ) : null}

      {manutencoes.length === 0 ? (
        <div className="hvcf-empty" data-testid="manutencoes-empty">
          <IonText>
            <h3>{strings.manutencoes.emptyTitle}</h3>
            <p>{strings.manutencoes.emptyBody}</p>
          </IonText>
          <IonButton
            data-testid="manutencao-empty-cta"
            className="hvcf-historico-cta"
            expand="block"
            onClick={onAdd}
          >
            <IonIcon slot="start" icon={addOutline} aria-hidden="true" />
            {strings.manutencoes.emptyCta}
          </IonButton>
        </div>
      ) : (
        <>
          <ol className="hvcf-timeline" data-testid="manutencoes-list">
            {manutencoes.map((manutencao, index) => {
              const isNewest = index === 0
              const valorLabel = manutencao.valor !== null ? formatBrl(manutencao.valor) : null
              return (
                <li
                  key={manutencao.id}
                  className={`hvcf-timeline__item${isNewest ? ' hvcf-timeline__item--newest' : ''}`}
                  data-testid={`manutencao-item-${manutencao.id}`}
                >
                  <span
                    className={`hvcf-timeline__marker${isNewest ? ' hvcf-timeline__marker--filled' : ''}`}
                    aria-hidden="true"
                  />
                  <div className="hvcf-timeline__content">
                    <div className="hvcf-timeline__date-row">
                      <time
                        className="hvcf-timeline__date"
                        dateTime={manutencao.data}
                        data-testid={`manutencao-data-${manutencao.id}`}
                      >
                        {formatDisplayDate(manutencao.data)}
                      </time>
                      {isNewest ? (
                        <span
                          className="hvcf-timeline__badge"
                          data-testid={`manutencao-badge-recente-${manutencao.id}`}
                        >
                          {strings.manutencoes.maisRecente}
                        </span>
                      ) : null}
                    </div>
                    <div className="hvcf-timeline__main">
                      <div className="hvcf-timeline__main-text">
                        <p
                          className="hvcf-timeline__title"
                          data-testid={`manutencao-tipo-${manutencao.id}`}
                        >
                          {manutencao.tipoServico}
                        </p>
                        <p className="hvcf-timeline__meta">
                          <IonIcon icon={speedometerOutline} aria-hidden="true" />
                          <span data-testid={`manutencao-meta-${manutencao.id}`}>
                            {formatMeta(manutencao)}
                          </span>
                        </p>
                      </div>
                      <div className="hvcf-timeline__aside">
                        {valorLabel ? (
                          <span
                            className="hvcf-timeline__valor"
                            data-testid={`manutencao-valor-${manutencao.id}`}
                          >
                            {valorLabel}
                          </span>
                        ) : null}
                        <KebabMenu
                          className="hvcf-timeline__menu"
                          triggerLabel={`${strings.manutencoes.menuOpen}: ${manutencao.tipoServico}`}
                          triggerTestId={`manutencao-menu-${manutencao.id}`}
                          actions={[
                            {
                              id: 'edit',
                              label: strings.manutencoes.menuEdit,
                              testId: `manutencao-edit-${manutencao.id}`,
                              onSelect: () => onEdit(manutencao),
                            },
                            {
                              id: 'delete',
                              label: strings.manutencoes.menuDelete,
                              role: 'destructive',
                              testId: `manutencao-delete-${manutencao.id}`,
                              onSelect: () => setPendingDelete(manutencao),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
            <li className="hvcf-timeline__start" data-testid="manutencoes-timeline-start">
              <span
                className="hvcf-timeline__marker hvcf-timeline__marker--start"
                aria-hidden="true"
              />
              <span className="hvcf-timeline__start-label">
                {strings.manutencoes.inicioHistorico}
              </span>
            </li>
          </ol>

          <IonButton
            data-testid="manutencao-add"
            className="hvcf-historico-cta"
            expand="block"
            onClick={onAdd}
          >
            <IonIcon slot="start" icon={addOutline} aria-hidden="true" />
            {strings.manutencoes.add}
          </IonButton>
        </>
      )}

      <IonAlert
        isOpen={pendingDelete !== null}
        header={strings.manutencoes.deleteTitle}
        message={strings.manutencoes.deleteMessage}
        buttons={[
          {
            text: strings.manutencoes.deleteCancel,
            role: 'cancel',
            handler: () => setPendingDelete(null),
          },
          {
            text: strings.manutencoes.deleteConfirm,
            role: 'destructive',
            handler: () => {
              const target = pendingDelete
              setPendingDelete(null)
              if (target) void onConfirmDelete(target)
            },
          },
        ]}
        onDidDismiss={() => setPendingDelete(null)}
      />
    </section>
  )
}
