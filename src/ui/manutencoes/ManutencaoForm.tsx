import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { IonAlert, IonButton, IonInput, IonItem, IonList, IonNote, IonText } from '@ionic/react'
import type {
  Manutencao,
  ManutencaoField,
  ManutencaoFieldError,
  ManutencaoFormFields,
  ManutencaoRawInput,
  OcrFieldSuggestions,
  PecaFormItem,
  PreparedAnexo,
} from '../../domain'
import { MIME_PDF } from '../../domain'
import { strings } from '../../shared/i18n'
import { AnexosSection } from '../anexos/AnexosSection'
import type { UseAnexosResult } from '../hooks/useAnexos'
import { useOcr, type OcrRunOutcome } from '../hooks/useOcr'
import { fieldErrorsMap } from './fieldErrorMessages'
import {
  nextWizardStep,
  prevWizardStep,
  wizardStepForFieldErrors,
  type ManutencaoWizardStep,
} from './wizardSteps'

export interface ManutencaoFormProps {
  veiculoId: number
  /** Contexto do veículo exibido no formulário (placa · marca/modelo). */
  veiculoPlaca?: string
  veiculoMarcaModelo?: string
  initial: Manutencao | null
  onSubmit: (
    raw: ManutencaoRawInput,
  ) => Promise<{ ok: true; id: number } | { ok: false; fieldErrors: ManutencaoFieldError[] }>
  onCancel: () => void
  /**
   * Ref preenchida pelo form: retorna `true` se o voltar do header foi consumido
   * (etapa anterior); `false` se o pai deve cancelar o fluxo (etapa 1).
   */
  backHandlerRef?: MutableRefObject<(() => boolean) | null>
  submitting?: boolean
  anexos: UseAnexosResult['anexos']
  anexosProcessing: boolean
  anexosError: string | null
  attachFile: UseAnexosResult['attachFile']
  confirmPreparedAnexo: UseAnexosResult['confirmPreparedAnexo']
  loadAnexoBytes: UseAnexosResult['loadAnexoBytes']
  removeAnexo: UseAnexosResult['removeAnexo']
}

type FormState = ManutencaoFormFields

function toFormState(manutencao: Manutencao | null): FormState {
  if (!manutencao) {
    return {
      data: '',
      km: '',
      tipoServico: '',
      pecas: [],
      oficina: '',
      proximaRevisao: '',
    }
  }
  return {
    data: manutencao.data,
    km: String(manutencao.km),
    tipoServico: manutencao.tipoServico,
    pecas: manutencao.pecasTrocadas.map((peca) => ({
      descricao: peca.descricao,
      valor: String(peca.valor),
    })),
    oficina: manutencao.oficina ?? '',
    proximaRevisao: manutencao.proximaRevisao ?? '',
  }
}

function sumPecasPreview(pecas: PecaFormItem[]): number | null {
  if (pecas.length === 0) return null
  let total = 0
  let hasAny = false
  for (const peca of pecas) {
    const text = peca.valor.trim().replace(',', '.')
    if (text === '') continue
    const parsed = Number(text)
    if (!Number.isFinite(parsed)) continue
    total += parsed
    hasAny = true
  }
  return hasAny ? total : null
}

function progressLabel(step: ManutencaoWizardStep): string {
  return strings.manutencoes.progressLabel
    .replace('{{current}}', String(step))
    .replace('{{total}}', '3')
}

function stepTitle(step: ManutencaoWizardStep): string {
  if (step === 1) return strings.manutencoes.stepComprovanteTitle
  if (step === 2) return strings.manutencoes.stepDadosTitle
  return strings.manutencoes.stepPecasTitle
}

export function ManutencaoForm({
  veiculoId,
  veiculoPlaca,
  veiculoMarcaModelo,
  initial,
  onSubmit,
  onCancel,
  backHandlerRef,
  submitting = false,
  anexos,
  anexosProcessing,
  anexosError,
  attachFile,
  confirmPreparedAnexo,
  loadAnexoBytes,
  removeAnexo,
}: ManutencaoFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial))
  const [step, setStep] = useState<ManutencaoWizardStep>(1)
  const [touched, setTouched] = useState<Partial<Record<ManutencaoField, boolean>>>({})
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ManutencaoField, string>>>({})
  const [ocrFeedback, setOcrFeedback] = useState<string | null>(null)
  const pendingOcrBytesRef = useRef<Uint8Array | null>(null)
  const stepTitleRef = useRef<HTMLHeadingElement>(null)
  const ocr = useOcr()

  const valorTotal = sumPecasPreview(form.pecas)
  const valorDisplay =
    valorTotal === null
      ? strings.manutencoes.valorTotalEmpty
      : valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  useEffect(() => {
    if (!backHandlerRef) return
    backHandlerRef.current = () => {
      if (step <= 1) return false
      setStep(prevWizardStep(step))
      return true
    }
    return () => {
      backHandlerRef.current = null
    }
  }, [backHandlerRef, step])

  useEffect(() => {
    stepTitleRef.current?.focus()
  }, [step])

  const invalidClass = useMemo(() => {
    return (field: ManutencaoField): string => {
      const classes: string[] = []
      if (touched[field]) classes.push('ion-touched')
      if (fieldErrors[field]) classes.push('ion-invalid')
      else if (touched[field]) classes.push('ion-valid')
      return classes.join(' ')
    }
  }, [touched, fieldErrors])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updatePeca(index: number, patch: Partial<PecaFormItem>) {
    setForm((current) => ({
      ...current,
      pecas: current.pecas.map((peca, i) => (i === index ? { ...peca, ...patch } : peca)),
    }))
  }

  function addPeca() {
    setForm((current) => ({
      ...current,
      pecas: [...current.pecas, { descricao: '', valor: '' }],
    }))
  }

  function removePeca(index: number) {
    setForm((current) => ({
      ...current,
      pecas: current.pecas.filter((_, i) => i !== index),
    }))
  }

  function applyOutcome(outcome: OcrRunOutcome) {
    if (outcome.kind === 'done') {
      applySuggestions(outcome.suggestions)
      return
    }
    if (outcome.kind === 'cancelled' || outcome.kind === 'needs-ack') return
    if (outcome.kind === 'error') {
      setOcrFeedback(strings.ocr.attachedWithoutPrefill)
    }
  }

  function applySuggestions(suggestions: OcrFieldSuggestions) {
    setForm((current) => {
      const next = ocr.applyToForm(current, suggestions)
      if (Object.keys(suggestions).length === 0) {
        setOcrFeedback(strings.ocr.emptyResult)
      } else {
        setOcrFeedback(strings.ocr.appliedOk)
      }
      return next
    })
  }

  async function runOcrOnBytes(bytes: Uint8Array) {
    pendingOcrBytesRef.current = bytes
    setOcrFeedback(null)
    const outcome = await ocr.requestOcr(bytes)
    applyOutcome(outcome)
  }

  function handleAttached(prepared: PreparedAnexo) {
    if (prepared.mimeType === MIME_PDF) {
      setOcrFeedback(strings.ocr.pdfNoOcr)
      return
    }
    void runOcrOnBytes(prepared.bytes)
  }

  function goContinue() {
    setStep(nextWizardStep(step))
  }

  async function handleSubmit() {
    setTouched({
      data: true,
      km: true,
      tipoServico: true,
      pecasTrocadas: true,
      oficina: true,
      proximaRevisao: true,
    })

    const raw: ManutencaoRawInput = {
      veiculoId,
      data: form.data,
      km: form.km,
      tipoServico: form.tipoServico,
      pecasTrocadas: form.pecas,
      oficina: form.oficina,
      proximaRevisao: form.proximaRevisao,
    }

    const result = await onSubmit(raw)
    if (result.ok === false) {
      const map = fieldErrorsMap(result.fieldErrors)
      setFieldErrors(map)
      setStep(wizardStepForFieldErrors(Object.keys(map) as ManutencaoField[]))
      return
    }
    setFieldErrors({})
  }

  const modelAckMessage = strings.ocr.modelAckMessage.replace('{{sizeMb}}', String(ocr.modelSizeMb))

  const ocrErrorMessage =
    ocr.errorCode === 'MODEL_DOWNLOAD_FAILED' ? strings.ocr.modelDownloadFailed : strings.ocr.failed

  return (
    <section data-testid="manutencao-form" className="hvcf-wizard">
      {(veiculoPlaca || veiculoMarcaModelo) && (
        <div className="hvcf-wizard__context" data-testid="manutencao-veiculo-context">
          {veiculoPlaca && <span className="hvcf-wizard__context-placa">{veiculoPlaca}</span>}
          {veiculoPlaca && veiculoMarcaModelo && <span aria-hidden="true">·</span>}
          {veiculoMarcaModelo && (
            <span className="hvcf-wizard__context-marca">{veiculoMarcaModelo}</span>
          )}
        </div>
      )}

      <div
        className="hvcf-wizard__progress"
        data-testid="manutencao-wizard-progress"
        role="group"
        aria-label={progressLabel(step)}
      >
        <p className="hvcf-wizard__progress-label" data-testid="manutencao-wizard-progress-label">
          {progressLabel(step)}
        </p>
        <div className="hvcf-wizard__progress-track" aria-hidden="true">
          {([1, 2, 3] as const).map((dot) => (
            <span
              key={dot}
              className={[
                'hvcf-wizard__progress-dot',
                dot === step ? 'hvcf-wizard__progress-dot--active' : '',
                dot < step ? 'hvcf-wizard__progress-dot--done' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>
      </div>

      <h2
        ref={stepTitleRef}
        className="hvcf-wizard__step-title"
        data-testid="manutencao-wizard-step-title"
        tabIndex={-1}
        aria-current="step"
      >
        {stepTitle(step)}
      </h2>

      <div key={step} className="hvcf-wizard__panel" data-testid={`manutencao-wizard-step-${step}`}>
        {step === 1 && (
          <>
            <AnexosSection
              hideTitle
              anexos={anexos}
              processing={anexosProcessing}
              errorMessage={anexosError}
              attachFile={attachFile}
              confirmPreparedAnexo={confirmPreparedAnexo}
              loadAnexoBytes={loadAnexoBytes}
              removeAnexo={removeAnexo}
              onAttached={handleAttached}
              disabled={submitting || ocr.status === 'processing'}
            />

            {ocr.status === 'processing' && (
              <div className="hvcf-ocr-status" data-testid="ocr-processing-block">
                <IonNote data-testid="ocr-processing" role="status" aria-live="polite">
                  {strings.ocr.processing}
                </IonNote>
                <IonButton data-testid="ocr-cancel" size="small" fill="clear" onClick={ocr.cancel}>
                  {strings.ocr.cancel}
                </IonButton>
              </div>
            )}
            {ocrFeedback && (
              <IonNote
                data-testid="ocr-feedback"
                color="medium"
                className="hvcf-ocr-feedback"
                role="status"
                aria-live="polite"
              >
                {ocrFeedback}
              </IonNote>
            )}
          </>
        )}

        {step === 2 && (
          <IonList>
            <IonItem>
              <IonInput
                data-testid="manutencao-data"
                label={strings.manutencoes.data}
                labelPlacement="stacked"
                type="date"
                value={form.data}
                className={invalidClass('data')}
                errorText={fieldErrors.data}
                onIonInput={(event) => updateField('data', event.detail.value ?? '')}
                onIonBlur={() => setTouched((t) => ({ ...t, data: true }))}
              />
            </IonItem>
            <IonItem>
              <IonInput
                data-testid="manutencao-km"
                label={strings.manutencoes.km}
                labelPlacement="stacked"
                type="number"
                inputMode="numeric"
                value={form.km}
                className={invalidClass('km')}
                errorText={fieldErrors.km}
                onIonInput={(event) => updateField('km', event.detail.value ?? '')}
                onIonBlur={() => setTouched((t) => ({ ...t, km: true }))}
              />
            </IonItem>
            <IonItem>
              <IonInput
                data-testid="manutencao-tipo-servico"
                label={strings.manutencoes.tipoServico}
                labelPlacement="stacked"
                value={form.tipoServico}
                className={invalidClass('tipoServico')}
                errorText={fieldErrors.tipoServico}
                onIonInput={(event) => updateField('tipoServico', event.detail.value ?? '')}
                onIonBlur={() => setTouched((t) => ({ ...t, tipoServico: true }))}
              />
            </IonItem>
            <IonItem>
              <IonInput
                data-testid="manutencao-oficina"
                label={strings.manutencoes.oficina}
                labelPlacement="stacked"
                value={form.oficina}
                onIonInput={(event) => updateField('oficina', event.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonInput
                data-testid="manutencao-proxima-revisao"
                label={strings.manutencoes.proximaRevisao}
                labelPlacement="stacked"
                value={form.proximaRevisao}
                onIonInput={(event) => updateField('proximaRevisao', event.detail.value ?? '')}
              />
            </IonItem>
          </IonList>
        )}

        {step === 3 && (
          <>
            <IonList>
              <IonItem lines="none">
                <IonNote slot="start">{strings.manutencoes.pecasTrocadas}</IonNote>
              </IonItem>
              {form.pecas.map((peca, index) => (
                <div key={index} data-testid={`manutencao-peca-${index}`}>
                  <IonItem>
                    <IonInput
                      data-testid={`manutencao-peca-descricao-${index}`}
                      label={strings.manutencoes.pecaDescricao}
                      labelPlacement="stacked"
                      value={peca.descricao}
                      className={invalidClass('pecasTrocadas')}
                      onIonInput={(event) =>
                        updatePeca(index, { descricao: event.detail.value ?? '' })
                      }
                      onIonBlur={() => setTouched((t) => ({ ...t, pecasTrocadas: true }))}
                    />
                  </IonItem>
                  <IonItem>
                    <IonInput
                      data-testid={`manutencao-peca-valor-${index}`}
                      label={strings.manutencoes.pecaValor}
                      labelPlacement="stacked"
                      type="number"
                      inputMode="decimal"
                      value={peca.valor}
                      className={invalidClass('pecasTrocadas')}
                      onIonInput={(event) => updatePeca(index, { valor: event.detail.value ?? '' })}
                      onIonBlur={() => setTouched((t) => ({ ...t, pecasTrocadas: true }))}
                    />
                  </IonItem>
                  <IonButton
                    data-testid={`manutencao-peca-remover-${index}`}
                    size="small"
                    fill="clear"
                    color="medium"
                    onClick={() => removePeca(index)}
                  >
                    {strings.manutencoes.pecaRemove}
                  </IonButton>
                </div>
              ))}
              {fieldErrors.pecasTrocadas && (
                <IonNote color="danger" data-testid="manutencao-pecas-error">
                  {fieldErrors.pecasTrocadas}
                </IonNote>
              )}
              <IonButton
                data-testid="manutencao-peca-add"
                size="small"
                fill="outline"
                onClick={addPeca}
              >
                {strings.manutencoes.pecaAdd}
              </IonButton>
            </IonList>

            <div className="hvcf-total-resumo" data-testid="manutencao-valor-resumo">
              <p className="hvcf-total-resumo__label">{strings.manutencoes.valorTotal}</p>
              <p className="hvcf-total-resumo__value" data-testid="manutencao-valor">
                {valorDisplay}
              </p>
              <p className="hvcf-total-resumo__hint" data-testid="manutencao-valor-hint">
                {strings.manutencoes.valorTotalHint}
              </p>
            </div>
          </>
        )}
      </div>

      {Object.keys(fieldErrors).length > 0 && (
        <IonText color="danger">
          <IonNote color="danger" data-testid="manutencao-form-errors" role="alert">
            {Object.values(fieldErrors).join(' ')}
          </IonNote>
        </IonText>
      )}

      <div className="hvcf-wizard__actions">
        {step < 3 ? (
          <IonButton
            data-testid="manutencao-continuar"
            className="hvcf-wizard__cta"
            disabled={submitting}
            onClick={goContinue}
          >
            {strings.manutencoes.continue}
          </IonButton>
        ) : (
          <>
            <IonButton
              data-testid="manutencao-salvar"
              className="hvcf-wizard__cta"
              disabled={submitting}
              onClick={() => {
                void handleSubmit()
              }}
            >
              {strings.manutencoes.save}
            </IonButton>
            <IonButton
              data-testid="manutencao-cancelar"
              className="hvcf-wizard__cta--secondary"
              fill="outline"
              disabled={submitting}
              onClick={onCancel}
            >
              {strings.manutencoes.cancel}
            </IonButton>
          </>
        )}
      </div>

      <IonAlert
        isOpen={ocr.status === 'needs-model-ack'}
        header={strings.ocr.modelAckTitle}
        message={modelAckMessage}
        buttons={[
          {
            text: strings.ocr.modelAckSkip,
            role: 'cancel',
            handler: () => {
              ocr.clearError()
              setOcrFeedback(strings.ocr.attachedWithoutPrefill)
            },
          },
          {
            text: strings.ocr.modelAckConfirm,
            role: 'confirm',
            handler: () => {
              void (async () => {
                const outcome = await ocr.acknowledgeModelAndRun()
                applyOutcome(outcome)
              })()
            },
          },
        ]}
      />

      <IonAlert
        isOpen={ocr.status === 'error'}
        header={strings.ocr.title}
        message={ocrErrorMessage}
        buttons={[
          {
            text: strings.ocr.continueManual,
            role: 'cancel',
            handler: () => {
              ocr.clearError()
              setOcrFeedback(strings.ocr.attachedWithoutPrefill)
            },
          },
          {
            text: strings.ocr.retry,
            role: 'confirm',
            handler: () => {
              const bytes = pendingOcrBytesRef.current
              if (!bytes) return
              void (async () => {
                const outcome = await ocr.requestOcr(bytes)
                applyOutcome(outcome)
              })()
            },
          },
        ]}
      />
    </section>
  )
}
