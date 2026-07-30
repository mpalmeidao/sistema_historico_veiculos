import type { AnexoMeta } from '../anexos'
import type { Manutencao } from '../manutencoes'
import type { Veiculo } from '../veiculos'
import { TERMO_ISENCAO_TEXTO, TERMO_ISENCAO_TITULO } from '../../shared/legal'
import type { ContentVersionMeta } from '../../storage'
import {
  displayAnoModelo,
  displayKm,
  displayOptionalText,
  displayPecasTrocadas,
  displayValor,
} from './formatRelatorio'
import {
  RelatorioDomainError,
  type RelatorioAnexoIndicacao,
  type RelatorioDados,
  type RelatorioManutencaoLinha,
} from './types'

export interface AnexoParaRelatorio {
  meta: AnexoMeta
  /** Bytes só necessários para miniatura de imagem. */
  bytes?: Uint8Array
}

export interface MontarRelatorioInput {
  veiculo: Veiculo
  manutencoes: Manutencao[]
  cofre: ContentVersionMeta
  /** Anexos indexados por manutencaoId (ordem de listagem preservada). */
  anexosByManutencao: ReadonlyMap<number, readonly AnexoParaRelatorio[]>
  geradoEm?: string
  isencaoTitulo?: string
  isencaoTexto?: string
}

function compareCronologicaAsc(a: Manutencao, b: Manutencao): number {
  if (a.data !== b.data) return a.data < b.data ? -1 : 1
  return a.id - b.id
}

function pickAnexoIndicacao(anexos: readonly AnexoParaRelatorio[]): RelatorioAnexoIndicacao {
  const imagem = anexos.find((item) => item.meta.mimeType.startsWith('image/'))
  if (imagem?.bytes && imagem.bytes.byteLength > 0) {
    return {
      kind: 'imagem',
      mimeType: imagem.meta.mimeType,
      bytes: imagem.bytes,
      fileName: imagem.meta.fileName,
    }
  }
  if (imagem) {
    // Meta de imagem sem bytes: trata como ausência de miniatura (não quebra).
    return { kind: 'nenhum' }
  }
  const pdf = anexos.find((item) => item.meta.mimeType === 'application/pdf')
  if (pdf) {
    return { kind: 'pdf', fileName: pdf.meta.fileName }
  }
  return { kind: 'nenhum' }
}

function mapLinha(
  manutencao: Manutencao,
  anexos: readonly AnexoParaRelatorio[],
): RelatorioManutencaoLinha {
  return {
    id: manutencao.id,
    data: manutencao.data,
    km: displayKm(manutencao.km),
    tipoServico: manutencao.tipoServico,
    pecasTrocadas: displayPecasTrocadas(manutencao.pecasTrocadas),
    oficina: displayOptionalText(manutencao.oficina),
    valor: displayValor(manutencao.valor),
    proximaRevisao: displayOptionalText(manutencao.proximaRevisao),
    anexo: pickAnexoIndicacao(anexos),
  }
}

/**
 * Monta o payload do relatório a partir dos dados do domínio.
 * Bloqueia veículo sem manutenções (MVP — sem PDF enganoso).
 */
export function montarRelatorioDados(input: MontarRelatorioInput): RelatorioDados {
  if (input.manutencoes.length === 0) {
    throw new RelatorioDomainError(
      'NO_MANUTENCOES',
      'Não há histórico de manutenções para exportar neste veículo.',
    )
  }

  const ordenadas = [...input.manutencoes].sort(compareCronologicaAsc)
  const primeira = ordenadas[0]
  const ultima = ordenadas[ordenadas.length - 1]

  return {
    veiculo: {
      placa: input.veiculo.placa,
      marcaModelo: input.veiculo.marcaModelo,
      anoModelo: displayAnoModelo(input.veiculo.anoModelo),
      kmAtual: displayKm(input.veiculo.kmAtual),
    },
    resumo: {
      totalManutencoes: ordenadas.length,
      periodoInicio: primeira.data,
      periodoFim: ultima.data,
      kmPrimeira: displayKm(primeira.km),
      kmUltima: displayKm(ultima.km),
    },
    manutencoes: ordenadas.map((item) =>
      mapLinha(item, input.anexosByManutencao.get(item.id) ?? []),
    ),
    cofre: input.cofre,
    geradoEm: input.geradoEm ?? new Date().toISOString(),
    isencaoTitulo: input.isencaoTitulo ?? TERMO_ISENCAO_TITULO,
    isencaoTexto: input.isencaoTexto ?? TERMO_ISENCAO_TEXTO,
  }
}
