import { describe, expect, it } from 'vitest'
import { PDF_WARN_BYTES } from './constants'
import { detectAnexoTipo, pdfNeedsSizeWarning } from './detectAnexoTipo'

describe('detectAnexoTipo', () => {
  it('deve aceitar image/* pelo MIME', () => {
    expect(detectAnexoTipo('image/jpeg', 'foto.jpg')).toEqual({
      ok: true,
      kind: 'image',
      mimeType: 'image/jpeg',
    })
    expect(detectAnexoTipo('image/png', null)).toEqual({
      ok: true,
      kind: 'image',
      mimeType: 'image/png',
    })
  })

  it('deve aceitar application/pdf pelo MIME', () => {
    expect(detectAnexoTipo('application/pdf', 'nota.pdf')).toEqual({
      ok: true,
      kind: 'pdf',
      mimeType: 'application/pdf',
    })
  })

  it('deve aceitar por extensão quando MIME está vazio', () => {
    expect(detectAnexoTipo('', 'nota.PDF')).toEqual({
      ok: true,
      kind: 'pdf',
      mimeType: 'application/pdf',
    })
    expect(detectAnexoTipo(null, 'foto.JPEG')).toEqual({
      ok: true,
      kind: 'image',
      mimeType: 'image/jpeg',
    })
  })

  it('deve recusar tipos não suportados', () => {
    expect(detectAnexoTipo('text/plain', 'a.txt')).toEqual({
      ok: false,
      code: 'UNSUPPORTED_TYPE',
    })
    expect(detectAnexoTipo('application/msword', 'doc.docx')).toEqual({
      ok: false,
      code: 'UNSUPPORTED_TYPE',
    })
    expect(detectAnexoTipo('', 'arquivo.bin')).toEqual({
      ok: false,
      code: 'UNSUPPORTED_TYPE',
    })
  })
})

describe('pdfNeedsSizeWarning', () => {
  it('deve avisar a partir de ~2 MB', () => {
    expect(pdfNeedsSizeWarning(PDF_WARN_BYTES - 1)).toBe(false)
    expect(pdfNeedsSizeWarning(PDF_WARN_BYTES)).toBe(true)
    expect(pdfNeedsSizeWarning(PDF_WARN_BYTES + 1)).toBe(true)
  })
})
