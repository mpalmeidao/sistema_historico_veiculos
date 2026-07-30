import type {
  ManutencaoFieldError,
  ManutencaoInput,
  ManutencaoRawInput,
  PecaTrocada,
  ValidateManutencaoResult,
} from './types'

function asTrimmedString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function parseOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = asTrimmedString(value)
  return text === '' ? null : text
}

/**
 * Aceita data no formato YYYY-MM-DD e verifica se é um dia civil válido
 * (rejeita 2026-02-31, strings vazias e formatos não ISO).
 */
function parseData(value: unknown, errors: ManutencaoFieldError[]): string | undefined {
  const text = asTrimmedString(value)
  if (text === '') {
    errors.push({ field: 'data', code: 'required' })
    return undefined
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    errors.push({ field: 'data', code: 'invalid' })
    return undefined
  }
  const [yearText, monthText, dayText] = text.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    errors.push({ field: 'data', code: 'invalid' })
    return undefined
  }
  return text
}

function parseVeiculoId(value: unknown, errors: ManutencaoFieldError[]): number | undefined {
  if (value === null || value === undefined || value === '') {
    errors.push({ field: 'veiculoId', code: 'required' })
    return undefined
  }

  let parsed: number
  if (typeof value === 'number') {
    parsed = value
  } else {
    const text = asTrimmedString(value)
    if (text === '') {
      errors.push({ field: 'veiculoId', code: 'required' })
      return undefined
    }
    if (!/^-?\d+$/.test(text)) {
      errors.push({ field: 'veiculoId', code: 'invalid' })
      return undefined
    }
    parsed = Number(text)
  }

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    errors.push({ field: 'veiculoId', code: 'invalid' })
    return undefined
  }
  return parsed
}

function parseKm(value: unknown, errors: ManutencaoFieldError[]): number | undefined {
  if (value === null || value === undefined || value === '') {
    errors.push({ field: 'km', code: 'required' })
    return undefined
  }

  let parsed: number
  if (typeof value === 'number') {
    parsed = value
  } else {
    const text = asTrimmedString(value)
    if (text === '') {
      errors.push({ field: 'km', code: 'required' })
      return undefined
    }
    if (!/^-?\d+(\.\d+)?$/.test(text)) {
      errors.push({ field: 'km', code: 'invalid' })
      return undefined
    }
    parsed = Number(text)
  }

  if (!Number.isFinite(parsed)) {
    errors.push({ field: 'km', code: 'invalid' })
    return undefined
  }
  if (!Number.isInteger(parsed)) {
    errors.push({ field: 'km', code: 'invalid' })
    return undefined
  }
  if (parsed < 0) {
    errors.push({ field: 'km', code: 'negative' })
    return undefined
  }
  return parsed
}

function parsePecaValor(
  value: unknown,
): { ok: true; value: number } | { ok: false; code: 'invalid' | 'negative' } {
  if (value === null || value === undefined || value === '') {
    return { ok: false, code: 'invalid' }
  }

  let parsed: number
  if (typeof value === 'number') {
    parsed = value
  } else {
    const text = asTrimmedString(value).replace(',', '.')
    if (text === '') return { ok: false, code: 'invalid' }
    if (!/^-?\d+(\.\d+)?$/.test(text)) return { ok: false, code: 'invalid' }
    parsed = Number(text)
  }

  if (!Number.isFinite(parsed)) return { ok: false, code: 'invalid' }
  if (parsed < 0) return { ok: false, code: 'negative' }
  return { ok: true, value: parsed }
}

/**
 * Aceita array de { descricao, valor }. Ignora linhas totalmente em branco
 * (descrição e valor vazios). Linha incompleta (só um dos dois) → erro.
 */
function parsePecasTrocadas(
  value: unknown,
  errors: ManutencaoFieldError[],
): PecaTrocada[] | undefined {
  if (value === null || value === undefined || value === '') {
    return []
  }

  if (!Array.isArray(value)) {
    errors.push({ field: 'pecasTrocadas', code: 'invalid' })
    return undefined
  }

  const pecas: PecaTrocada[] = []
  let hasError = false

  for (const item of value) {
    if (item === null || item === undefined || typeof item !== 'object') {
      errors.push({ field: 'pecasTrocadas', code: 'invalid' })
      hasError = true
      continue
    }

    const record = item as Record<string, unknown>
    const descricao = asTrimmedString(record.descricao)
    const valorRaw = record.valor
    const valorEmpty =
      valorRaw === null || valorRaw === undefined || asTrimmedString(valorRaw) === ''

    if (descricao === '' && valorEmpty) {
      continue
    }

    if (descricao === '') {
      errors.push({ field: 'pecasTrocadas', code: 'required' })
      hasError = true
      continue
    }

    const valorResult = parsePecaValor(valorRaw)
    if (valorResult.ok === false) {
      errors.push({ field: 'pecasTrocadas', code: valorResult.code })
      hasError = true
      continue
    }

    pecas.push({
      descricao,
      valor: valorResult.value,
      posicao: pecas.length,
    })
  }

  if (hasError) return undefined
  return pecas
}

/**
 * Valida e normaliza os campos da manutenção conforme a spec.
 * Obrigatórios: data (YYYY-MM-DD), km (≥ 0), tipo de serviço, veiculoId (> 0).
 * Opcionais: peças (lista), oficina, próxima revisão.
 * Valor total = soma das peças (null se lista vazia); raw.valor é ignorado.
 */
export function validateManutencao(raw: ManutencaoRawInput): ValidateManutencaoResult {
  const errors: ManutencaoFieldError[] = []

  const veiculoId = parseVeiculoId(raw.veiculoId, errors)
  const data = parseData(raw.data, errors)
  const km = parseKm(raw.km, errors)

  const tipoServico = asTrimmedString(raw.tipoServico)
  if (tipoServico === '') {
    errors.push({ field: 'tipoServico', code: 'required' })
  }

  const pecasTrocadas = parsePecasTrocadas(raw.pecasTrocadas, errors)
  const oficina = parseOptionalText(raw.oficina)
  const proximaRevisao = parseOptionalText(raw.proximaRevisao)

  if (
    errors.length > 0 ||
    veiculoId === undefined ||
    data === undefined ||
    km === undefined ||
    pecasTrocadas === undefined
  ) {
    return { ok: false, errors }
  }

  const valor =
    pecasTrocadas.length === 0 ? null : pecasTrocadas.reduce((sum, peca) => sum + peca.valor, 0)

  const value: ManutencaoInput = {
    veiculoId,
    data,
    km,
    tipoServico,
    pecasTrocadas,
    oficina,
    valor,
    proximaRevisao,
  }
  return { ok: true, value }
}
