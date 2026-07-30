/**
 * Integração: OCR mockado → parser → merge no formulário.
 * Não depende de Tesseract real.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { emptyManutencaoFormFields, mergeOcrSuggestions, parseOcrText } from '../domain/ocr'
import { OcrError } from '../domain/ocr'
import { createOcrModelPrefsStore } from '../shared/ocr'
import { runOcrInWorker, setOcrRunner } from './runOcrInWorker'

const SAMPLE_OCR_TEXT = `
Razão Social: Oficina Central
Data: 15/01/2026
Km: 40.000
Tipo de serviço: Troca de óleo
Peças: Filtro de óleo
Valor total: R$ 250,50
Próxima revisão: 15/07/2026
`

describe('OCR pipeline (worker mockado + formulário)', () => {
  afterEach(() => {
    setOcrRunner(null)
  })

  it('deve aplicar sugestões do runner mockado ao formulário vazio', async () => {
    setOcrRunner(async () => ({ text: SAMPLE_OCR_TEXT }))

    const { text } = await runOcrInWorker(new Uint8Array([1, 2, 3]))
    const suggestions = parseOcrText(text)
    const form = mergeOcrSuggestions(emptyManutencaoFormFields(), suggestions)

    expect(form.data).toBe('2026-01-15')
    expect(form.km).toBe('40000')
    expect(form.tipoServico).toBe('Troca de óleo')
    expect(form.oficina).toBe('Oficina Central')
    expect(form.pecas).toEqual([{ descricao: 'Filtro de óleo', valor: '250.50' }])
  })

  it('deve manter fluxo manual quando o runner simula falha', async () => {
    setOcrRunner(async () => {
      throw new OcrError('MODEL_DOWNLOAD_FAILED', 'falha simulada de rede')
    })

    await expect(runOcrInWorker(new Uint8Array([1]))).rejects.toMatchObject({
      code: 'MODEL_DOWNLOAD_FAILED',
    })

    const form = emptyManutencaoFormFields()
    form.tipoServico = 'Preenchido manual'
    form.km = '1000'
    form.data = '2026-03-01'

    // Sem sugestões — formulário manual intacto para save
    expect(mergeOcrSuggestions(form, {})).toEqual(form)
  })

  it('deve exigir aviso de modelo na primeira uso (prefs)', () => {
    const memory = new Map<string, string>()
    const store = createOcrModelPrefsStore({
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => {
        memory.set(k, v)
      },
      removeItem: (k) => {
        memory.delete(k)
      },
    })

    expect(store.read().downloadAcked).toBe(false)
    store.acknowledgeDownload()
    expect(store.read().downloadAcked).toBe(true)
  })
})
