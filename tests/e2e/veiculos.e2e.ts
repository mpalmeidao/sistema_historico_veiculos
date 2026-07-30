import { expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import { acceptOnboardingCreateCofreAndOpenVeiculos, openTab } from './helpers/onboarding'

test.describe('veículos', () => {
  test('deve criar, editar e persistir veículo após reload', async ({ page }) => {
    await page.goto('/')

    await acceptOnboardingCreateCofreAndOpenVeiculos(page)
    await expect(page.getByTestId('veiculos-empty')).toBeVisible()
    await expect(page.getByTestId('veiculo-empty-cta')).toContainText(strings.veiculos.emptyCta)

    await page.getByTestId('veiculo-empty-cta').click()
    await expect(page.getByTestId('veiculo-form')).toBeVisible()

    await page.getByTestId('veiculo-placa').locator('input').fill('ABC1D23')
    await page.getByTestId('veiculo-marca-modelo').locator('input').fill('Fiat Uno')
    await page.getByTestId('veiculo-ano-modelo').locator('input').fill('2015')
    await page.getByTestId('veiculo-km-atual').locator('input').fill('45000')
    await page.getByTestId('veiculo-proxima-troca').locator('input').fill('2026-12-01')
    await page.getByTestId('veiculo-salvar').click()

    await expect(page.getByTestId('veiculos-list')).toBeVisible()
    await expect(page.getByTestId('veiculo-placa-1')).toHaveText('ABC1D23')
    await expect(page.getByTestId('veiculo-marca-1')).toHaveText('Fiat Uno')

    await page.getByTestId('veiculo-edit-1').click()
    await expect(page.getByTestId('veiculo-form')).toBeVisible()
    await page.getByTestId('veiculo-marca-modelo').locator('input').fill('Fiat Uno Attractive')
    await page.getByTestId('veiculo-km-atual').locator('input').fill('48000')
    await page.getByTestId('veiculo-salvar').click()

    await expect(page.getByTestId('veiculo-marca-1')).toHaveText('Fiat Uno Attractive')

    await page.reload()
    await openTab(page, 'veiculos')

    await expect(page.getByTestId('veiculos-list')).toBeVisible()
    await expect(page.getByTestId('veiculo-placa-1')).toHaveText('ABC1D23')
    await expect(page.getByTestId('veiculo-marca-1')).toHaveText('Fiat Uno Attractive')
    await expect(page.getByTestId('veiculo-item-1')).toContainText('48.000')
  })
})
