/**
 * Merge de sugestões OCR no formulário.
 * Edição humana prevalece: campos já preenchidos NÃO são sobrescritos.
 */

import { OCR_FORM_FIELD_KEYS, type ManutencaoFormFields, type OcrFieldSuggestions } from './types'

/**
 * Aplica sugestões OCR apenas em campos vazios do formulário atual.
 * Retorna novo objeto; não muta `current`.
 *
 * Peças: se a lista estiver vazia e houver `pecasTrocadas`, cria um item
 * com essa descrição e valor 0 (ou o valor sugerido pelo OCR, se houver).
 */
export function mergeOcrSuggestions(
  current: ManutencaoFormFields,
  suggestions: OcrFieldSuggestions,
): ManutencaoFormFields {
  const next: ManutencaoFormFields = {
    ...current,
    pecas: current.pecas.map((peca) => ({ ...peca })),
  }

  for (const key of OCR_FORM_FIELD_KEYS) {
    const suggestion = suggestions[key]
    if (suggestion === undefined || suggestion.trim() === '') continue
    if (current[key].trim() !== '') continue
    next[key] = suggestion
  }

  const pecasSuggestion = suggestions.pecasTrocadas?.trim()
  if (pecasSuggestion && current.pecas.length === 0) {
    const valorSuggestion = suggestions.valor?.trim()
    next.pecas = [
      {
        descricao: pecasSuggestion,
        valor: valorSuggestion && valorSuggestion.length > 0 ? valorSuggestion : '0',
      },
    ]
  }

  return next
}

export function emptyManutencaoFormFields(): ManutencaoFormFields {
  return {
    data: '',
    km: '',
    tipoServico: '',
    pecas: [],
    oficina: '',
    proximaRevisao: '',
  }
}
