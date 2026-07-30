import type { CofreSession } from '../../storage'
import { getAnexo, listAnexosByManutencao } from '../anexos'
import { listManutencoesByVeiculo } from '../manutencoes'
import { getVeiculo } from '../veiculos'
import { buildRelatorioFilename, deliverRelatorioPdf } from './deliverRelatorioPdf'
import { generateRelatorioPdf } from './generateRelatorioPdf'
import { montarRelatorioDados, type AnexoParaRelatorio } from './montarRelatorio'
import { RelatorioDomainError, type RelatorioDados, type RelatorioProgress } from './types'

export interface GerarRelatorioVeiculoOptions {
  onProgress?: (progress: RelatorioProgress) => void
  /** Se false, só gera bytes sem download/share (testes). Default true. */
  deliver?: boolean
  geradoEm?: string
}

export interface GerarRelatorioVeiculoResult {
  dados: RelatorioDados
  bytes: Uint8Array
  filename: string
  delivery?: 'share' | 'download'
}

/**
 * Carrega veículo + manutenções + anexos (miniaturas), monta, gera PDF e entrega localmente.
 * Falha não escreve no cofre (somente leituras via query / getAnexo).
 */
export async function gerarRelatorioVeiculo(
  session: CofreSession,
  veiculoId: number,
  options: GerarRelatorioVeiculoOptions = {},
): Promise<GerarRelatorioVeiculoResult> {
  options.onProgress?.({ phase: 'montando', ratio: 0 })

  const veiculo = getVeiculo(session, veiculoId)
  if (!veiculo) {
    throw new RelatorioDomainError('VEICULO_NOT_FOUND', `Veículo ${veiculoId} não encontrado.`)
  }

  const manutencoes = listManutencoesByVeiculo(session, veiculoId)
  if (manutencoes.length === 0) {
    throw new RelatorioDomainError(
      'NO_MANUTENCOES',
      'Não há histórico de manutenções para exportar neste veículo.',
    )
  }

  const anexosByManutencao = new Map<number, AnexoParaRelatorio[]>()
  const total = manutencoes.length
  for (let i = 0; i < total; i++) {
    const manutencao = manutencoes[i]
    const metas = listAnexosByManutencao(session, manutencao.id)
    const prepared: AnexoParaRelatorio[] = []
    for (const meta of metas) {
      if (meta.mimeType.startsWith('image/')) {
        const full = getAnexo(session, meta.id)
        prepared.push({ meta, bytes: full?.bytes })
      } else {
        prepared.push({ meta })
      }
    }
    anexosByManutencao.set(manutencao.id, prepared)
    options.onProgress?.({
      phase: 'montando',
      ratio: (i + 1) / total,
    })
  }

  const dados = montarRelatorioDados({
    veiculo,
    manutencoes,
    cofre: session.getContentMeta(),
    anexosByManutencao,
    geradoEm: options.geradoEm,
  })

  const bytes = await generateRelatorioPdf(dados, {
    onProgress: options.onProgress,
  })

  const filename = buildRelatorioFilename(dados.veiculo.placa, dados.geradoEm)
  const shouldDeliver = options.deliver !== false

  if (!shouldDeliver) {
    return { dados, bytes, filename }
  }

  options.onProgress?.({ phase: 'entregando', ratio: null })
  const delivery = await deliverRelatorioPdf(bytes, filename)
  options.onProgress?.({ phase: 'entregando', ratio: 1 })

  return { dados, bytes, filename, delivery }
}
