import { IonIcon } from '@ionic/react'
import { carOutline, constructOutline, settingsOutline } from 'ionicons/icons'
import { strings } from '../../shared/i18n'
import { APP_TABS, type AppTabId } from './tabs'

const TAB_ICONS: Record<AppTabId, string> = {
  veiculos: carOutline,
  manutencoes: constructOutline,
  config: settingsOutline,
}

const TAB_LABELS: Record<AppTabId, string> = {
  veiculos: strings.shell.tabs.veiculos,
  manutencoes: strings.shell.tabs.manutencoes,
  config: strings.shell.tabs.config,
}

export interface AppSidebarProps {
  activeTab: AppTabId
  onTabChange: (tab: AppTabId) => void
}

/**
 * Navegação lateral no desktop (≥992px). Mesmas destinações da tab bar;
 * visibilidade controlada por CSS (oculta abaixo do breakpoint).
 */
export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  return (
    <nav
      data-testid="app-sidebar"
      className="hvcf-sidebar"
      aria-label={strings.shell.sidebarNavLabel}
    >
      <ul className="hvcf-sidebar__list">
        {APP_TABS.map((tab) => {
          const selected = activeTab === tab
          return (
            <li key={tab}>
              <button
                type="button"
                data-testid={`sidebar-${tab}`}
                className={
                  selected ? 'hvcf-sidebar__item hvcf-sidebar__item--active' : 'hvcf-sidebar__item'
                }
                aria-current={selected ? 'page' : undefined}
                onClick={() => onTabChange(tab)}
              >
                <IonIcon icon={TAB_ICONS[tab]} aria-hidden="true" />
                <span>{TAB_LABELS[tab]}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
