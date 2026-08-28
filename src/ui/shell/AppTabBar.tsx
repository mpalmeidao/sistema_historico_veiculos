import { IonIcon, IonLabel, IonTabBar, IonTabButton } from '@ionic/react'
import { carOutline, constructOutline, settingsOutline } from 'ionicons/icons'
import { strings } from '../../shared/i18n'
import type { AppTabId } from './tabs'

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

export interface AppTabBarProps {
  activeTab: AppTabId
  onTabChange: (tab: AppTabId) => void
}

/**
 * Navegação inferior mobile-first (sem React Router no MVP).
 * Sem slot="bottom": a barra vive no IonFooter; o slot é para IonTabs e bagunça o layout.
 * Item ativo: cor primária + ponto sob o rótulo (design system home).
 */
export function AppTabBar({ activeTab, onTabChange }: AppTabBarProps) {
  return (
    <IonTabBar data-testid="app-tab-bar" className="hvcf-tab-bar">
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
          <IonIcon icon={TAB_ICONS[tab]} aria-hidden="true" />
          <IonLabel>{TAB_LABELS[tab]}</IonLabel>
        </IonTabButton>
      ))}
    </IonTabBar>
  )
}
