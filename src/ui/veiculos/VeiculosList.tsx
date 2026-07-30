import { useState } from 'react'
import { IonAlert, IonButton, IonItem, IonLabel, IonList, IonNote, IonText } from '@ionic/react'
import type { Veiculo } from '../../domain'
import { strings } from '../../shared/i18n'

export interface VeiculosListProps {
  veiculos: Veiculo[]
  onAdd: () => void
  onEdit: (veiculo: Veiculo) => void
  onOpenHistorico: (veiculo: Veiculo) => void
  getManutencoesCount: (id: number) => number
  onConfirmDelete: (veiculo: Veiculo, cascadeConfirmed: boolean) => Promise<void>
}

export function VeiculosList({
  veiculos,
  onAdd,
  onEdit,
  onOpenHistorico,
  getManutencoesCount,
  onConfirmDelete,
}: VeiculosListProps) {
  const [pendingDelete, setPendingDelete] = useState<Veiculo | null>(null)
  const [cascadeMode, setCascadeMode] = useState(false)

  function openDelete(veiculo: Veiculo) {
    const count = getManutencoesCount(veiculo.id)
    setCascadeMode(count > 0)
    setPendingDelete(veiculo)
  }

  return (
    <section data-testid="veiculos-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <h2 style={{ margin: 0 }}>{strings.veiculos.title}</h2>
        {veiculos.length > 0 && (
          <IonButton data-testid="veiculo-add" size="small" onClick={onAdd}>
            {strings.veiculos.add}
          </IonButton>
        )}
      </div>

      {veiculos.length === 0 ? (
        <div data-testid="veiculos-empty">
          <IonText>
            <h3>{strings.veiculos.emptyTitle}</h3>
            <p>{strings.veiculos.emptyBody}</p>
          </IonText>
          <IonButton data-testid="veiculo-empty-cta" expand="block" onClick={onAdd}>
            {strings.veiculos.emptyCta}
          </IonButton>
        </div>
      ) : (
        <IonList data-testid="veiculos-list">
          {veiculos.map((veiculo) => (
            <IonItem key={veiculo.id} data-testid={`veiculo-item-${veiculo.id}`}>
              <IonLabel>
                <h2 data-testid={`veiculo-placa-${veiculo.id}`}>{veiculo.placa}</h2>
                <p data-testid={`veiculo-marca-${veiculo.id}`}>{veiculo.marcaModelo}</p>
                <IonNote>
                  {veiculo.kmAtual.toLocaleString('pt-BR')} {strings.veiculos.kmSuffix}
                  {veiculo.anoModelo !== null ? ` · ${veiculo.anoModelo}` : ''}
                  {veiculo.proximaTroca ? ` · ${veiculo.proximaTroca}` : ''}
                </IonNote>
              </IonLabel>
              <div slot="end" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <IonButton
                  data-testid={`veiculo-historico-${veiculo.id}`}
                  size="small"
                  onClick={() => onOpenHistorico(veiculo)}
                >
                  {strings.veiculos.openHistorico}
                </IonButton>
                <IonButton
                  data-testid={`veiculo-edit-${veiculo.id}`}
                  size="small"
                  fill="outline"
                  onClick={() => onEdit(veiculo)}
                >
                  {strings.veiculos.edit}
                </IonButton>
                <IonButton
                  data-testid={`veiculo-delete-${veiculo.id}`}
                  size="small"
                  color="danger"
                  fill="clear"
                  onClick={() => openDelete(veiculo)}
                >
                  {strings.veiculos.delete}
                </IonButton>
              </div>
            </IonItem>
          ))}
        </IonList>
      )}

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
