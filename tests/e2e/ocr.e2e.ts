import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import { acceptOnboardingCreateCofreAndOpenVeiculos } from './helpers/onboarding'

const fixtureDir = path.dirname(fileURLToPath(import.meta.url))
const imageFixture = path.join(fixtureDir, 'fixtures', 'nota-fiscal.jpg')

const MOCK_OCR_TEXT = `
Razão Social: Oficina do Zé Ltda
Data: 15/01/2026
Km: 40.000
Tipo de serviço: Troca de óleo
Peças: Filtro de óleo
Valor total: R$ 250,50
Próxima revisão: 15/07/2026
`

async function gotoWithOcrMock(
  page: import('@playwright/test').Page,
  options: { fail?: boolean; acked?: boolean } = {},
) {
  const fail = options.fail ?? false
  const acked = options.acked ?? true

  await page.addInitScript(
    ({ fail: shouldFail, acked: alreadyAcked, text }) => {
      if (alreadyAcked) {
        localStorage.setItem('hvcf.ocrModel.v1', JSON.stringify({ downloadAcked: true }))
      } else {
        localStorage.removeItem('hvcf.ocrModel.v1')
      }
      ;(
        window as unknown as { __HVCF_MOCK_OCR__: (bytes: Uint8Array) => Promise<{ text: string }> }
      ).__HVCF_MOCK_OCR__ = async () => {
        if (shouldFail) {
          throw new Error('failed to fetch traineddata')
        }
        return { text }
      }
    },
    { fail, acked, text: MOCK_OCR_TEXT },
  )

  await page.goto('/')
}

async function openNovaManutencao(page: import('@playwright/test').Page) {
  await acceptOnboardingCreateCofreAndOpenVeiculos(page)

  await page.getByTestId('veiculo-empty-cta').click()
  await page.getByTestId('veiculo-placa').locator('input').fill('ABC1D23')
  await page.getByTestId('veiculo-marca-modelo').locator('input').fill('Fiat Uno')
  await page.getByTestId('veiculo-km-atual').locator('input').fill('45000')
  await page.getByTestId('veiculo-salvar').click()
  await expect(page.getByTestId('veiculos-list')).toBeVisible()

  await page.getByTestId('veiculo-historico-1').click()
  await page.getByTestId('manutencao-empty-cta').click()
  await expect(page.getByTestId('manutencao-form')).toBeVisible()
  await expect(page.getByTestId('ocr-section')).toBeVisible()
}

test.describe('OCR', () => {
  test('deve anexar fluxo OCR → revisar → salvar', async ({ page }) => {
    await gotoWithOcrMock(page, { acked: true })
    await openNovaManutencao(page)

    await page.getByTestId('ocr-image-input').setInputFiles(imageFixture)

    await expect(page.getByTestId('ocr-feedback')).toContainText(strings.ocr.appliedOk, {
      timeout: 15_000,
    })
    await expect(page.getByTestId('manutencao-data').locator('input')).toHaveValue('2026-01-15')
    await expect(page.getByTestId('manutencao-km').locator('input')).toHaveValue('40000')
    await expect(page.getByTestId('manutencao-tipo-servico').locator('input')).toHaveValue(
      'Troca de óleo',
    )

    await page
      .getByTestId('manutencao-tipo-servico')
      .locator('input')
      .fill('Troca de óleo (revisado)')
    await page.getByTestId('manutencao-salvar').click()

    await expect(page.getByTestId('manutencoes-list')).toBeVisible()
    await expect(page.getByTestId('manutencao-tipo-1')).toHaveText('Troca de óleo (revisado)')
  })

  test('deve permitir salvar manualmente quando OCR falha', async ({ page }) => {
    await gotoWithOcrMock(page, { fail: true, acked: true })
    await openNovaManutencao(page)

    await page.getByTestId('ocr-image-input').setInputFiles(imageFixture)

    await expect(page.getByLabel(strings.ocr.title)).toBeVisible({ timeout: 15_000 })
    await page
      .getByLabel(strings.ocr.title)
      .getByRole('button', { name: strings.ocr.continueManual })
      .click()

    await page.getByTestId('manutencao-data').locator('input').fill('2026-02-10')
    await page.getByTestId('manutencao-km').locator('input').fill('41000')
    await page.getByTestId('manutencao-tipo-servico').locator('input').fill('Manual após falha')
    await page.getByTestId('manutencao-salvar').click()

    await expect(page.getByTestId('manutencoes-list')).toBeVisible()
    await expect(page.getByTestId('manutencao-tipo-1')).toHaveText('Manual após falha')
  })
})
