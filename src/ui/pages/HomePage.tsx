import { useCallback, useEffect, useRef, useState } from 'react'
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { chevronBack } from 'ionicons/icons'
import { strings } from '../../shared/i18n'
import { isMinimumBrowserSupported } from '../../shared/browser/isMinimumBrowserSupported'
import type { Manutencao, Veiculo } from '../../domain'
import { useAnexos } from '../hooks/useAnexos'
import { useAppPrefs } from '../hooks/useAppPrefs'
import { useCofre } from '../hooks/useCofre'
import { useManutencoes } from '../hooks/useManutencoes'
import { useRelatorio } from '../hooks/useRelatorio'
import { useVeiculos } from '../hooks/useVeiculos'
import { ManutencaoForm } from '../manutencoes/ManutencaoForm'
import { ManutencoesList } from '../manutencoes/ManutencoesList'
import { BackupReminderBanner, OnboardingFlow, TermoGate, TermoModal } from '../onboarding'
import { AppShellFooter, BrowserUnsupportedGate, type AppTabId } from '../shell'
import { VeiculoForm } from '../veiculos/VeiculoForm'
import { VeiculosList } from '../veiculos/VeiculosList'

function formatModifiedAt(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR')
}

type View =
  | { kind: 'main' }
  | { kind: 'veiculo-form'; veiculoId: number | null }
  | { kind: 'manutencoes'; veiculoId: number }
  | { kind: 'manutencao-form'; veiculoId: number; manutencaoId: number | null }

function tabTitle(tab: AppTabId): string {
  switch (tab) {
    case 'veiculos':
      return strings.veiculos.title
    case 'manutencoes':
      return strings.manutencoes.title
    case 'config':
      return strings.shell.configTitle
  }
}

function headerTitle(tab: AppTabId, view: View, opts: { showHomeTitle: boolean }): string {
  if (opts.showHomeTitle) {
    return strings.home.title
  }
  switch (view.kind) {
    case 'veiculo-form':
      return view.veiculoId === null ? strings.veiculos.createTitle : strings.veiculos.editTitle
    case 'manutencoes':
      return strings.manutencoes.title
    case 'manutencao-form':
      return view.manutencaoId === null
        ? strings.manutencoes.createTitle
        : strings.manutencoes.editTitle
    default:
      return tabTitle(tab)
  }
}

export function HomePage() {
  const browserSupported = isMinimumBrowserSupported()

  const {
    status,
    session,
    meta,
    message,
    errorMessage,
    createCofre,
    importFile,
    exportCofre,
    refreshMeta,
  } = useCofre()

  const {
    termoAccepted,
    showBackupReminder,
    acceptTermo,
    recordEdit,
    recordBackupConfirmed,
    dismissReminderForSession,
  } = useAppPrefs()

  const onContentMutated = useCallback(() => {
    refreshMeta()
    recordEdit()
  }, [refreshMeta, recordEdit])

  const {
    veiculos,
    message: veiculosMessage,
    errorMessage: veiculosError,
    saveVeiculo,
    removeVeiculo,
    getManutencoesCount,
  } = useVeiculos(session, onContentMutated)

  const [tab, setTab] = useState<AppTabId>('veiculos')
  const [view, setView] = useState<View>({ kind: 'main' })
  const [termoModalOpen, setTermoModalOpen] = useState(false)
  const manutencoesVeiculoId =
    view.kind === 'manutencoes' || view.kind === 'manutencao-form' ? view.veiculoId : null

  const {
    manutencoes,
    message: manutencoesMessage,
    errorMessage: manutencoesError,
    saveManutencao,
    removeManutencao,
  } = useManutencoes(session, manutencoesVeiculoId, onContentMutated)

  const {
    status: relatorioStatus,
    message: relatorioMessage,
    errorMessage: relatorioError,
    gerar: gerarRelatorio,
  } = useRelatorio(session)

  const anexosManutencaoId = view.kind === 'manutencao-form' ? view.manutencaoId : null
  const {
    anexos,
    processing: anexosProcessing,
    errorMessage: anexosError,
    message: anexosMessage,
    attachFile,
    confirmPreparedAnexo,
    loadAnexoBytes,
    removeAnexo,
    flushPending,
    clearPending,
  } = useAnexos(session, anexosManutencaoId, onContentMutated)

  useEffect(() => {
    if (view.kind === 'manutencao-form' && view.manutencaoId !== null) {
      void flushPending(view.manutencaoId)
    }
  }, [view, flushPending])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingFileRef = useRef<File | null>(null)
  const [replaceAlertOpen, setReplaceAlertOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleCreateCofre() {
    if (!termoAccepted) return
    setView({ kind: 'main' })
    await createCofre()
  }

  async function handleImportChange(fileList: FileList | null) {
    if (!termoAccepted) return
    const file = fileList?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ''

    const result = await importFile(file, false)
    if (result === 'needs-confirm') {
      pendingFileRef.current = file
      setReplaceAlertOpen(true)
    }
  }

  async function confirmReplace() {
    const file = pendingFileRef.current
    pendingFileRef.current = null
    setReplaceAlertOpen(false)
    if (!file || !termoAccepted) return
    await importFile(file, true)
  }

  async function handleExport() {
    if (!session) return
    const ok = await exportCofre()
    if (ok) recordBackupConfirmed()
  }

  function handleTabChange(next: AppTabId) {
    setTab(next)
    if (next === 'veiculos' && view.kind === 'manutencao-form') {
      clearPending()
      setView({ kind: 'main' })
    }
    if (next === 'config') {
      if (view.kind === 'manutencao-form') clearPending()
      setView({ kind: 'main' })
    }
  }

  function handleAcceptTermo() {
    acceptTermo()
    if (!session) {
      setTab('config')
    }
  }

  function handleHeaderBack() {
    if (view.kind === 'manutencao-form') {
      clearPending()
      setView({ kind: 'manutencoes', veiculoId: view.veiculoId })
      return
    }
    if (view.kind === 'manutencoes') {
      setView({ kind: 'main' })
      setTab('veiculos')
      return
    }
    if (view.kind === 'veiculo-form') {
      setView({ kind: 'main' })
    }
  }

  const showHeaderBack = view.kind !== 'main'

  const editingVeiculo: Veiculo | null =
    view.kind === 'veiculo-form' && view.veiculoId !== null
      ? (veiculos.find((item) => item.id === view.veiculoId) ?? null)
      : null

  const detalheVeiculo: Veiculo | null =
    view.kind === 'manutencoes' || view.kind === 'manutencao-form'
      ? (veiculos.find((item) => item.id === view.veiculoId) ?? null)
      : null

  const editingManutencao: Manutencao | null =
    view.kind === 'manutencao-form' && view.manutencaoId !== null
      ? (manutencoes.find((item) => item.id === view.manutencaoId) ?? null)
      : null

  const feedbackMessage =
    relatorioMessage ?? anexosMessage ?? manutencoesMessage ?? veiculosMessage ?? message
  const feedbackError =
    status === 'ready'
      ? (relatorioError ?? anexosError ?? manutencoesError ?? veiculosError ?? errorMessage)
      : errorMessage

  const showFullOnboarding =
    (status === 'ready' || status === 'error') && !termoAccepted && !session
  const showTermoGate = (status === 'ready' || status === 'error') && !termoAccepted && !!session
  const showCofreUi = (status === 'ready' || status === 'error') && termoAccepted

  const isCadastroFlow =
    view.kind === 'veiculo-form' || view.kind === 'manutencao-form' || showFullOnboarding

  const showAds = showCofreUi && !isCadastroFlow && !showTermoGate
  const showTabs = showCofreUi && !showFullOnboarding && !showTermoGate
  const showHomeTitle = status === 'loading' || showFullOnboarding || showTermoGate

  if (!browserSupported || status === 'opfs-unavailable') {
    return <BrowserUnsupportedGate />
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {showHeaderBack && (
            <IonButtons slot="start">
              <IonButton
                data-testid="header-back"
                aria-label={strings.shell.back}
                onClick={handleHeaderBack}
              >
                <IonIcon slot="icon-only" icon={chevronBack} />
              </IonButton>
            </IonButtons>
          )}
          <IonTitle>{headerTitle(tab, view, { showHomeTitle })}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {status === 'loading' && <p>{strings.cofre.openWorking}</p>}

        {status === 'error' && errorMessage && (
          <IonText color="danger">
            <p>{errorMessage}</p>
          </IonText>
        )}

        {showFullOnboarding && <OnboardingFlow onAccept={handleAcceptTermo} />}

        {showTermoGate && <TermoGate onAccept={handleAcceptTermo} />}

        {showCofreUi && showBackupReminder && session && !isCadastroFlow && (
          <BackupReminderBanner
            onExport={() => {
              void handleExport()
            }}
            onDismiss={dismissReminderForSession}
          />
        )}

        {showCofreUi && feedbackMessage && (
          <IonText color="success">
            <p data-testid="cofre-message">{feedbackMessage}</p>
          </IonText>
        )}

        {showCofreUi && feedbackError && status === 'ready' && (
          <IonText color="danger">
            <p data-testid="cofre-error">{feedbackError}</p>
          </IonText>
        )}

        {showCofreUi && tab === 'config' && (
          <section data-testid="tab-panel-config">
            <h2>{strings.shell.configTitle}</h2>
            <p>{strings.shell.configSubtitle}</p>
            <p>{strings.cofre.subtitle}</p>

            {!session && <p>{strings.cofre.emptyState}</p>}

            {session && meta && (
              <div data-testid="cofre-meta">
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <IonButton
                data-testid="cofre-create"
                onClick={() => {
                  void handleCreateCofre()
                }}
              >
                {strings.cofre.create}
              </IonButton>

              <IonButton
                data-testid="cofre-import"
                fill="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                {strings.cofre.import}
              </IonButton>

              <IonButton
                data-testid="cofre-export"
                fill="outline"
                disabled={!session}
                onClick={() => {
                  void handleExport()
                }}
              >
                {strings.cofre.export}
              </IonButton>

              <IonButton
                data-testid="termo-open"
                fill="clear"
                size="small"
                onClick={() => setTermoModalOpen(true)}
              >
                {strings.termo.open}
              </IonButton>
            </div>

            <input
              ref={fileInputRef}
              data-testid="cofre-import-input"
              type="file"
              accept=".cofre,application/octet-stream"
              hidden
              onChange={(event) => {
                void handleImportChange(event.target.files)
              }}
            />
          </section>
        )}

        {showCofreUi &&
          status === 'ready' &&
          session &&
          tab === 'veiculos' &&
          view.kind === 'main' && (
            <div data-testid="tab-panel-veiculos">
              <VeiculosList
                veiculos={veiculos}
                getManutencoesCount={getManutencoesCount}
                onAdd={() => setView({ kind: 'veiculo-form', veiculoId: null })}
                onEdit={(veiculo) => setView({ kind: 'veiculo-form', veiculoId: veiculo.id })}
                onOpenHistorico={(veiculo) => {
                  setView({ kind: 'manutencoes', veiculoId: veiculo.id })
                  setTab('manutencoes')
                }}
                onConfirmDelete={async (veiculo, cascadeConfirmed) => {
                  await removeVeiculo(veiculo.id, cascadeConfirmed)
                }}
              />
            </div>
          )}

        {showCofreUi &&
          status === 'ready' &&
          session &&
          tab === 'veiculos' &&
          view.kind === 'veiculo-form' && (
            <div data-testid="tab-panel-veiculos-form">
              <VeiculoForm
                initial={editingVeiculo}
                submitting={submitting}
                onCancel={() => setView({ kind: 'main' })}
                onSubmit={async (raw) => {
                  setSubmitting(true)
                  try {
                    const result = await saveVeiculo(raw, view.veiculoId)
                    if (result.ok === true) {
                      setView({ kind: 'main' })
                    }
                    return result
                  } finally {
                    setSubmitting(false)
                  }
                }}
              />
            </div>
          )}

        {showCofreUi && status === 'ready' && session && tab === 'manutencoes' && (
          <div data-testid="tab-panel-manutencoes">
            {view.kind === 'manutencoes' && detalheVeiculo ? (
              <ManutencoesList
                veiculo={detalheVeiculo}
                manutencoes={manutencoes}
                onAdd={() =>
                  setView({
                    kind: 'manutencao-form',
                    veiculoId: view.veiculoId,
                    manutencaoId: null,
                  })
                }
                onEdit={(manutencao) =>
                  setView({
                    kind: 'manutencao-form',
                    veiculoId: view.veiculoId,
                    manutencaoId: manutencao.id,
                  })
                }
                onConfirmDelete={async (manutencao) => {
                  await removeManutencao(manutencao.id)
                }}
                onGenerateRelatorio={() => {
                  void gerarRelatorio(view.veiculoId)
                }}
                relatorioWorking={relatorioStatus === 'working'}
                relatorioMessage={relatorioMessage}
                relatorioError={relatorioError}
              />
            ) : view.kind === 'manutencao-form' ? (
              <ManutencaoForm
                veiculoId={view.veiculoId}
                initial={editingManutencao}
                submitting={submitting}
                anexos={anexos}
                anexosProcessing={anexosProcessing}
                anexosError={anexosError}
                attachFile={attachFile}
                confirmPreparedAnexo={confirmPreparedAnexo}
                loadAnexoBytes={loadAnexoBytes}
                removeAnexo={removeAnexo}
                onCancel={() => {
                  clearPending()
                  setView({ kind: 'manutencoes', veiculoId: view.veiculoId })
                }}
                onSubmit={async (raw) => {
                  setSubmitting(true)
                  try {
                    const result = await saveManutencao(raw, view.manutencaoId)
                    if (result.ok === true) {
                      if (view.manutencaoId === null) {
                        const flushed = await flushPending(result.id)
                        if (!flushed) {
                          setView({
                            kind: 'manutencao-form',
                            veiculoId: view.veiculoId,
                            manutencaoId: result.id,
                          })
                          return result
                        }
                      }
                      clearPending()
                      setView({ kind: 'manutencoes', veiculoId: view.veiculoId })
                    }
                    return result
                  } finally {
                    setSubmitting(false)
                  }
                }}
              />
            ) : (
              <p data-testid="manutencoes-pick-veiculo">{strings.shell.manutencoesPickVeiculo}</p>
            )}
          </div>
        )}

        <TermoModal isOpen={termoModalOpen} onClose={() => setTermoModalOpen(false)} />

        <IonAlert
          isOpen={replaceAlertOpen}
          header={strings.cofre.replaceTitle}
          message={strings.cofre.replaceMessage}
          buttons={[
            {
              text: strings.cofre.replaceCancel,
              role: 'cancel',
              handler: () => {
                pendingFileRef.current = null
              },
            },
            {
              text: strings.cofre.replaceConfirm,
              role: 'confirm',
              handler: () => {
                void confirmReplace()
              },
            },
          ]}
          onDidDismiss={() => setReplaceAlertOpen(false)}
        />
      </IonContent>

      <AppShellFooter
        activeTab={tab}
        onTabChange={handleTabChange}
        showAds={showAds}
        showTabs={showTabs}
      />
    </IonPage>
  )
}
