import { describe, expect, it } from 'vitest'
import type { ManutencaoField } from '../../domain'
import {
  nextWizardStep,
  prevWizardStep,
  wizardStepForField,
  wizardStepForFieldErrors,
} from './wizardSteps'

describe('wizardSteps', () => {
  describe('nextWizardStep', () => {
    it('avança de 1 para 2 e de 2 para 3', () => {
      expect(nextWizardStep(1)).toBe(2)
      expect(nextWizardStep(2)).toBe(3)
    })

    it('não passa de 3', () => {
      expect(nextWizardStep(3)).toBe(3)
    })
  })

  describe('prevWizardStep', () => {
    it('volta de 3 para 2 e de 2 para 1', () => {
      expect(prevWizardStep(3)).toBe(2)
      expect(prevWizardStep(2)).toBe(1)
    })

    it('não fica abaixo de 1', () => {
      expect(prevWizardStep(1)).toBe(1)
    })
  })

  describe('wizardStepForField', () => {
    it.each<[ManutencaoField, 1 | 2 | 3]>([
      ['data', 2],
      ['km', 2],
      ['tipoServico', 2],
      ['oficina', 2],
      ['proximaRevisao', 2],
      ['veiculoId', 2],
      ['pecasTrocadas', 3],
      ['valor', 3],
    ])('campo %s mapeia para etapa %s', (field, step) => {
      expect(wizardStepForField(field)).toBe(step)
    })
  })

  describe('wizardStepForFieldErrors', () => {
    it('retorna etapa 3 quando não há erros', () => {
      expect(wizardStepForFieldErrors([])).toBe(3)
    })

    it('prioriza a etapa mais cedo quando há erros mistos', () => {
      expect(wizardStepForFieldErrors(['pecasTrocadas', 'data'])).toBe(2)
      expect(wizardStepForFieldErrors(['pecasTrocadas'])).toBe(3)
      expect(wizardStepForFieldErrors(['km', 'tipoServico'])).toBe(2)
    })
  })
})
