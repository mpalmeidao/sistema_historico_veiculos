export type {
  DeleteVeiculoOptions,
  ValidateVeiculoResult,
  Veiculo,
  VeiculoDomainErrorCode,
  VeiculoField,
  VeiculoFieldError,
  VeiculoFieldErrorCode,
  VeiculoInput,
  VeiculoRawInput,
} from './types'
export { VeiculoDomainError } from './types'
export { validateVeiculo } from './validateVeiculo'
export {
  countManutencoesByVeiculo,
  createVeiculo,
  deleteVeiculo,
  getVeiculo,
  listVeiculos,
  updateVeiculo,
} from './veiculosService'
