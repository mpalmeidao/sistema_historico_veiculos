import { expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import { acceptOnboardingAndCreateCofre, openTab } from './helpers/onboarding'

test.describe('landing comercial', () => {
  test('primeiro acesso mostra a landing sem tabs nem onboarding', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('landing')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings.landing.heroTitle)
    await expect(page.getByTestId('landing-cta-experimentar')).toBeVisible()
    await expect(page.getByTestId('landing-cta-ja-tenho-cofre')).toBeVisible()
    await expect(page.getByTestId('onboarding')).toHaveCount(0)
    await expect(page.getByTestId('app-tab-bar')).toHaveCount(0)
    await expect(page.getByTestId('app-sidebar')).toHaveCount(0)
  })

  test('Experimentar abre o onboarding na etapa 1 e Voltar retorna à landing', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('landing-cta-experimentar').click()

    await expect(page.getByTestId('onboarding-step-1')).toBeVisible()
    await expect(page.getByTestId('landing')).toHaveCount(0)

    await page.getByTestId('onboarding-voltar').click()
    await expect(page.getByTestId('landing')).toBeVisible()
    await expect(page.getByTestId('onboarding')).toHaveCount(0)
  })

  test('Já tenho um cofre abre só o termo e após aceite vai para Ajustes', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('landing-cta-ja-tenho-cofre').click()

    await expect(page.getByTestId('onboarding-step-3')).toBeVisible()
    await expect(page.getByTestId('onboarding-step-1')).toHaveCount(0)
    await expect(page.getByTestId('onboarding-step-2')).toHaveCount(0)

    await page.getByTestId('onboarding-voltar').click()
    await expect(page.getByTestId('landing')).toBeVisible()

    await page.getByTestId('landing-cta-ja-tenho-cofre').click()
    await page.getByTestId('onboarding-accept-checkbox').click()
    await page.getByTestId('onboarding-continue').click()

    await expect(page.getByTestId('landing')).toHaveCount(0)
    await expect(page.getByTestId('onboarding')).toHaveCount(0)
    await expect(page.getByTestId('cofre-create')).toBeVisible()
    await expect(page.getByTestId('cofre-import')).toBeVisible()
  })

  test('retorno com cofre existente não mostra a landing', async ({ page }) => {
    await page.goto('/')
    await acceptOnboardingAndCreateCofre(page)
    await openTab(page, 'veiculos')

    await page.reload()

    await expect(page.getByTestId('landing')).toHaveCount(0)
    await expect(page.getByTestId('onboarding')).toHaveCount(0)
    await expect(page.getByTestId('veiculos-section')).toBeVisible()
    await expect(page.getByTestId('veiculos-empty')).toBeVisible()
  })
})
