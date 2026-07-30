import { PDFDocument, PageSizes, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { formatDateTimePtBr } from './formatRelatorio'
import { toPdfSafeText, wrapText } from './pdfText'
import type { RelatorioDados, RelatorioManutencaoLinha, RelatorioProgress } from './types'
import { RelatorioDomainError } from './types'

const MARGIN = 48
const FONT_SIZE = 10
const TITLE_SIZE = 16
const HEADING_SIZE = 12
const LINE_GAP = 4
const FOOTER_RESERVED = 72
const THUMB_MAX_W = 180
const THUMB_MAX_H = 120

export interface GenerateRelatorioPdfOptions {
  onProgress?: (progress: RelatorioProgress) => void
}

interface Layout {
  page: PDFPage
  y: number
  width: number
  height: number
  font: PDFFont
  fontBold: PDFFont
  contentWidth: number
}

function measure(font: PDFFont, text: string, size: number): number {
  return font.widthOfTextAtSize(text, size)
}

function ensureSpace(layout: Layout, needed: number, pdfDoc: PDFDocument): void {
  if (layout.y - needed < MARGIN + FOOTER_RESERVED) {
    layout.page = pdfDoc.addPage(PageSizes.A4)
    const { width, height } = layout.page.getSize()
    layout.width = width
    layout.height = height
    layout.y = height - MARGIN
  }
}

function drawLines(
  layout: Layout,
  pdfDoc: PDFDocument,
  lines: string[],
  size: number,
  font: PDFFont,
  options?: { color?: ReturnType<typeof rgb>; indent?: number },
): void {
  const lineHeight = size + LINE_GAP
  const x = MARGIN + (options?.indent ?? 0)
  for (const line of lines) {
    ensureSpace(layout, lineHeight, pdfDoc)
    layout.page.drawText(line, {
      x,
      y: layout.y - size,
      size,
      font,
      color: options?.color ?? rgb(0.1, 0.1, 0.1),
    })
    layout.y -= lineHeight
  }
}

function drawWrapped(
  layout: Layout,
  pdfDoc: PDFDocument,
  text: string,
  size: number,
  font: PDFFont,
  options?: { color?: ReturnType<typeof rgb>; indent?: number },
): void {
  const maxWidth = layout.contentWidth - (options?.indent ?? 0)
  const safe = toPdfSafeText(text)
  const lines = wrapText(safe, maxWidth, (line) => measure(font, line, size))
  drawLines(layout, pdfDoc, lines, size, font, options)
}

function drawHeading(layout: Layout, pdfDoc: PDFDocument, title: string): void {
  layout.y -= 8
  ensureSpace(layout, HEADING_SIZE + 10, pdfDoc)
  drawWrapped(layout, pdfDoc, title, HEADING_SIZE, layout.fontBold)
  layout.y -= 4
}

async function embedThumbnail(
  pdfDoc: PDFDocument,
  linha: RelatorioManutencaoLinha,
): Promise<{
  width: number
  height: number
  draw: (page: PDFPage, x: number, y: number) => void
} | null> {
  if (linha.anexo.kind !== 'imagem') return null
  const bytes = linha.anexo.bytes
  try {
    const image =
      linha.anexo.mimeType === 'image/png' || linha.anexo.mimeType.includes('png')
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes)
    const dims = image.scale(1)
    const scale = Math.min(THUMB_MAX_W / dims.width, THUMB_MAX_H / dims.height, 1)
    const width = dims.width * scale
    const height = dims.height * scale
    return {
      width,
      height,
      draw: (page, x, y) => {
        page.drawImage(image, { x, y, width, height })
      },
    }
  } catch {
    // Miniatura inválida não deve derrubar o relatório.
    return null
  }
}

/**
 * Gera PDF A4 (pdf-lib) a partir dos dados já montados.
 * Somente leitura — não altera o cofre.
 */
export async function generateRelatorioPdf(
  dados: RelatorioDados,
  options: GenerateRelatorioPdfOptions = {},
): Promise<Uint8Array> {
  options.onProgress?.({ phase: 'gerando', ratio: 0 })

  try {
    const pdfDoc = await PDFDocument.create()
    // Metadados ASCII-safe para inspeção em testes (conteúdo visual continua no corpo).
    pdfDoc.setTitle(
      toPdfSafeText(`Relatorio ${dados.veiculo.placa} - ${dados.veiculo.marcaModelo}`),
    )
    pdfDoc.setSubject(
      toPdfSafeText(
        `manutencoes=${dados.resumo.totalManutencoes};cofre=${dados.cofre.contentVersion};isencao=1`,
      ),
    )
    const keywords = [
      dados.veiculo.placa,
      'historico-manutencoes',
      'Tabela cronologica',
      dados.isencaoTitulo,
    ]
    if (dados.manutencoes.some((item) => item.anexo.kind === 'pdf')) {
      keywords.push('PDF anexado')
    }
    if (dados.manutencoes.some((item) => item.anexo.kind === 'imagem')) {
      keywords.push('miniatura-imagem')
    }
    pdfDoc.setKeywords(keywords.map((item) => toPdfSafeText(item)))
    pdfDoc.setCreator('Histórico de Veículos')
    pdfDoc.setProducer('pdf-lib')

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const firstPage = pdfDoc.addPage(PageSizes.A4)
    const { width, height } = firstPage.getSize()
    const layout: Layout = {
      page: firstPage,
      y: height - MARGIN,
      width,
      height,
      font,
      fontBold,
      contentWidth: width - MARGIN * 2,
    }

    // --- Capa / cabeçalho ---
    drawWrapped(layout, pdfDoc, 'Relatório de histórico de manutenções', TITLE_SIZE, fontBold)
    layout.y -= 8
    drawWrapped(layout, pdfDoc, `Placa: ${dados.veiculo.placa}`, FONT_SIZE, font)
    drawWrapped(layout, pdfDoc, `Marca / modelo: ${dados.veiculo.marcaModelo}`, FONT_SIZE, font)
    drawWrapped(layout, pdfDoc, `Ano / modelo: ${dados.veiculo.anoModelo}`, FONT_SIZE, font)
    drawWrapped(layout, pdfDoc, `Km atual: ${dados.veiculo.kmAtual} km`, FONT_SIZE, font)

    layout.y -= 6
    drawHeading(layout, pdfDoc, 'Resumo')
    drawWrapped(
      layout,
      pdfDoc,
      `Total de manutenções: ${dados.resumo.totalManutencoes}`,
      FONT_SIZE,
      font,
    )
    drawWrapped(
      layout,
      pdfDoc,
      `Período coberto: ${dados.resumo.periodoInicio} a ${dados.resumo.periodoFim}`,
      FONT_SIZE,
      font,
    )
    drawWrapped(
      layout,
      pdfDoc,
      `Km da primeira manutenção: ${dados.resumo.kmPrimeira} km`,
      FONT_SIZE,
      font,
    )
    drawWrapped(
      layout,
      pdfDoc,
      `Km da última manutenção: ${dados.resumo.kmUltima} km`,
      FONT_SIZE,
      font,
    )

    options.onProgress?.({ phase: 'gerando', ratio: 0.2 })

    // --- Tabela cronológica ---
    drawHeading(layout, pdfDoc, 'Tabela cronológica')
    const header = 'Data | Km | Tipo de serviço | Peças trocadas | Oficina | Valor'
    drawWrapped(layout, pdfDoc, header, 9, fontBold)

    for (const linha of dados.manutencoes) {
      const row = [
        linha.data,
        linha.km,
        linha.tipoServico,
        linha.pecasTrocadas,
        linha.oficina,
        linha.valor,
      ].join(' | ')
      drawWrapped(layout, pdfDoc, row, 9, font)
    }

    options.onProgress?.({ phase: 'gerando', ratio: 0.45 })

    // --- Detalhe por manutenção ---
    drawHeading(layout, pdfDoc, 'Detalhe por manutenção')

    const total = dados.manutencoes.length
    for (let i = 0; i < total; i++) {
      const linha = dados.manutencoes[i]
      layout.y -= 6
      drawWrapped(
        layout,
        pdfDoc,
        `${linha.data} — ${linha.tipoServico} (${linha.km} km)`,
        FONT_SIZE,
        fontBold,
      )
      drawWrapped(layout, pdfDoc, `Peças: ${linha.pecasTrocadas}`, FONT_SIZE, font)
      drawWrapped(layout, pdfDoc, `Oficina: ${linha.oficina}`, FONT_SIZE, font)
      drawWrapped(layout, pdfDoc, `Valor: ${linha.valor}`, FONT_SIZE, font)
      drawWrapped(layout, pdfDoc, `Próxima revisão: ${linha.proximaRevisao}`, FONT_SIZE, font)

      if (linha.anexo.kind === 'pdf') {
        drawWrapped(layout, pdfDoc, 'PDF anexado', FONT_SIZE, font, {
          color: rgb(0.25, 0.25, 0.25),
        })
      } else if (linha.anexo.kind === 'imagem') {
        const thumb = await embedThumbnail(pdfDoc, linha)
        if (thumb) {
          ensureSpace(layout, thumb.height + 8, pdfDoc)
          layout.y -= thumb.height
          thumb.draw(layout.page, MARGIN, layout.y)
          layout.y -= 8
        }
      }

      options.onProgress?.({
        phase: 'gerando',
        ratio: 0.45 + (0.4 * (i + 1)) / total,
      })
    }

    // --- Rodapé na última página (e metadados em todas via bloco final) ---
    layout.y -= 12
    drawHeading(layout, pdfDoc, 'Rodapé / isenção')
    drawWrapped(layout, pdfDoc, `Gerado em: ${formatDateTimePtBr(dados.geradoEm)}`, FONT_SIZE, font)
    drawWrapped(
      layout,
      pdfDoc,
      `Cofre — versão do conteúdo: ${dados.cofre.contentVersion}`,
      FONT_SIZE,
      font,
    )
    drawWrapped(
      layout,
      pdfDoc,
      `Cofre — última atualização: ${formatDateTimePtBr(dados.cofre.modifiedAt)}`,
      FONT_SIZE,
      font,
    )
    layout.y -= 6
    drawWrapped(layout, pdfDoc, dados.isencaoTitulo, FONT_SIZE, fontBold)
    drawWrapped(layout, pdfDoc, dados.isencaoTexto, 8, font)

    options.onProgress?.({ phase: 'gerando', ratio: 0.95 })
    const bytes = await pdfDoc.save()
    options.onProgress?.({ phase: 'gerando', ratio: 1 })
    return bytes
  } catch (error) {
    if (error instanceof RelatorioDomainError) throw error
    throw new RelatorioDomainError(
      'GENERATION_FAILED',
      error instanceof Error ? `Falha ao gerar o PDF: ${error.message}` : 'Falha ao gerar o PDF.',
    )
  }
}
