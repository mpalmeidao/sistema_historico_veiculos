import { expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import { acceptOnboardingCreateCofreAndOpenVeiculos, openTab } from './helpers/onboarding'

test.describe('manutenções', () => {
  test('deve criar, listar, editar e excluir manutenção no veículo', async ({ page }) => {
    await page.goto('/')

    await acceptOnboardingCreateCofreAndOpenVeiculos(page)

    await page.getByTestId('veiculo-empty-cta').click()
    await page.getByTestId('veiculo-placa').locator('input').fill('ABC1D23')
    await page.getByTestId('veiculo-marca-modelo').locator('input').fill('Fiat Uno')
    await page.getByTestId('veiculo-km-atual').locator('input').fill('45000')
    await page.getByTestId('veiculo-salvar').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()

    await page.getByTestId('veiculo-historico-1').click()
    await expect(page.getByTestId('manutencoes-empty')).toBeVisible()
    await expect(page.getByTestId('manutencao-empty-cta')).toContainText(
      strings.manutencoes.emptyCta,
    )

    await page.getByTestId('manutencao-empty-cta').click()
    await expect(page.getByTestId('manutencao-form')).toBeVisible()
    await expect(page.getByTestId('header-back')).toBeVisible()

    await page.getByTestId('manutencao-data').locator('input').fill('2026-01-15')
    await page.getByTestId('manutencao-km').locator('input').fill('40000')
    await page.getByTestId('manutencao-tipo-servico').locator('input').fill('Troca de óleo')

    await page.getByTestId('manutencao-peca-add').click()
    await page.getByTestId('manutencao-peca-descricao-0').locator('input').fill('Filtro de óleo')
    await page.getByTestId('manutencao-peca-valor-0').locator('input').fill('50.50')
    await page.getByTestId('manutencao-peca-add').click()
    await page.getByTestId('manutencao-peca-descricao-1').locator('input').fill('Óleo 5W30')
    await page.getByTestId('manutencao-peca-valor-1').locator('input').fill('200')

    await page.getByTestId('manutencao-oficina').locator('input').fill('Oficina do Zé')
    await page.getByTestId('manutencao-proxima-revisao').locator('input').fill('2026-07-15')
    await page.getByTestId('manutencao-salvar').click()

    await expect(page.getByTestId('manutencoes-list')).toBeVisible()
    await expect(page.getByTestId('manutencao-data-1')).toHaveText('2026-01-15')
    await expect(page.getByTestId('manutencao-tipo-1')).toHaveText('Troca de óleo')
    await expect(page.getByTestId('manutencao-item-1')).toContainText('250,50')

    await page.getByTestId('manutencao-edit-1').click()
    await expect(page.getByTestId('manutencao-form')).toBeVisible()
    await page
      .getByTestId('manutencao-tipo-servico')
      .locator('input')
      .fill('Troca de óleo e filtro')
    await page.getByTestId('manutencao-km').locator('input').fill('40100')
    await page.getByTestId('manutencao-salvar').click()

    await expect(page.getByTestId('manutencao-tipo-1')).toHaveText('Troca de óleo e filtro')
    await expect(page.getByTestId('manutencao-item-1')).toContainText('40.100')

    await page.getByTestId('header-back').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()

    await page.reload()
    await openTab(page, 'veiculos')

    await page.getByTestId('veiculo-historico-1').click()
    await expect(page.getByTestId('manutencao-tipo-1')).toHaveText('Troca de óleo e filtro')
    await expect(page.getByTestId('manutencao-item-1')).toContainText('40.100')

    await page.getByTestId('manutencao-delete-1').click()
    await page
      .getByLabel(strings.manutencoes.deleteTitle)
      .getByRole('button', {
        name: strings.manutencoes.deleteConfirm,
      })
      .click()

    await expect(page.getByTestId('manutencoes-empty')).toBeVisible()

    await page.reload()
    await openTab(page, 'veiculos')
    await page.getByTestId('veiculo-historico-1').click()
    await expect(page.getByTestId('manutencoes-empty')).toBeVisible()
  })
})
