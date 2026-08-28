import { expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import {
  acceptOnboarding,
  acceptOnboardingAndCreateCofre,
  acceptOnboardingCreateCofreAndOpenVeiculos,
  BACKUP_REMINDER_EDIT_THRESHOLD,
  openTab,
} from './helpers/onboarding'

test.describe('onboarding e backup', () => {
  test('primeiro acesso exige aceite antes de criar cofre', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('onboarding')).toBeVisible()
    await expect(page.getByTestId('cofre-create')).toHaveCount(0)
    // Ionic usa aria-disabled no host (não o disabled nativo do HTMLButton)
    await expect(page.getByTestId('onboarding-continue')).toHaveAttribute('aria-disabled', 'true')

    await page.getByTestId('onboarding-accept-checkbox').click()
    await expect(page.getByTestId('onboarding-continue')).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await page.getByTestId('onboarding-continue').click()

    await expect(page.getByTestId('onboarding')).toHaveCount(0)
    await expect(page.getByTestId('cofre-create')).toBeVisible()
    await page.getByTestId('cofre-create').click()
    await expect(page.getByTestId('cofre-meta')).toBeVisible()
    await expect(page.getByTestId('cofre-message')).toContainText(strings.cofre.createdOk)
  })

  test('retorno com cofre não repete onboarding completo e termo permanece consultável', async ({
    page,
  }) => {
    await page.goto('/')
    await acceptOnboardingAndCreateCofre(page)

    await page.reload()

    await openTab(page, 'config')
    await expect(page.getByTestId('onboarding')).toHaveCount(0)
    await expect(page.getByTestId('cofre-meta')).toBeVisible()
    await expect(page.getByTestId('termo-open')).toBeVisible()

    await page.getByTestId('termo-open').click()
    await expect(page.getByTestId('termo-modal-body')).toBeVisible()
    await page.getByTestId('termo-modal-close').click()
  })

  test('após N edições deve exibir lembrete não bloqueante e dispensar na sessão', async ({
    page,
  }) => {
    await page.goto('/')
    await acceptOnboardingCreateCofreAndOpenVeiculos(page)

    for (let i = 0; i < BACKUP_REMINDER_EDIT_THRESHOLD; i += 1) {
      if (i === 0) {
        await page.getByTestId('veiculo-empty-cta').click()
      } else {
        await page.getByTestId('veiculo-add').click()
      }
      await expect(page.getByTestId('veiculo-form')).toBeVisible()
      await page.getByTestId('veiculo-placa').locator('input').fill(`AAA1A${i}0`)
      await page.getByTestId('veiculo-marca-modelo').locator('input').fill(`Modelo ${i}`)
      await page
        .getByTestId('veiculo-km-atual')
        .locator('input')
        .fill(`${1000 + i}`)
      await page.getByTestId('veiculo-salvar').click()
      await expect(page.getByTestId('veiculos-list')).toBeVisible()
    }

    await expect(page.getByTestId('backup-reminder')).toBeVisible()
    // Lembrete não bloqueia o uso do app
    await expect(page.getByTestId('veiculos-list')).toBeVisible()
    await openTab(page, 'config')
    await expect(page.getByTestId('cofre-export')).toBeEnabled()
    await openTab(page, 'veiculos')

    await page.getByTestId('backup-reminder-dismiss').click()
    await expect(page.getByTestId('backup-reminder')).toHaveCount(0)

    // Sem spam na mesma sessão
    await page.getByTestId('veiculo-add').click()
    await page.getByTestId('veiculo-placa').locator('input').fill('ZZZ9Z99')
    await page.getByTestId('veiculo-marca-modelo').locator('input').fill('Extra')
    await page.getByTestId('veiculo-km-atual').locator('input').fill('1')
    await page.getByTestId('veiculo-salvar').click()
    await expect(page.getByTestId('backup-reminder')).toHaveCount(0)
  })

  test('onboarding explica gravação automática e dois locais de cópia', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(strings.onboarding.autoSaveTitle)).toBeVisible()
    await expect(page.getByText(strings.onboarding.backupTitle)).toBeVisible()
    await acceptOnboarding(page)
  })
})
