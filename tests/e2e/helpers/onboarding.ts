import { expect, type Page } from '@playwright/test'
import { BACKUP_REMINDER_EDIT_THRESHOLD } from '../../../src/shared/appPrefs'
import { strings } from '../../../src/shared/i18n'

export type ShellTab = 'veiculos' | 'manutencoes' | 'config'

/** Na landing de primeiro uso, segue o CTA Experimentar. */
export async function startOnboardingFromLanding(page: Page): Promise<void> {
  await expect(page.getByTestId('landing')).toBeVisible()
  await page.getByTestId('landing-cta-experimentar').click()
  await expect(page.getByTestId('onboarding')).toBeVisible()
}

/** Aceita o termo no onboarding completo (primeiro uso sem cofre). */
export async function acceptOnboarding(page: Page): Promise<void> {
  await startOnboardingFromLanding(page)
  await page.getByTestId('onboarding-continuar').click()
  await expect(page.getByTestId('onboarding-step-2')).toBeVisible()
  await expect(page.getByTestId('onboarding-export-hint')).toContainText(
    strings.onboarding.howToExportBody,
  )
  await page.getByTestId('onboarding-continuar').click()
  await expect(page.getByTestId('onboarding-step-3')).toBeVisible()
  // Ionic usa aria-disabled no host (não o disabled nativo do HTMLButton)
  await expect(page.getByTestId('onboarding-continue')).toHaveAttribute('aria-disabled', 'true')
  await page.getByTestId('onboarding-accept-checkbox').click()
  await page.getByTestId('onboarding-continue').click()
  await expect(page.getByTestId('cofre-create')).toBeVisible()
}

export async function openTab(page: Page, tab: ShellTab): Promise<void> {
  const sidebar = page.getByTestId('app-sidebar')
  const tabBar = page.getByTestId('app-tab-bar')
  // Após reload, ambos podem existir no DOM; esperar o que estiver de fato visível
  await expect
    .poll(async () => (await sidebar.isVisible()) || (await tabBar.isVisible()))
    .toBe(true)

  if (await sidebar.isVisible()) {
    await page.getByTestId(`sidebar-${tab}`).click()
    await expect(page.getByTestId(`sidebar-${tab}`)).toHaveAttribute('aria-current', 'page')
    return
  }

  await page.getByTestId(`tab-${tab}`).click()
  await expect(page.getByTestId(`tab-${tab}`)).toHaveClass(/tab-selected/)
}

export async function acceptOnboardingAndCreateCofre(page: Page): Promise<void> {
  await acceptOnboarding(page)
  await page.getByTestId('cofre-create').click()
  await expect(page.getByTestId('cofre-meta')).toBeVisible()
}

/** Após criar o cofre, abre a aba Veículos (lista fica nessa área do shell). */
export async function acceptOnboardingCreateCofreAndOpenVeiculos(page: Page): Promise<void> {
  await acceptOnboardingAndCreateCofre(page)
  await openTab(page, 'veiculos')
}

export { BACKUP_REMINDER_EDIT_THRESHOLD }
