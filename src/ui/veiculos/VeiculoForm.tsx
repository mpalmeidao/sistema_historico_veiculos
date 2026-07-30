import { useMemo, useState } from 'react'
import { IonButton, IonInput, IonItem, IonList, IonNote, IonText } from '@ionic/react'
import type { Veiculo, VeiculoField, VeiculoFieldError, VeiculoRawInput } from '../../domain'
import { strings } from '../../shared/i18n'
import { fieldErrorsMap } from './fieldErrorMessages'

export interface VeiculoFormProps {
  initial: Veiculo | null
  onSubmit: (
    raw: VeiculoRawInput,
  ) => Promise<{ ok: true } | { ok: false; fieldErrors: VeiculoFieldError[] }>
  onCancel: () => void
  submitting?: boolean
}

interface FormState {
  placa: string
  marcaModelo: string
  anoModelo: string
  kmAtual: string
  proximaTroca: string
}

function toFormState(veiculo: Veiculo | null): FormState {
  if (!veiculo) {
    return {
      placa: '',
      marcaModelo: '',
      anoModelo: '',
      kmAtual: '0',
      proximaTroca: '',
    }
  }
  return {
    placa: veiculo.placa,
    marcaModelo: veiculo.marcaModelo,
    anoModelo: veiculo.anoModelo === null ? '' : String(veiculo.anoModelo),
    kmAtual: String(veiculo.kmAtual),
    proximaTroca: veiculo.proximaTroca ?? '',
  }
}

export function VeiculoForm({ initial, onSubmit, onCancel, submitting = false }: VeiculoFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial))
  const [touched, setTouched] = useState<Partial<Record<VeiculoField, boolean>>>({})
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<VeiculoField, string>>>({})

  const title = initial ? strings.veiculos.editTitle : strings.veiculos.createTitle

  const invalidClass = useMemo(() => {
    return (field: VeiculoField): string => {
      const classes: string[] = []
      if (touched[field]) classes.push('ion-touched')
      if (fieldErrors[field]) classes.push('ion-invalid')
      else if (touched[field]) classes.push('ion-valid')
      return classes.join(' ')
    }
  }, [touched, fieldErrors])

  function updateField<K extends keyof FormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit() {
    setTouched({
      placa: true,
      marcaModelo: true,
      anoModelo: true,
      kmAtual: true,
      proximaTroca: true,
    })

    const raw: VeiculoRawInput = {
      placa: form.placa,
      marcaModelo: form.marcaModelo,
      anoModelo: form.anoModelo,
      kmAtual: form.kmAtual,
      proximaTroca: form.proximaTroca,
    }

    const result = await onSubmit(raw)
    if (result.ok === false) {
      setFieldErrors(fieldErrorsMap(result.fieldErrors))
      return
    }
    setFieldErrors({})
  }

  return (
    <section data-testid="veiculo-form">
      <h2>{title}</h2>
      <IonList>
        <IonItem>
          <IonInput
            data-testid="veiculo-placa"
            label={strings.veiculos.placa}
            labelPlacement="stacked"
            value={form.placa}
            className={invalidClass('placa')}
            errorText={fieldErrors.placa}
            onIonInput={(event) => updateField('placa', event.detail.value ?? '')}
            onIonBlur={() => setTouched((t) => ({ ...t, placa: true }))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            data-testid="veiculo-marca-modelo"
            label={strings.veiculos.marcaModelo}
            labelPlacement="stacked"
            value={form.marcaModelo}
            className={invalidClass('marcaModelo')}
            errorText={fieldErrors.marcaModelo}
            onIonInput={(event) => updateField('marcaModelo', event.detail.value ?? '')}
            onIonBlur={() => setTouched((t) => ({ ...t, marcaModelo: true }))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            data-testid="veiculo-ano-modelo"
            label={strings.veiculos.anoModelo}
            labelPlacement="stacked"
            type="number"
            inputMode="numeric"
            value={form.anoModelo}
            className={invalidClass('anoModelo')}
            errorText={fieldErrors.anoModelo}
            onIonInput={(event) => updateField('anoModelo', event.detail.value ?? '')}
            onIonBlur={() => setTouched((t) => ({ ...t, anoModelo: true }))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            data-testid="veiculo-km-atual"
            label={strings.veiculos.kmAtual}
            labelPlacement="stacked"
            type="number"
            inputMode="numeric"
            value={form.kmAtual}
            className={invalidClass('kmAtual')}
            errorText={fieldErrors.kmAtual}
            onIonInput={(event) => updateField('kmAtual', event.detail.value ?? '')}
            onIonBlur={() => setTouched((t) => ({ ...t, kmAtual: true }))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            data-testid="veiculo-proxima-troca"
            label={strings.veiculos.proximaTroca}
            labelPlacement="stacked"
            value={form.proximaTroca}
            onIonInput={(event) => updateField('proximaTroca', event.detail.value ?? '')}
          />
        </IonItem>
      </IonList>

      {Object.keys(fieldErrors).length > 0 && (
        <IonText color="danger">
          <IonNote color="danger" data-testid="veiculo-form-errors">
            {Object.values(fieldErrors).join(' ')}
          </IonNote>
        </IonText>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        <IonButton
          data-testid="veiculo-salvar"
          disabled={submitting}
          onClick={() => {
            void handleSubmit()
          }}
        >
          {strings.veiculos.save}
        </IonButton>
        <IonButton
          data-testid="veiculo-cancelar"
          fill="outline"
          disabled={submitting}
          onClick={onCancel}
        >
          {strings.veiculos.cancel}
        </IonButton>
      </div>
    </section>
  )
}
