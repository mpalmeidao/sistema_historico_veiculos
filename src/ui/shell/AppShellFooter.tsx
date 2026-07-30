import { IonFooter } from '@ionic/react'
import type { ReactNode } from 'react'
import { AdsBannerPlaceholder } from './AdsBannerPlaceholder'
import { AppTabBar } from './AppTabBar'
import type { AppTabId } from './tabs'

export interface AppShellFooterProps {
  activeTab: AppTabId
  onTabChange: (tab: AppTabId) => void
  /** Banner reservado — oculto em fluxos de cadastro. */
  showAds: boolean
  /** Tabs — ocultas no onboarding completo / gate de termo se desejado. */
  showTabs: boolean
}

export function AppShellFooter({ activeTab, onTabChange, showAds, showTabs }: AppShellFooterProps) {
  if (!showAds && !showTabs) return null

  return (
    <IonFooter data-testid="app-shell-footer">
      {showAds ? <AdsBannerPlaceholder /> : null}
      {showTabs ? <AppTabBar activeTab={activeTab} onTabChange={onTabChange} /> : null}
    </IonFooter>
  )
}

export interface AppShellChromeProps {
  children: ReactNode
}

/** Wrapper semântico; o IonPage fica na página. */
export function AppShellChrome({ children }: AppShellChromeProps) {
  return <div className="app-shell-chrome">{children}</div>
}
