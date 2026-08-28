import { expect, test, type Page } from '@playwright/test'
import { strings } from '../../src/shared/i18n'
import {
  fillManutencaoDados,
  goToManutencaoPecas,
  wizardContinuar,
} from './helpers/manutencaoWizard'
import { acceptOnboardingCreateCofreAndOpenVeiculos, openTab } from './helpers/onboarding'

async function openManutencaoMenu(page: Page, id: number) {
  await page.getByTestId(`manutencao-menu-${id}`).click()
  await expect(page.getByTestId(`manutencao-edit-${id}`)).toBeVisible()
}

test.describe('manutenções', () => {
  test('deve criar, listar, editar e excluir manutenção no veículo', async ({ page }) => {
    await page.goto('/')

    await acceptOnboardingCreateCofreAndOpenVeiculos(page)

    await page.getByTestId('veiculo-empty-cta').click()
    await page.getByTestId('veiculo-placa').locator('input').fill('ABC1D23')
    await page.getByTestId('veiculo-marca-modelo').locator('input').fill('Fiat Uno')
    await page.getByTestId('veiculo-km-atual').locator('input').fill('45000')
    await page.getByTestId('veiculo-proxima-troca').locator('input').fill('Prevista em 50.000 km')
    await page.getByTestId('veiculo-salvar').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()

    await page.getByTestId('veiculo-historico-1').click()
    await expect(page.getByTestId('manutencoes-empty')).toBeVisible()
    await expect(page.getByTestId('manutencoes-veiculo-titulo')).toHaveText('ABC1D23')
    await expect(page.getByTestId('manutencoes-veiculo-marca')).toHaveText('Fiat Uno')
    await expect(page.getByTestId('manutencoes-stats')).toBeVisible()
    await expect(page.getByTestId('manutencoes-stat-km')).toContainText('45.000')
    await expect(page.getByTestId('manutencoes-stat-count')).toContainText('0')
    await expect(page.getByTestId('manutencoes-stat-total')).toContainText(
      strings.manutencoes.totalGastoAusente,
    )
    await expect(page.getByTestId('manutencoes-proxima-troca')).toContainText(
      'Prevista em 50.000 km',
    )
    await expect(page.getByTestId('manutencao-empty-cta')).toContainText(
      strings.manutencoes.emptyCta,
    )
    await expect(page.getByTestId('relatorio-gerar')).toHaveAttribute('aria-disabled', 'true')

    await page.getByTestId('manutencao-empty-cta').click()
    await expect(page.getByTestId('manutencao-form')).toBeVisible()
    await expect(page.getByTestId('header-back')).toBeVisible()
    await expect(page.getByTestId('manutencao-wizard-progress-label')).toContainText('1 de 3')
    await expect(page.getByTestId('manutencao-veiculo-context')).toContainText('ABC1D23')

    await fillManutencaoDados(page, {
      data: '2026-01-15',
      km: '40000',
      tipoServico: 'Troca de óleo',
      oficina: 'Oficina do Zé',
      proximaRevisao: '2026-07-15',
    })
    await goToManutencaoPecas(page)

    await page.getByTestId('manutencao-peca-add').click()
    await page.getByTestId('manutencao-peca-descricao-0').locator('input').fill('Filtro de óleo')
    await page.getByTestId('manutencao-peca-valor-0').locator('input').fill('50.50')
    await page.getByTestId('manutencao-peca-add').click()
    await page.getByTestId('manutencao-peca-descricao-1').locator('input').fill('Óleo 5W30')
    await page.getByTestId('manutencao-peca-valor-1').locator('input').fill('200')
    await expect(page.getByTestId('manutencao-valor')).toContainText('250,50')
    await page.getByTestId('manutencao-salvar').click()

    await expect(page.getByTestId('manutencoes-list')).toBeVisible()
    await expect(page.getByTestId('manutencao-data-1')).toHaveText('15 jan 2026')
    await expect(page.getByTestId('manutencao-tipo-1')).toHaveText('Troca de óleo')
    await expect(page.getByTestId('manutencao-badge-recente-1')).toHaveText(
      strings.manutencoes.maisRecente,
    )
    await expect(page.getByTestId('manutencoes-timeline-start')).toContainText(
      strings.manutencoes.inicioHistorico,
    )
    await expect(page.getByTestId('manutencao-item-1')).toContainText('250,50')
    await expect(page.getByTestId('manutencoes-stat-count')).toContainText('1')
    await expect(page.getByTestId('manutencao-add')).toBeVisible()

    await openManutencaoMenu(page, 1)
    await page.getByTestId('manutencao-edit-1').click()
    await expect(page.getByTestId('manutencao-form')).toBeVisible()
    await wizardContinuar(page)
    await expect(page.getByTestId('manutencao-wizard-step-2')).toBeVisible()
    await page
      .getByTestId('manutencao-tipo-servico')
      .locator('input')
      .fill('Troca de óleo e filtro')
    await page.getByTestId('manutencao-km').locator('input').fill('40100')
    await goToManutencaoPecas(page)
    await page.getByTestId('manutencao-salvar').click()

    await expect(page.getByTestId('manutencao-tipo-1')).toHaveText('Troca de óleo e filtro')
    await expect(page.getByTestId('manutencao-item-1')).toContainText('40.100')

    await page.getByTestId('header-back').click()
    await expect(page.getByTestId('veiculos-list')).toBeVisible()

    await page.reload()
    await openTab(page, 'veiculos')

    await page.getByTestId('veiculo-historico-1').click()
    await expect(page.getByTestId('manutencao-tipo-1')).toHaveText('Troca de óleo e filtro')
    await expect(page.getByTestId('manutencao-item-1')).toContainText('40.100')

    await openManutencaoMenu(page, 1)
    await page.getByTestId('manutencao-delete-1').click()
    await page
      .getByLabel(strings.manutencoes.deleteTitle)
      .getByRole('button', {
        name: strings.manutencoes.deleteConfirm,
      })
      .click()

    await expect(page.getByTestId('manutencoes-empty')).toBeVisible()

    await page.reload()
    await openTab(page, 'veiculos')
    await page.getByTestId('veiculo-historico-1').click()
    await expect(page.getByTestId('manutencoes-empty')).toBeVisible()
    await expect(page.getByTestId('manutencoes-proxima-troca')).toBeVisible()
  })
})
