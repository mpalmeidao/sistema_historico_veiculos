import type { ManutencaoField } from '../../domain'

/** Etapas do wizard Nova/Editar manutenção (1 = comprovante, 2 = dados, 3 = peças). */
export type ManutencaoWizardStep = 1 | 2 | 3

export const MANUTENCAO_WIZARD_MIN_STEP = 1 as const
export const MANUTENCAO_WIZARD_MAX_STEP = 3 as const

const STEP2_FIELDS: ReadonlySet<ManutencaoField> = new Set([
  'data',
  'km',
  'tipoServico',
  'oficina',
  'proximaRevisao',
  'veiculoId',
])

const STEP3_FIELDS: ReadonlySet<ManutencaoField> = new Set(['pecasTrocadas', 'valor'])

/**
 * Avança uma etapa, respeitando o limite superior (3).
 */
export function nextWizardStep(step: ManutencaoWizardStep): ManutencaoWizardStep {
  if (step >= MANUTENCAO_WIZARD_MAX_STEP) return MANUTENCAO_WIZARD_MAX_STEP
  return (step + 1) as ManutencaoWizardStep
}

/**
 * Volta uma etapa, respeitando o limite inferior (1).
 */
export function prevWizardStep(step: ManutencaoWizardStep): ManutencaoWizardStep {
  if (step <= MANUTENCAO_WIZARD_MIN_STEP) return MANUTENCAO_WIZARD_MIN_STEP
  return (step - 1) as ManutencaoWizardStep
}

/**
 * Mapeia campo de erro de domínio para a etapa do wizard onde o usuário deve corrigir.
 * Campos de anexos não geram field error de domínio.
 */
export function wizardStepForField(field: ManutencaoField): ManutencaoWizardStep {
  if (STEP3_FIELDS.has(field)) return 3
  if (STEP2_FIELDS.has(field)) return 2
  return 2
}

/**
 * Dado um conjunto de erros de campo, retorna a etapa mais cedo que precisa de atenção.
 */
export function wizardStepForFieldErrors(fields: readonly ManutencaoField[]): ManutencaoWizardStep {
  if (fields.length === 0) return MANUTENCAO_WIZARD_MAX_STEP
  let earliest: ManutencaoWizardStep = MANUTENCAO_WIZARD_MAX_STEP
  for (const field of fields) {
    const step = wizardStepForField(field)
    if (step < earliest) earliest = step
  }
  return earliest
}
