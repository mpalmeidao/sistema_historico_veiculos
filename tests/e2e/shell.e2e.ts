import { devices, expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import { acceptOnboardingAndCreateCofre, openTab } from './helpers/onboarding'

test.describe('shell Ionic na rota raiz', () => {
  test('deve renderizar o shell Ionic com título do app', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('ion-app')).toBeVisible()
    await expect(page.locator('ion-app div.ion-page')).toBeVisible()
    await expect(page.locator('ion-header')).toBeVisible()
    await expect(page.locator('ion-header ion-title')).toHaveText(strings.home.title)
  })

  test('deve navegar pelas tabs em viewport mobile e reservar ads fora do cadastro', async ({
    page,
  }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport)
    await page.goto('/')

    await acceptOnboardingAndCreateCofre(page)

    await expect(page.getByTestId('app-tab-bar')).toBeVisible()
    await expect(page.getByTestId('tab-cofre')).toHaveCount(0)
    await expect(page.getByTestId('ads-banner-placeholder')).toBeVisible()
    await expect(page.getByTestId('ads-banner-placeholder')).toHaveText(
      strings.shell.adsPlaceholder,
    )

    await openTab(page, 'veiculos')
    await expect(page.getByTestId('tab-panel-veiculos')).toBeVisible()
    await expect(page.getByTestId('veiculos-empty')).toBeVisible()
    await expect(page.getByTestId('tab-veiculos')).toHaveClass(/tab-selected/)
    await expect(page.getByTestId('ads-banner-placeholder')).toBeVisible()

    await openTab(page, 'manutencoes')
    await expect(page.getByTestId('manutencoes-pick-veiculo')).toBeVisible()

    await openTab(page, 'config')
    await expect(page.getByTestId('tab-panel-config')).toBeVisible()
    await expect(page.getByTestId('cofre-export')).toBeVisible()

    await openTab(page, 'veiculos')
    await page.getByTestId('veiculo-empty-cta').click()
    await expect(page.getByTestId('veiculo-form')).toBeVisible()
    await expect(page.getByTestId('ads-banner-placeholder')).toHaveCount(0)
  })

  test('deve exibir aviso quando suporte mínimo for simulado como insuficiente', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      ;(
        window as unknown as { __HVCF_MOCK_MINIMUM_BROWSER__: boolean }
      ).__HVCF_MOCK_MINIMUM_BROWSER__ = false
    })

    await page.goto('/')

    await expect(page.getByTestId('browser-unsupported')).toBeVisible()
    await expect(page.getByTestId('browser-unsupported-title')).toHaveText(
      strings.shell.unsupportedTitle,
    )
    await expect(page.getByTestId('browser-unsupported-body')).toContainText(
      strings.shell.unsupportedBody,
    )
    await expect(page.getByTestId('cofre-create')).toHaveCount(0)
    await expect(page.getByTestId('app-tab-bar')).toHaveCount(0)
  })
})
