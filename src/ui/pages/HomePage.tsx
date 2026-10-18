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
import { carOutline, chevronBack, lockClosedOutline } from 'ionicons/icons'
import { strings } from '../../shared/i18n'
import { isMinimumBrowserSupported } from '../../shared/browser/isMinimumBrowserSupported'
import type { Manutencao, Veiculo } from '../../domain'
import { useAnexos } from '../hooks/useAnexos'
import { useAppPrefs } from '../hooks/useAppPrefs'
import { useCofre } from '../hooks/useCofre'
import { useManutencoes } from '../hooks/useManutencoes'
import { useRelatorio } from '../hooks/useRelatorio'
import { useVeiculos } from '../hooks/useVeiculos'
import { AjustesBackupPanel } from '../ajustes/AjustesBackupPanel'
import { EmptyState } from '../components/EmptyState'
import { FeedbackToast } from '../components/FeedbackToast'
import { ManutencaoForm } from '../manutencoes/ManutencaoForm'
import { ManutencoesList } from '../manutencoes/ManutencoesList'
import { LandingPage, resolveLandingIntent, type LandingCta } from '../landing'
import { BackupReminderBanner, OnboardingFlow, TermoGate, TermoModal } from '../onboarding'
import {
  AppShellFooter,
  AppSidebar,
  BrowserUnsupportedGate,
  CofreLoadingGate,
  type AppTabId,
} from '../shell'
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

/** Fluxo de primeiro uso (sem cofre e sem termo): landing → onboarding ou só termo. */
type FirstUsePhase = 'landing' | 'onboarding' | 'import-termo'

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
    prefs,
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
  const [firstUsePhase, setFirstUsePhase] = useState<FirstUsePhase>('landing')
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
  const manutencaoBackHandlerRef = useRef<(() => boolean) | null>(null)
  const mainRegionRef = useRef<HTMLDivElement>(null)
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

  function handleTabChange(next: AppTabId, opts?: { focusMain?: boolean }) {
    setTab(next)
    if (next === 'veiculos' && view.kind === 'manutencao-form') {
      clearPending()
      setView({ kind: 'main' })
    }
    if (next === 'config') {
      if (view.kind === 'manutencao-form') clearPending()
      setView({ kind: 'main' })
    }
    if (opts?.focusMain) {
      // Após troca pela sidebar: foco na região principal (não fica preso na nav).
      queueMicrotask(() => {
        mainRegionRef.current?.focus()
      })
    }
  }

  function handleSidebarTabChange(next: AppTabId) {
    handleTabChange(next, { focusMain: true })
  }

  function handleAcceptTermo() {
    acceptTermo()
    if (!session) {
      setTab('config')
    }
  }

  function handleLandingCta(cta: LandingCta) {
    const destination = resolveLandingIntent(cta, !!session)
    if (destination.kind === 'onboarding') {
      setFirstUsePhase('onboarding')
      return
    }
    if (destination.kind === 'import-termo') {
      setFirstUsePhase('import-termo')
      return
    }
    setTab('veiculos')
    setView({ kind: 'main' })
  }

  function handleExitToLanding() {
    setFirstUsePhase('landing')
  }

  function handleHeaderBack() {
    if (view.kind === 'manutencao-form') {
      if (manutencaoBackHandlerRef.current?.()) return
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
  const showLanding = showFullOnboarding && firstUsePhase === 'landing'
  const showOnboardingFlow =
    showFullOnboarding && (firstUsePhase === 'onboarding' || firstUsePhase === 'import-termo')
  const showTermoGate = (status === 'ready' || status === 'error') && !termoAccepted && !!session
  const showCofreUi = (status === 'ready' || status === 'error') && termoAccepted

  const isCadastroFlow =
    view.kind === 'veiculo-form' || view.kind === 'manutencao-form' || showFullOnboarding

  const showAds = showCofreUi && !isCadastroFlow && !showTermoGate
  const showTabs = showCofreUi && !showFullOnboarding && !showTermoGate
  const showHomeTitle = status === 'loading' || showOnboardingFlow || showTermoGate
  const isVeiculosHome =
    showCofreUi && status === 'ready' && !!session && tab === 'veiculos' && view.kind === 'main'
  const showCofreRequired =
    showCofreUi && status === 'ready' && !session && (tab === 'veiculos' || tab === 'manutencoes')
  const showIonHeader = !isVeiculosHome && !showLanding
  const backupBannerNode =
    showCofreUi && showBackupReminder && session && !isCadastroFlow ? (
      <BackupReminderBanner
        onExport={() => {
          void handleExport()
        }}
        onDismiss={dismissReminderForSession}
      />
    ) : null

  if (!browserSupported || status === 'opfs-unavailable') {
    return <BrowserUnsupportedGate />
  }

  return (
    <IonPage
      className={showTabs ? 'hvcf-shell-page hvcf-shell-page--desktop-nav' : 'hvcf-shell-page'}
    >
      {showTabs ? <AppSidebar activeTab={tab} onTabChange={handleSidebarTabChange} /> : null}
      {showIonHeader && (
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
      )}
      <IonContent className="ion-padding">
        <div
          ref={mainRegionRef}
          data-testid="shell-main-region"
          tabIndex={-1}
          className="hvcf-shell-main-region"
        >
          {status === 'loading' && (
            <div className="hvcf-content-col hvcf-content-col--form">
              <CofreLoadingGate />
            </div>
          )}

          {status === 'error' && errorMessage && (
            <IonText color="danger">
              <p>{errorMessage}</p>
            </IonText>
          )}

          {showLanding && (
            <div className="hvcf-content-col hvcf-content-col--landing">
              <LandingPage onCta={handleLandingCta} />
            </div>
          )}

          {showOnboardingFlow && (
            <div className="hvcf-content-col hvcf-content-col--form">
              <OnboardingFlow
                key={firstUsePhase}
                initialStep={firstUsePhase === 'import-termo' ? 3 : 1}
                onAccept={handleAcceptTermo}
                onExit={handleExitToLanding}
              />
            </div>
          )}

          {showTermoGate && (
            <div className="hvcf-content-col hvcf-content-col--form">
              <TermoGate onAccept={handleAcceptTermo} />
            </div>
          )}

          {backupBannerNode && !isVeiculosHome && backupBannerNode}

          {showCofreUi && (
            <FeedbackToast
              message={feedbackError && status === 'ready' ? null : feedbackMessage}
              variant="success"
              testId="cofre-message"
            />
          )}

          {showCofreUi && status === 'ready' && (
            <FeedbackToast message={feedbackError} variant="error" testId="cofre-error" />
          )}

          {showCofreRequired && (
            <div
              data-testid={tab === 'veiculos' ? 'tab-panel-veiculos' : 'tab-panel-manutencoes'}
              className="hvcf-content-col hvcf-content-col--list"
            >
              <EmptyState
                icon={lockClosedOutline}
                title={strings.cofre.requiredTitle}
                body={strings.cofre.requiredBody}
                testId="cofre-required"
                actionLabel={strings.cofre.requiredCta}
                actionTestId="cofre-required-cta"
                onAction={() => handleTabChange('config', { focusMain: true })}
              />
            </div>
          )}

          {showCofreUi && tab === 'config' && (
            <div className="hvcf-content-col hvcf-content-col--form">
              <AjustesBackupPanel
                session={session}
                meta={meta}
                lastBackupAt={prefs.lastBackupAt}
                fileInputRef={fileInputRef}
                formatModifiedAt={formatModifiedAt}
                onCreate={() => {
                  void handleCreateCofre()
                }}
                onImportClick={() => fileInputRef.current?.click()}
                onExport={() => {
                  void handleExport()
                }}
                onOpenTermo={() => setTermoModalOpen(true)}
                onImportChange={(files) => {
                  void handleImportChange(files)
                }}
              />
            </div>
          )}

          {showCofreUi &&
            status === 'ready' &&
            session &&
            tab === 'veiculos' &&
            view.kind === 'main' && (
              <div
                data-testid="tab-panel-veiculos"
                className="hvcf-content-col hvcf-content-col--list"
              >
                <VeiculosList
                  veiculos={veiculos}
                  lastBackupAt={prefs.lastBackupAt}
                  getManutencoesCount={getManutencoesCount}
                  backupBanner={backupBannerNode}
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
              <div
                data-testid="tab-panel-veiculos-form"
                className="hvcf-content-col hvcf-content-col--form"
              >
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
            <div
              data-testid="tab-panel-manutencoes"
              className={
                view.kind === 'manutencao-form'
                  ? 'hvcf-content-col hvcf-content-col--form'
                  : 'hvcf-content-col hvcf-content-col--list'
              }
            >
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
                  veiculoPlaca={detalheVeiculo?.placa}
                  veiculoMarcaModelo={detalheVeiculo?.marcaModelo}
                  initial={editingManutencao}
                  submitting={submitting}
                  anexos={anexos}
                  anexosProcessing={anexosProcessing}
                  anexosError={anexosError}
                  attachFile={attachFile}
                  confirmPreparedAnexo={confirmPreparedAnexo}
                  loadAnexoBytes={loadAnexoBytes}
                  removeAnexo={removeAnexo}
                  backHandlerRef={manutencaoBackHandlerRef}
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
                <EmptyState
                  icon={carOutline}
                  title={strings.shell.manutencoesPickVeiculoTitle}
                  body={strings.shell.manutencoesPickVeiculo}
                  testId="manutencoes-pick-veiculo"
                  actionLabel={strings.shell.manutencoesPickVeiculoCta}
                  actionTestId="manutencoes-pick-veiculos-cta"
                  onAction={() => setTab('veiculos')}
                />
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
        </div>
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
