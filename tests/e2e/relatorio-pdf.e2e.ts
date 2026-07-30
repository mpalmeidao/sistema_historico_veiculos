import { expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import { acceptOnboardingCreateCofreAndOpenVeiculos } from './helpers/onboarding'

test.describe('relatório PDF', () => {
  test('deve bloquear geração sem manutenções e baixar PDF com histórico', async ({ page }) => {
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
    await expect(page.getByTestId('relatorio-gerar')).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByTestId('relatorio-empty-hint')).toContainText(
      strings.relatorio.emptyHistory,
    )

    await page.getByTestId('manutencao-empty-cta').click()
    await page.getByTestId('manutencao-data').locator('input').fill('2026-01-15')
    await page.getByTestId('manutencao-km').locator('input').fill('40000')
    await page.getByTestId('manutencao-tipo-servico').locator('input').fill('Troca de oleo')
    await page.getByTestId('manutencao-salvar').click()
    await expect(page.getByTestId('manutencoes-list')).toBeVisible()

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 })
    await page.getByTestId('relatorio-gerar').click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/relatorio-ABC1D23-.*\.pdf/i)
    await expect(page.getByTestId('relatorio-message')).toContainText(strings.relatorio.success)
  })
})
