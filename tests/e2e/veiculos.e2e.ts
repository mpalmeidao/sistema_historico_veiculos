import { expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import { acceptOnboardingCreateCofreAndOpenVeiculos, openTab } from './helpers/onboarding'

async function openVeiculoMenu(page: import('@playwright/test').Page, id: number) {
  await page.getByTestId(`veiculo-menu-${id}`).click()
  await expect(page.getByTestId(`veiculo-edit-${id}`)).toBeVisible()
}

test.describe('veículos', () => {
  test('deve criar, editar e persistir veículo após reload', async ({ page }) => {
    await page.goto('/')

    await acceptOnboardingCreateCofreAndOpenVeiculos(page)
    await expect(page.getByTestId('veiculos-empty')).toBeVisible()
    await expect(page.getByTestId('veiculo-empty-cta')).toContainText(strings.veiculos.emptyCta)
    await expect(page.getByTestId('home-veiculos-title')).toHaveText(strings.home.meusVeiculos)
    await expect(page.getByTestId('home-stats')).toBeVisible()
    await expect(page.getByTestId('home-stat-veiculos')).toContainText('0')
    await expect(page.getByTestId('home-stat-manutencoes')).toContainText('0')
    await expect(page.getByTestId('home-trust-footer')).toContainText(strings.home.trustFooter)

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
    await expect(page.getByTestId('veiculo-ano-1')).toHaveText('2015')
    await expect(page.getByTestId('veiculo-proxima-troca-1')).toContainText('2026-12-01')
    await expect(page.getByTestId('home-stat-veiculos')).toContainText('1')
    await expect(page.getByTestId('veiculo-historico-1')).toContainText(
      strings.veiculos.openHistorico,
    )

    await openVeiculoMenu(page, 1)
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

  test('deve abrir histórico pela CTA do card e excluir via menu sem cascade', async ({ page }) => {
    await page.goto('/')
    await acceptOnboardingCreateCofreAndOpenVeiculos(page)

    await page.getByTestId('veiculo-empty-cta').click()
    await page.getByTestId('veiculo-placa').locator('input').fill('XYZ9H87')
    await page.getByTestId('veiculo-marca-modelo').locator('input').fill('Honda Civic')
    await page.getByTestId('veiculo-km-atual').locator('input').fill('1000')
    await page.getByTestId('veiculo-salvar').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()

    await page.getByTestId('veiculo-historico-1').click()
    await expect(page.getByTestId('tab-panel-manutencoes')).toBeVisible()
    await expect(page.getByTestId('tab-manutencoes')).toHaveClass(/tab-selected/)

    await page.getByTestId('header-back').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()
    await openVeiculoMenu(page, 1)
    await page.getByTestId('veiculo-delete-1').click()
    await page
      .getByLabel(strings.veiculos.deleteTitle)
      .getByRole('button', { name: strings.veiculos.deleteConfirm })
      .click()
    await expect(page.getByTestId('veiculos-empty')).toBeVisible()
  })

  test('deve excluir via menu com cascade quando há histórico', async ({ page }) => {
    await page.goto('/')
    await acceptOnboardingCreateCofreAndOpenVeiculos(page)

    await page.getByTestId('veiculo-empty-cta').click()
    await page.getByTestId('veiculo-placa').locator('input').fill('CAS1C01')
    await page.getByTestId('veiculo-marca-modelo').locator('input').fill('VW Gol')
    await page.getByTestId('veiculo-km-atual').locator('input').fill('5000')
    await page.getByTestId('veiculo-salvar').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()

    await page.getByTestId('veiculo-historico-1').click()
    await page.getByTestId('manutencao-empty-cta').click()
    await page.getByTestId('manutencao-data').locator('input').fill('2026-02-01')
    await page.getByTestId('manutencao-km').locator('input').fill('4800')
    await page.getByTestId('manutencao-tipo-servico').locator('input').fill('Revisão')
    await page.getByTestId('manutencao-salvar').click()
    await expect(page.getByTestId('manutencoes-list')).toBeVisible()

    await page.getByTestId('header-back').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()
    await expect(page.getByTestId('veiculo-manutencoes-count-1')).toContainText('1 manutenção')

    await openVeiculoMenu(page, 1)
    await page.getByTestId('veiculo-delete-1').click()
    await page
      .getByLabel(strings.veiculos.deleteWithHistoryTitle)
      .getByRole('button', { name: strings.veiculos.deleteWithHistoryConfirm })
      .click()
    await expect(page.getByTestId('veiculos-empty')).toBeVisible()
  })
})
