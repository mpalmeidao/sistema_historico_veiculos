import { useMemo, useRef, useState } from 'react'
import { IonAlert, IonButton, IonInput, IonItem, IonList, IonNote, IonText } from '@ionic/react'
import type {
  Manutencao,
  ManutencaoField,
  ManutencaoFieldError,
  ManutencaoFormFields,
  ManutencaoRawInput,
  OcrFieldSuggestions,
  PecaFormItem,
} from '../../domain'
import { strings } from '../../shared/i18n'
import { useOcr, type OcrRunOutcome } from '../hooks/useOcr'
import { fieldErrorsMap } from './fieldErrorMessages'

export interface ManutencaoFormProps {
  veiculoId: number
  initial: Manutencao | null
  onSubmit: (
    raw: ManutencaoRawInput,
  ) => Promise<{ ok: true } | { ok: false; fieldErrors: ManutencaoFieldError[] }>
  onCancel: () => void
  submitting?: boolean
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

export function ManutencaoForm({
  veiculoId,
  initial,
  onSubmit,
  onCancel,
  submitting = false,
}: ManutencaoFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial))
  const [touched, setTouched] = useState<Partial<Record<ManutencaoField, boolean>>>({})
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ManutencaoField, string>>>({})
  const [ocrFeedback, setOcrFeedback] = useState<string | null>(null)
  const ocrInputRef = useRef<HTMLInputElement>(null)
  const pendingOcrBytesRef = useRef<Uint8Array | null>(null)
  const ocr = useOcr()

  const title = initial ? strings.manutencoes.editTitle : strings.manutencoes.createTitle
  const valorTotal = sumPecasPreview(form.pecas)

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

  async function handleOcrFile(fileList: FileList | null) {
    const file = fileList?.[0]
    if (ocrInputRef.current) ocrInputRef.current.value = ''
    if (!file || !file.type.startsWith('image/')) return

    setOcrFeedback(null)
    const buffer = new Uint8Array(await file.arrayBuffer())
    pendingOcrBytesRef.current = buffer
    const outcome = await ocr.requestOcr(buffer)
    applyOutcome(outcome)
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
      setFieldErrors(fieldErrorsMap(result.fieldErrors))
      return
    }
    setFieldErrors({})
  }

  const modelAckMessage = strings.ocr.modelAckMessage.replace('{{sizeMb}}', String(ocr.modelSizeMb))

  const ocrErrorMessage =
    ocr.errorCode === 'MODEL_DOWNLOAD_FAILED' ? strings.ocr.modelDownloadFailed : strings.ocr.failed

  return (
    <section data-testid="manutencao-form">
      <h2>{title}</h2>

      <div
        data-testid="ocr-section"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <IonNote>{strings.ocr.hint}</IonNote>
        <IonButton
          data-testid="ocr-pick-image"
          size="small"
          fill="outline"
          disabled={submitting || ocr.status === 'processing'}
          onClick={() => ocrInputRef.current?.click()}
        >
          {strings.ocr.pickImage}
        </IonButton>
        <input
          ref={ocrInputRef}
          data-testid="ocr-image-input"
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(event) => {
            void handleOcrFile(event.target.files)
          }}
        />
        {ocr.status === 'processing' && (
          <>
            <IonNote data-testid="ocr-processing">{strings.ocr.processing}</IonNote>
            <IonButton data-testid="ocr-cancel" size="small" fill="clear" onClick={ocr.cancel}>
              {strings.ocr.cancel}
            </IonButton>
          </>
        )}
        {ocrFeedback && (
          <IonNote data-testid="ocr-feedback" color="medium">
            {ocrFeedback}
          </IonNote>
        )}
      </div>

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
                onIonInput={(event) => updatePeca(index, { descricao: event.detail.value ?? '' })}
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
        <IonButton data-testid="manutencao-peca-add" size="small" fill="outline" onClick={addPeca}>
          {strings.manutencoes.pecaAdd}
        </IonButton>

        <IonItem>
          <IonInput
            data-testid="manutencao-valor"
            label={strings.manutencoes.valorTotal}
            labelPlacement="stacked"
            readonly
            value={
              valorTotal === null
                ? ''
                : valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            }
          />
        </IonItem>
        <IonNote data-testid="manutencao-valor-hint">{strings.manutencoes.valorTotalHint}</IonNote>

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

      {Object.keys(fieldErrors).length > 0 && (
        <IonText color="danger">
          <IonNote color="danger" data-testid="manutencao-form-errors">
            {Object.values(fieldErrors).join(' ')}
          </IonNote>
        </IonText>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        <IonButton
          data-testid="manutencao-salvar"
          disabled={submitting}
          onClick={() => {
            void handleSubmit()
          }}
        >
          {strings.manutencoes.save}
        </IonButton>
        <IonButton
          data-testid="manutencao-cancelar"
          fill="outline"
          disabled={submitting}
          onClick={onCancel}
        >
          {strings.manutencoes.cancel}
        </IonButton>
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
              setOcrFeedback(null)
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
            handler: () => ocr.clearError(),
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
