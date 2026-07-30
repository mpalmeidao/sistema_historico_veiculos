import type { ManutencaoField, ManutencaoFieldError, ManutencaoFieldErrorCode } from '../../domain'
import { strings } from '../../shared/i18n'

type FieldErrorMessages = {
  [K in ManutencaoField]?: Partial<Record<ManutencaoFieldErrorCode, string>>
}

const fieldMessages = strings.manutencoes.fieldErrors as FieldErrorMessages

export function messageForFieldError(error: ManutencaoFieldError): string {
  return fieldMessages[error.field]?.[error.code] ?? strings.manutencoes.saveError
}

export function fieldErrorsMap(
  errors: ManutencaoFieldError[],
): Partial<Record<ManutencaoField, string>> {
  const map: Partial<Record<ManutencaoField, string>> = {}
  for (const error of errors) {
    if (!map[error.field]) {
      map[error.field] = messageForFieldError(error)
    }
  }
  return map
}
