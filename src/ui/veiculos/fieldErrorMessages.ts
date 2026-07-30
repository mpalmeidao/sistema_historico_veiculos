import type { VeiculoField, VeiculoFieldError, VeiculoFieldErrorCode } from '../../domain'
import { strings } from '../../shared/i18n'

type FieldErrorMessages = {
  [K in VeiculoField]?: Partial<Record<VeiculoFieldErrorCode, string>>
}

const fieldMessages = strings.veiculos.fieldErrors as FieldErrorMessages

export function messageForFieldError(error: VeiculoFieldError): string {
  return fieldMessages[error.field]?.[error.code] ?? strings.veiculos.saveError
}

export function fieldErrorsMap(errors: VeiculoFieldError[]): Partial<Record<VeiculoField, string>> {
  const map: Partial<Record<VeiculoField, string>> = {}
  for (const error of errors) {
    if (!map[error.field]) {
      map[error.field] = messageForFieldError(error)
    }
  }
  return map
}
