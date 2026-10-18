import { devices, expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import { acceptOnboarding, acceptOnboardingAndCreateCofre, openTab } from './helpers/onboarding'

test.describe('shell Ionic na rota raiz', () => {
  test('deve renderizar o shell Ionic com a landing no primeiro acesso', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('ion-app')).toBeVisible()
    await expect(page.locator('ion-app div.ion-page')).toBeVisible()
    await expect(page.getByTestId('landing')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings.landing.heroTitle)
    // Landing carrega a marca; header do shell fica oculto para não duplicar o título
    await expect(page.locator('ion-header')).toHaveCount(0)
  })

  test('deve navegar pelas tabs em viewport mobile e reservar ads fora do cadastro', async ({
    page,
  }) => {
    await page.setViewportSize(devices['iPhone 12'].viewport)
    await page.goto('/')

    await acceptOnboardingAndCreateCofre(page)

    await expect(page.getByTestId('app-tab-bar')).toBeVisible()
    await expect(page.getByTestId('app-sidebar')).toBeHidden()
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

  test('deve exibir sidebar no desktop e ocultar a tab bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    await acceptOnboardingAndCreateCofre(page)

    await expect(page.getByTestId('app-sidebar')).toBeVisible()
    await expect(page.getByTestId('sidebar-veiculos')).toBeVisible()
    await expect(page.getByTestId('sidebar-manutencoes')).toBeVisible()
    await expect(page.getByTestId('sidebar-config')).toBeVisible()
    await expect(page.getByTestId('app-tab-bar')).toBeHidden()

    await expect(page.getByTestId('ads-banner-placeholder')).toBeVisible()
    const adsBox = await page.getByTestId('ads-banner-placeholder').boundingBox()
    const sidebarBox = await page.getByTestId('app-sidebar').boundingBox()
    expect(adsBox).not.toBeNull()
    expect(sidebarBox).not.toBeNull()
    expect(adsBox!.x).toBeGreaterThanOrEqual(sidebarBox!.x + sidebarBox!.width - 1)

    await openTab(page, 'veiculos')
    await expect(page.getByTestId('tab-panel-veiculos')).toBeVisible()
    const listBox = await page.getByTestId('tab-panel-veiculos').boundingBox()
    expect(listBox).not.toBeNull()
    expect(listBox!.width).toBeGreaterThanOrEqual(720)
    expect(listBox!.width).toBeLessThanOrEqual(840)

    await openTab(page, 'manutencoes')
    await expect(page.getByTestId('manutencoes-pick-veiculo')).toBeVisible()
    await expect(page.getByTestId('shell-main-region')).toBeFocused()

    await openTab(page, 'config')
    await expect(page.getByTestId('tab-panel-config')).toBeVisible()

    await openTab(page, 'veiculos')
    await page.getByTestId('veiculo-empty-cta').click()
    await expect(page.getByTestId('veiculo-form')).toBeVisible()
    await expect(page.getByTestId('ads-banner-placeholder')).toHaveCount(0)
    const formPanel = page.getByTestId('tab-panel-veiculos-form')
    await expect(formPanel).toBeVisible()
    const formBox = await formPanel.boundingBox()
    expect(formBox).not.toBeNull()
    expect(formBox!.width).toBeGreaterThanOrEqual(560)
    expect(formBox!.width).toBeLessThanOrEqual(640)
  })

  test('deve avisar para criar um cofre nas abas Veículos e Manutenções', async ({ page }) => {
    await page.goto('/')
    await acceptOnboarding(page)

    await openTab(page, 'veiculos')
    const veiculosNotice = page.getByTestId('cofre-required')
    await expect(veiculosNotice).toBeVisible()
    await expect(veiculosNotice).toContainText(strings.cofre.requiredTitle)
    await expect(veiculosNotice).toContainText(strings.cofre.requiredBody)
    await expect(page.getByTestId('veiculos-empty')).toHaveCount(0)
    await expect(page.getByTestId('veiculo-form')).toHaveCount(0)

    await openTab(page, 'manutencoes')
    const manutencoesNotice = page.getByTestId('cofre-required')
    await expect(manutencoesNotice).toBeVisible()
    await expect(manutencoesNotice).toContainText(strings.cofre.requiredTitle)
    await expect(page.getByTestId('manutencoes-pick-veiculo')).toHaveCount(0)

    await page.getByTestId('cofre-required-cta').click()
    await expect(page.getByTestId('tab-panel-config')).toBeVisible()
    await expect(page.getByTestId('cofre-create')).toBeVisible()
    await expect(page.getByTestId('cofre-required')).toHaveCount(0)
  })

  test('deve ocultar sidebar e tab bar na landing e no onboarding em desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    await expect(page.getByTestId('landing')).toBeVisible()
    await expect(page.getByTestId('app-sidebar')).toHaveCount(0)
    await expect(page.getByTestId('app-tab-bar')).toHaveCount(0)

    await page.getByTestId('landing-cta-experimentar').click()
    await expect(page.getByTestId('onboarding')).toBeVisible()
    await expect(page.getByTestId('app-sidebar')).toHaveCount(0)
    await expect(page.getByTestId('app-tab-bar')).toHaveCount(0)
  })

  test('deve exibir aviso quando suporte mínimo for simulado como insuficiente', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      ;(
        window as unknown as { __HVCF_MOCK_MINIMUM_BROWSER__: boolean }
      ).__HVCF_MOCK_MINIMUM_BROWSER__ = false
    })

    await page.setViewportSize({ width: 1280, height: 800 })
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
    await expect(page.getByTestId('app-sidebar')).toHaveCount(0)
  })
})
