import { expect, type Page } from '@playwright/test'

/** Avança uma etapa do wizard de manutenção (Continuar). */
export async function wizardContinuar(page: Page) {
  await page.getByTestId('manutencao-continuar').click()
}

/**
 * Preenche a etapa 2 (dados) e avança para a etapa 3.
 * Assume que o formulário já está na etapa 2 (ou chama Continuar a partir da 1).
 */
export async function fillManutencaoDados(
  page: Page,
  fields: {
    data: string
    km: string
    tipoServico: string
    oficina?: string
    proximaRevisao?: string
  },
  options: { fromStep1?: boolean } = {},
) {
  if (options.fromStep1 !== false) {
    const onStep1 = await page
      .getByTestId('manutencao-wizard-step-1')
      .isVisible()
      .catch(() => false)
    if (onStep1) {
      await wizardContinuar(page)
    }
  }
  await expect(page.getByTestId('manutencao-wizard-step-2')).toBeVisible()
  await page.getByTestId('manutencao-data').locator('input').fill(fields.data)
  await page.getByTestId('manutencao-km').locator('input').fill(fields.km)
  await page.getByTestId('manutencao-tipo-servico').locator('input').fill(fields.tipoServico)
  if (fields.oficina !== undefined) {
    await page.getByTestId('manutencao-oficina').locator('input').fill(fields.oficina)
  }
  if (fields.proximaRevisao !== undefined) {
    await page
      .getByTestId('manutencao-proxima-revisao')
      .locator('input')
      .fill(fields.proximaRevisao)
  }
}

/** Avança da etapa 2 para a 3 (peças). */
export async function goToManutencaoPecas(page: Page) {
  await wizardContinuar(page)
  await expect(page.getByTestId('manutencao-wizard-step-3')).toBeVisible()
}

/**
 * Fluxo mínimo: da etapa 1 (ou 2) preenche dados obrigatórios, vai à etapa 3 e salva.
 */
export async function fillAndSaveManutencaoMinima(
  page: Page,
  fields: { data: string; km: string; tipoServico: string },
) {
  await fillManutencaoDados(page, fields)
  await goToManutencaoPecas(page)
  await page.getByTestId('manutencao-salvar').click()
}
