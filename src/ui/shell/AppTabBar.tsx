import { IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/react'
import { archiveOutline, carOutline, constructOutline, settingsOutline } from 'ionicons/icons'
import { strings } from '../../shared/i18n'
import type { AppTabId } from './tabs'

const TAB_ICONS: Record<AppTabId, string> = {
  cofre: archiveOutline,
  veiculos: carOutline,
  manutencoes: constructOutline,
  config: settingsOutline,
}

const TAB_LABELS: Record<AppTabId, string> = {
  cofre: strings.shell.tabs.cofre,
  veiculos: strings.shell.tabs.veiculos,
  manutencoes: strings.shell.tabs.manutencoes,
  config: strings.shell.tabs.config,
}

export interface AppTabBarProps {
  activeTab: AppTabId
  onTabChange: (tab: AppTabId) => void
}

/**
 * Navegação inferior mobile-first (sem React Router no MVP).
 * IonTabButton + href="#" evita navegação real; onClick troca a área.
 */
export function AppTabBar({ activeTab, onTabChange }: AppTabBarProps) {
  return (
    <IonTabBar
      slot="bottom"
      data-testid="app-tab-bar"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {(Object.keys(TAB_ICONS) as AppTabId[]).map((tab) => (
        <IonTabButton
          key={tab}
          tab={tab}
          href="#"
          selected={activeTab === tab}
          data-testid={`tab-${tab}`}
          onClick={(event) => {
            event.preventDefault()
            onTabChange(tab)
          }}
        >
          <IonIcon icon={TAB_ICONS[tab]} />
          <IonLabel>{TAB_LABELS[tab]}</IonLabel>
        </IonTabButton>
      ))}
    </IonTabBar>
  )
}
