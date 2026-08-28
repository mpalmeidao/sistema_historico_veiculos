import { expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { acceptOnboardingAndCreateCofre, openTab } from './helpers/onboarding'

test.describe('cofre storage', () => {
  test('deve criar cofre, persistir após reload e round-trip export/import', async ({ page }) => {
    await page.goto('/')

    await acceptOnboardingAndCreateCofre(page)
    await expect(page.getByTestId('cofre-content-version')).toHaveText('1')
    await expect(page.getByTestId('cofre-message')).toContainText(strings.cofre.createdOk)

    await page.reload()

    await openTab(page, 'config')
    await expect(page.getByTestId('cofre-meta')).toBeVisible()
    await expect(page.getByTestId('cofre-content-version')).toHaveText('1')

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('cofre-export').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.cofre$/)

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cofre-e2e-'))
    const exportPath = path.join(tempDir, download.suggestedFilename())
    await download.saveAs(exportPath)

    // Cria outro cofre para forçar confirmação de substituição no import
    await page.getByTestId('cofre-create').click()
    await expect(page.getByTestId('cofre-content-version')).toHaveText('1')

    page.once('dialog', (dialog) => {
      // Ionic Alert não usa window.dialog — tratado via botões do alert
      void dialog.dismiss().catch(() => undefined)
    })

    await page.getByTestId('cofre-import-input').setInputFiles(exportPath)

    const replaceConfirm = page.getByRole('button', {
      name: strings.cofre.replaceConfirm,
    })
    await expect(replaceConfirm).toBeVisible()
    await replaceConfirm.click()

    await expect(page.getByTestId('cofre-message')).toContainText(strings.cofre.importedOk)
    await expect(page.getByTestId('cofre-content-version')).toHaveText('1')

    fs.rmSync(tempDir, { recursive: true, force: true })
  })
})
