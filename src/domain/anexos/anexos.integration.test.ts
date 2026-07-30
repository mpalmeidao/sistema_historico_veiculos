import { describe, expect, it } from 'vitest'
import { createCofreStorage, createMemoryWorkingStore } from '../../storage'
import { createManutencao } from '../manutencoes'
import { createVeiculo } from '../veiculos'
import { createAnexo, deleteAnexo, getAnexo, listAnexosByManutencao } from './anexosService'
import { MIME_JPEG, MIME_PDF } from './constants'
import { prepareAnexoFromFile } from './prepareAnexo'
import { AnexoDomainError } from './types'

async function seedManutencao() {
  const store = createMemoryWorkingStore()
  let tick = 0
  const storage = createCofreStorage({
    workingStore: store,
    now: () => `2026-07-29T12:00:0${tick++}.000Z`,
  })
  const session = await storage.createCofre()
  const veiculo = await createVeiculo(session, {
    placa: 'ABC1D23',
    marcaModelo: 'Fiat Uno',
    anoModelo: 2015,
    kmAtual: 45000,
    proximaTroca: null,
  })
  const manutencao = await createManutencao(session, {
    veiculoId: veiculo.id,
    data: '2026-01-15',
    km: 40000,
    tipoServico: 'Troca de óleo',
    pecasTrocadas: [],
    oficina: null,
    proximaRevisao: null,
  })
  return { storage, session, manutencao }
}

describe('anexos CRUD (integração domínio + storage)', () => {
  it('deve persistir imagem processada e PDF, reler bytes e remover', async () => {
    const { storage, session, manutencao } = await seedManutencao()
    const versionBefore = session.getContentMeta().contentVersion

    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9, 1, 2, 3])
    const image = await createAnexo(session, {
      manutencaoId: manutencao.id,
      mimeType: MIME_JPEG,
      fileName: 'nota.jpg',
      bytes: jpegBytes,
    })
    expect(image.id).toBeGreaterThan(0)
    expect(image.mimeType).toBe(MIME_JPEG)
    expect(image.sizeBytes).toBe(jpegBytes.byteLength)
    expect(session.getContentMeta().contentVersion).toBe(versionBefore + 1)

    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]) // %PDF-
    const pdf = await createAnexo(session, {
      manutencaoId: manutencao.id,
      mimeType: MIME_PDF,
      fileName: 'nota.pdf',
      bytes: pdfBytes,
    })
    expect(pdf.mimeType).toBe(MIME_PDF)

    const listed = listAnexosByManutencao(session, manutencao.id)
    expect(listed).toHaveLength(2)
    expect(listed.map((a) => a.mimeType)).toEqual([MIME_JPEG, MIME_PDF])

    const loadedImage = getAnexo(session, image.id)
    expect(loadedImage?.bytes).toEqual(jpegBytes)

    const loadedPdf = getAnexo(session, pdf.id)
    expect(loadedPdf?.bytes).toEqual(pdfBytes)

    const exported = storage.exportCofreBytes(session)
    session.close()

    const reopened = await storage.importCofre(exported, { replaceConfirmed: true })
    const afterImport = getAnexo(reopened, image.id)
    expect(afterImport?.bytes).toEqual(jpegBytes)
    expect(listAnexosByManutencao(reopened, manutencao.id)).toHaveLength(2)

    await deleteAnexo(reopened, image.id)
    expect(listAnexosByManutencao(reopened, manutencao.id)).toHaveLength(1)
    expect(getAnexo(reopened, image.id)).toBeNull()
    reopened.close()
  })

  it('deve recusar anexo em manutenção inexistente', async () => {
    const { session } = await seedManutencao()
    await expect(
      createAnexo(session, {
        manutencaoId: 99999,
        mimeType: MIME_JPEG,
        fileName: 'x.jpg',
        bytes: new Uint8Array([1]),
      }),
    ).rejects.toMatchObject({ code: 'MANUTENCAO_NOT_FOUND' })
    session.close()
  })
})

describe('prepareAnexoFromFile', () => {
  it('deve processar imagem via processador injetado e gravar só após sucesso', async () => {
    const prepared = await prepareAnexoFromFile(
      {
        name: 'nota.png',
        type: 'image/png',
        size: 12,
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
      },
      async () => ({
        bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
        width: 100,
        height: 80,
        mimeType: MIME_JPEG,
      }),
    )
    expect(prepared.mimeType).toBe(MIME_JPEG)
    expect(prepared.fileName).toBe('nota.jpg')
    expect(prepared.pdfNeedsSizeWarning).toBe(false)
    expect(prepared.bytes).toEqual(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))
  })

  it('deve manter PDF sem recompressão e sinalizar aviso se grande', async () => {
    const bytes = new Uint8Array(2 * 1024 * 1024)
    const prepared = await prepareAnexoFromFile({
      name: 'grande.pdf',
      type: 'application/pdf',
      size: bytes.byteLength,
      arrayBuffer: async () => bytes.buffer,
    })
    expect(prepared.mimeType).toBe(MIME_PDF)
    expect(prepared.bytes.byteLength).toBe(bytes.byteLength)
    expect(prepared.pdfNeedsSizeWarning).toBe(true)
  })

  it('deve falhar sem devolver payload quando o processador falha', async () => {
    await expect(
      prepareAnexoFromFile(
        {
          name: 'foto.jpg',
          type: 'image/jpeg',
          size: 4,
          arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
        },
        async () => {
          throw new Error('boom')
        },
      ),
    ).rejects.toBeInstanceOf(AnexoDomainError)

    await expect(
      prepareAnexoFromFile({
        name: 'doc.txt',
        type: 'text/plain',
        size: 1,
        arrayBuffer: async () => new Uint8Array([1]).buffer,
      }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_TYPE' })
  })

  it('deve importar → persistir → ler via storage (pipeline completo mockado)', async () => {
    const { session, manutencao } = await seedManutencao()
    const prepared = await prepareAnexoFromFile(
      {
        name: 'nota.webp',
        type: 'image/webp',
        size: 8,
        arrayBuffer: async () => new Uint8Array([9, 8, 7, 6]).buffer,
      },
      async (input) => {
        expect(input).toEqual(new Uint8Array([9, 8, 7, 6]))
        return {
          bytes: new Uint8Array([0xff, 0xd8, 0xaa]),
          width: 1600,
          height: 900,
          mimeType: MIME_JPEG,
        }
      },
    )

    const created = await createAnexo(session, {
      manutencaoId: manutencao.id,
      mimeType: prepared.mimeType,
      fileName: prepared.fileName,
      bytes: prepared.bytes,
    })
    const loaded = getAnexo(session, created.id)
    expect(loaded?.mimeType).toBe(MIME_JPEG)
    expect(loaded?.bytes).toEqual(new Uint8Array([0xff, 0xd8, 0xaa]))
    expect(loaded?.sizeBytes).toBe(3)
    session.close()
  })
})
