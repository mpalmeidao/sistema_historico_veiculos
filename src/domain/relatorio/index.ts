export {
  RELATORIO_VAZIO,
  RelatorioDomainError,
  type RelatorioAnexoIndicacao,
  type RelatorioDados,
  type RelatorioDomainErrorCode,
  type RelatorioManutencaoLinha,
  type RelatorioProgress,
  type RelatorioProgressPhase,
  type RelatorioResumoHistorico,
  type RelatorioVeiculoResumo,
} from './types'
export {
  displayAnoModelo,
  displayKm,
  displayOptionalNumber,
  displayOptionalText,
  displayValor,
  formatDateTimePtBr,
} from './formatRelatorio'
export {
  montarRelatorioDados,
  type AnexoParaRelatorio,
  type MontarRelatorioInput,
} from './montarRelatorio'
export { generateRelatorioPdf, type GenerateRelatorioPdfOptions } from './generateRelatorioPdf'
export {
  buildRelatorioFilename,
  deliverRelatorioPdf,
  downloadRelatorioPdf,
} from './deliverRelatorioPdf'
export {
  gerarRelatorioVeiculo,
  type GerarRelatorioVeiculoOptions,
  type GerarRelatorioVeiculoResult,
} from './gerarRelatorioVeiculo'
