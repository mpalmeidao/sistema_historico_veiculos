import { useState } from 'react'
import { IonAlert, IonButton, IonItem, IonLabel, IonList, IonNote, IonText } from '@ionic/react'
import type { Manutencao, Veiculo } from '../../domain'
import { strings } from '../../shared/i18n'

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

function formatValor(valor: number | null): string | null {
  if (valor === null) return null
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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

  return (
    <section data-testid="manutencoes-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        {manutencoes.length > 0 && (
          <IonButton data-testid="manutencao-add" size="small" onClick={onAdd}>
            {strings.manutencoes.add}
          </IonButton>
        )}
      </div>

      <h2 style={{ marginTop: 0 }} data-testid="manutencoes-veiculo-titulo">
        {strings.manutencoes.title} — {veiculo.placa}
      </h2>
      <IonNote data-testid="manutencoes-order-hint">{strings.manutencoes.orderHint}</IonNote>

      {onGenerateRelatorio && (
        <div style={{ marginTop: '0.75rem' }}>
          <IonButton
            data-testid="relatorio-gerar"
            expand="block"
            fill="outline"
            disabled={relatorioWorking || manutencoes.length === 0}
            onClick={onGenerateRelatorio}
          >
            {relatorioWorking ? strings.relatorio.generating : strings.relatorio.generate}
          </IonButton>
          {manutencoes.length === 0 && (
            <IonText color="medium">
              <p data-testid="relatorio-empty-hint" style={{ marginTop: '0.5rem' }}>
                {strings.relatorio.emptyHistory}
              </p>
            </IonText>
          )}
          {relatorioMessage && (
            <IonText color="success">
              <p data-testid="relatorio-message" aria-live="polite">
                {relatorioMessage}
              </p>
            </IonText>
          )}
          {relatorioError && (
            <IonText color="danger">
              <p data-testid="relatorio-error" aria-live="assertive">
                {relatorioError}
              </p>
            </IonText>
          )}
        </div>
      )}

      {manutencoes.length === 0 ? (
        <div data-testid="manutencoes-empty" style={{ marginTop: '1rem' }}>
          <IonText>
            <h3>{strings.manutencoes.emptyTitle}</h3>
            <p>{strings.manutencoes.emptyBody}</p>
          </IonText>
          <IonButton data-testid="manutencao-empty-cta" expand="block" onClick={onAdd}>
            {strings.manutencoes.emptyCta}
          </IonButton>
        </div>
      ) : (
        <IonList data-testid="manutencoes-list" style={{ marginTop: '0.75rem' }}>
          {manutencoes.map((manutencao) => (
            <IonItem key={manutencao.id} data-testid={`manutencao-item-${manutencao.id}`}>
              <IonLabel>
                <h2 data-testid={`manutencao-data-${manutencao.id}`}>{manutencao.data}</h2>
                <p data-testid={`manutencao-tipo-${manutencao.id}`}>{manutencao.tipoServico}</p>
                <IonNote>
                  {manutencao.km.toLocaleString('pt-BR')} {strings.manutencoes.kmSuffix}
                  {formatValor(manutencao.valor) ? ` · ${formatValor(manutencao.valor)}` : ''}
                  {manutencao.oficina ? ` · ${manutencao.oficina}` : ''}
                </IonNote>
              </IonLabel>
              <div slot="end" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <IonButton
                  data-testid={`manutencao-edit-${manutencao.id}`}
                  size="small"
                  fill="outline"
                  onClick={() => onEdit(manutencao)}
                >
                  {strings.manutencoes.edit}
                </IonButton>
                <IonButton
                  data-testid={`manutencao-delete-${manutencao.id}`}
                  size="small"
                  color="danger"
                  fill="clear"
                  onClick={() => setPendingDelete(manutencao)}
                >
                  {strings.manutencoes.delete}
                </IonButton>
              </div>
            </IonItem>
          ))}
        </IonList>
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
