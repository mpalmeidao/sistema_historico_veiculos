import type {
  ValidateVeiculoResult,
  VeiculoFieldError,
  VeiculoInput,
  VeiculoRawInput,
} from './types'

function asTrimmedString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function parseOptionalAnoModelo(
  value: unknown,
  errors: VeiculoFieldError[],
): number | null | undefined {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      errors.push({ field: 'anoModelo', code: 'invalid' })
      return undefined
    }
    return value
  }
  const text = asTrimmedString(value)
  if (text === '') return null
  if (!/^-?\d+$/.test(text)) {
    errors.push({ field: 'anoModelo', code: 'invalid' })
    return undefined
  }
  const parsed = Number(text)
  if (!Number.isSafeInteger(parsed)) {
    errors.push({ field: 'anoModelo', code: 'invalid' })
    return undefined
  }
  return parsed
}

function parseKmAtual(value: unknown, errors: VeiculoFieldError[]): number | undefined {
  if (value === null || value === undefined || value === '') {
    errors.push({ field: 'kmAtual', code: 'required' })
    return undefined
  }

  let parsed: number
  if (typeof value === 'number') {
    parsed = value
  } else {
    const text = asTrimmedString(value)
    if (text === '') {
      errors.push({ field: 'kmAtual', code: 'required' })
      return undefined
    }
    if (!/^-?\d+(\.\d+)?$/.test(text)) {
      errors.push({ field: 'kmAtual', code: 'invalid' })
      return undefined
    }
    parsed = Number(text)
  }

  if (!Number.isFinite(parsed)) {
    errors.push({ field: 'kmAtual', code: 'invalid' })
    return undefined
  }
  if (!Number.isInteger(parsed)) {
    errors.push({ field: 'kmAtual', code: 'invalid' })
    return undefined
  }
  if (parsed < 0) {
    errors.push({ field: 'kmAtual', code: 'negative' })
    return undefined
  }
  return parsed
}

/**
 * Valida e normaliza os campos do veículo conforme a spec.
 * Rejeita placa vazia, marca/modelo vazio, km negativo ou não numérico.
 */
export function validateVeiculo(raw: VeiculoRawInput): ValidateVeiculoResult {
  const errors: VeiculoFieldError[] = []

  const placa = asTrimmedString(raw.placa)
  if (placa === '') {
    errors.push({ field: 'placa', code: 'required' })
  }

  const marcaModelo = asTrimmedString(raw.marcaModelo)
  if (marcaModelo === '') {
    errors.push({ field: 'marcaModelo', code: 'required' })
  }

  const anoModelo = parseOptionalAnoModelo(raw.anoModelo, errors)
  const kmAtual = parseKmAtual(raw.kmAtual, errors)

  let proximaTroca: string | null = null
  if (raw.proximaTroca !== null && raw.proximaTroca !== undefined) {
    const text = asTrimmedString(raw.proximaTroca)
    proximaTroca = text === '' ? null : text
  }

  if (errors.length > 0 || anoModelo === undefined || kmAtual === undefined) {
    return { ok: false, errors }
  }

  const value: VeiculoInput = {
    placa,
    marcaModelo,
    anoModelo,
    kmAtual,
    proximaTroca,
  }
  return { ok: true, value }
}
