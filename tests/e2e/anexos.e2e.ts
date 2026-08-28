import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import { fillAndSaveManutencaoMinima } from './helpers/manutencaoWizard'
import { acceptOnboardingCreateCofreAndOpenVeiculos, openTab } from './helpers/onboarding'

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))
const imageFixture = path.join(fixtureDir, 'fixtures', 'nota-fiscal.jpg')

test.describe('anexos', () => {
  test('deve anexar imagem na criação, salvar e ver após reabrir', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('hvcf.ocrModel.v1', JSON.stringify({ downloadAcked: true }))
      ;(
        window as unknown as { __HVCF_MOCK_OCR__: (bytes: Uint8Array) => Promise<{ text: string }> }
      ).__HVCF_MOCK_OCR__ = async () => ({ text: '' })
    })
    await page.goto('/')

    await acceptOnboardingCreateCofreAndOpenVeiculos(page)

    await page.getByTestId('veiculo-empty-cta').click()
    await page.getByTestId('veiculo-placa').locator('input').fill('ABC1D23')
    await page.getByTestId('veiculo-marca-modelo').locator('input').fill('Fiat Uno')
    await page.getByTestId('veiculo-km-atual').locator('input').fill('45000')
    await page.getByTestId('veiculo-salvar').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()

    await page.getByTestId('veiculo-historico-1').click()
    await page.getByTestId('manutencao-empty-cta').click()
    await expect(page.getByTestId('anexos-section')).toBeVisible()
    await expect(page.getByTestId('anexo-add-gallery')).toBeVisible()

    await page.getByTestId('anexo-photo-input').setInputFiles(imageFixture)
    await expect(page.getByTestId('anexos-list')).toBeVisible({ timeout: 30_000 })

    await fillAndSaveManutencaoMinima(page, {
      data: '2026-01-15',
      km: '40000',
      tipoServico: 'Troca de óleo',
    })
    await expect(page.getByTestId('manutencoes-list')).toBeVisible()

    await page.getByTestId('manutencao-menu-1').click()
    await page.getByTestId('manutencao-edit-1').click()
    await expect(page.getByTestId('anexos-section')).toBeVisible()
    await expect(page.getByTestId('anexo-item-1')).toBeVisible()
    await expect(page.getByTestId('anexo-name-1')).toContainText('nota-fiscal')

    await page.getByTestId('anexo-view-1').click()
    await expect(page.getByTestId('anexo-preview-image')).toBeVisible()

    await page.reload()
    await openTab(page, 'veiculos')

    await page.getByTestId('veiculo-historico-1').click()
    await page.getByTestId('manutencao-menu-1').click()
    await page.getByTestId('manutencao-edit-1').click()
    await expect(page.getByTestId('anexo-item-1')).toBeVisible()
    await expect(page.getByTestId('anexo-name-1')).toContainText('nota-fiscal')
  })

  test('deve anexar imagem em edição e vê-la após reabrir', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('hvcf.ocrModel.v1', JSON.stringify({ downloadAcked: true }))
      ;(
        window as unknown as { __HVCF_MOCK_OCR__: (bytes: Uint8Array) => Promise<{ text: string }> }
      ).__HVCF_MOCK_OCR__ = async () => ({ text: '' })
    })
    await page.goto('/')

    await acceptOnboardingCreateCofreAndOpenVeiculos(page)

    await page.getByTestId('veiculo-empty-cta').click()
    await page.getByTestId('veiculo-placa').locator('input').fill('ABC1D23')
    await page.getByTestId('veiculo-marca-modelo').locator('input').fill('Fiat Uno')
    await page.getByTestId('veiculo-km-atual').locator('input').fill('45000')
    await page.getByTestId('veiculo-salvar').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()

    await page.getByTestId('veiculo-historico-1').click()
    await page.getByTestId('manutencao-empty-cta').click()
    await fillAndSaveManutencaoMinima(page, {
      data: '2026-01-15',
      km: '40000',
      tipoServico: 'Troca de óleo',
    })
    await expect(page.getByTestId('manutencoes-list')).toBeVisible()

    await page.getByTestId('manutencao-menu-1').click()
    await page.getByTestId('manutencao-edit-1').click()
    await expect(page.getByTestId('anexos-section')).toBeVisible()
    await expect(page.getByTestId('anexos-empty')).toBeVisible()

    await page.getByTestId('anexo-photo-input').setInputFiles(imageFixture)

    await expect(page.getByTestId('anexos-list')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByTestId('anexo-item-1')).toBeVisible()
    await expect(page.getByTestId('cofre-message')).toContainText(strings.anexos.savedOk)

    await page.getByTestId('anexo-view-1').click()
    await expect(page.getByTestId('anexo-preview-image')).toBeVisible()

    await page.reload()
    await openTab(page, 'veiculos')

    await page.getByTestId('veiculo-historico-1').click()
    await page.getByTestId('manutencao-menu-1').click()
    await page.getByTestId('manutencao-edit-1').click()
    await expect(page.getByTestId('anexo-item-1')).toBeVisible()
    await expect(page.getByTestId('anexo-name-1')).toContainText('nota-fiscal')

    await page.getByTestId('anexo-view-1').click()
    await expect(page.getByTestId('anexo-preview-image')).toBeVisible()
  })
})
