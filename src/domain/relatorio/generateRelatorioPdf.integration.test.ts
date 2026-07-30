import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { createAnexo } from '../anexos'
import { createManutencao } from '../manutencoes'
import { createVeiculo } from '../veiculos'
import { createCofreStorage, createMemoryWorkingStore } from '../../storage'
import { TERMO_ISENCAO_TITULO } from '../../shared/legal'
import { generateRelatorioPdf } from './generateRelatorioPdf'
import { gerarRelatorioVeiculo } from './gerarRelatorioVeiculo'
import { montarRelatorioDados } from './montarRelatorio'
import { minimalJpegBytes, minimalPdfBytes } from './testFixtures'
import { RelatorioDomainError } from './types'

async function openSession() {
  const storage = createCofreStorage({
    workingStore: createMemoryWorkingStore(),
    now: () => '2026-07-29T12:00:00.000Z',
  })
  return storage.createCofre()
}

describe('generateRelatorioPdf (integração)', () => {
  it('deve gerar PDF A4 com capa, tabela, detalhe e isenção', async () => {
    const jpeg = minimalJpegBytes()
    const dados = montarRelatorioDados({
      veiculo: {
        id: 1,
        placa: 'ABC1D23',
        marcaModelo: 'Fiat Uno',
        anoModelo: 2015,
        kmAtual: 45000,
        proximaTroca: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      manutencoes: [
        {
          id: 1,
          veiculoId: 1,
          data: '2025-06-01',
          km: 30000,
          tipoServico: 'Troca de oleo',
          pecasTrocadas: [{ descricao: 'Filtro', valor: 200 }],
          oficina: 'Oficina do Ze',
          valor: 200,
          proximaRevisao: '2025-12-01',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          veiculoId: 1,
          data: '2026-03-01',
          km: 42000,
          tipoServico: 'Freios',
          pecasTrocadas: [],
          oficina: null,
          valor: null,
          proximaRevisao: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      cofre: { contentVersion: 7, modifiedAt: '2026-07-29T12:00:00.000Z' },
      anexosByManutencao: new Map([
        [
          1,
          [
            {
              meta: {
                id: 1,
                manutencaoId: 1,
                mimeType: 'image/jpeg',
                fileName: 'nota.jpg',
                sizeBytes: jpeg.byteLength,
                createdAt: '2026-01-01T00:00:00.000Z',
              },
              bytes: jpeg,
            },
          ],
        ],
        [
          2,
          [
            {
              meta: {
                id: 2,
                manutencaoId: 2,
                mimeType: 'application/pdf',
                fileName: 'nota.pdf',
                sizeBytes: 32,
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            },
          ],
        ],
      ]),
      geradoEm: '2026-07-29T15:30:00.000Z',
    })

    const bytes = await generateRelatorioPdf(dados)
    const pdf = await PDFDocument.load(bytes)

    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1)
    const page = pdf.getPage(0)
    const size = page.getSize()
    // A4 em pontos: 595.28 × 841.89
    expect(size.width).toBeCloseTo(595.28, 0)
    expect(size.height).toBeCloseTo(841.89, 0)

    expect(pdf.getTitle()).toContain('ABC1D23')
    expect(pdf.getTitle()).toContain('Fiat Uno')
    expect(pdf.getSubject()).toContain('manutencoes=2')
    expect(pdf.getSubject()).toContain('cofre=7')
    expect(pdf.getSubject()).toContain('isencao=1')
    const keywords = pdf.getKeywords() ?? ''
    expect(keywords).toContain('ABC1D23')
    expect(keywords).toContain('Tabela cronologica')
    expect(keywords).toContain('PDF anexado')
    expect(keywords).toContain('miniatura-imagem')
    expect(keywords).toContain(TERMO_ISENCAO_TITULO)
  })

  it('deve gerar a partir do cofre com imagem e PDF sem falhar', async () => {
    const session = await openSession()
    const veiculo = await createVeiculo(session, {
      placa: 'XYZ9A88',
      marcaModelo: 'VW Gol',
      anoModelo: 2018,
      kmAtual: 60000,
      proximaTroca: null,
    })
    const m1 = await createManutencao(session, {
      veiculoId: veiculo.id,
      data: '2026-01-10',
      km: 55000,
      tipoServico: 'Revisao',
      pecasTrocadas: [{ descricao: 'Item', valor: 150 }],
      oficina: 'Oficina',
      proximaRevisao: null,
    })
    const m2 = await createManutencao(session, {
      veiculoId: veiculo.id,
      data: '2026-02-10',
      km: 58000,
      tipoServico: 'Pneus',
      pecasTrocadas: [],
      oficina: null,
      proximaRevisao: null,
    })

    await createAnexo(session, {
      manutencaoId: m1.id,
      mimeType: 'image/jpeg',
      fileName: 'foto.jpg',
      bytes: minimalJpegBytes(),
    })
    await createAnexo(session, {
      manutencaoId: m2.id,
      mimeType: 'application/pdf',
      fileName: 'nota.pdf',
      bytes: minimalPdfBytes(),
    })

    const versionBefore = session.getContentMeta().contentVersion

    const result = await gerarRelatorioVeiculo(session, veiculo.id, {
      deliver: false,
      geradoEm: '2026-07-29T16:00:00.000Z',
    })

    expect(result.bytes.byteLength).toBeGreaterThan(500)
    expect(result.filename).toMatch(/relatorio-XYZ9A88-20260729\.pdf/)
    expect(result.dados.resumo.totalManutencoes).toBe(2)

    const pdf = await PDFDocument.load(result.bytes)
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(1)
    expect(pdf.getTitle()).toContain('XYZ9A88')
    const keywords = pdf.getKeywords() ?? ''
    expect(keywords).toContain('PDF anexado')
    expect(keywords).toContain('miniatura-imagem')

    // Geração não corrompe / não grava no cofre
    expect(session.getContentMeta().contentVersion).toBe(versionBefore)

    session.close()
  })

  it('deve recusar veículo sem manutenções sem gerar PDF', async () => {
    const session = await openSession()
    const veiculo = await createVeiculo(session, {
      placa: 'EMP0T00',
      marcaModelo: 'Sem Historico',
      anoModelo: null,
      kmAtual: 0,
      proximaTroca: null,
    })

    await expect(
      gerarRelatorioVeiculo(session, veiculo.id, { deliver: false }),
    ).rejects.toMatchObject({
      code: 'NO_MANUTENCOES',
    } satisfies Partial<RelatorioDomainError>)

    session.close()
  })
})
