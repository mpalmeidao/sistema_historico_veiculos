/**
 * OCR → formulário de manutenção.
 * Parser puro + merge (edição humana prevalece).
 * PDF sem OCR automático no MVP.
 */

export { emptyManutencaoFormFields, mergeOcrSuggestions } from './mergeOcrSuggestions'
export { parseOcrText } from './parseOcrText'
export {
  OCR_FORM_FIELD_KEYS,
  OcrError,
  type ManutencaoFormFields,
  type OcrErrorCode,
  type OcrFieldSuggestions,
  type OcrFormFieldKey,
  type PecaFormItem,
} from './types'
