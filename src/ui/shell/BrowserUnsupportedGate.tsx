import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import { strings } from '../../shared/i18n'

/** Tela bloqueante quando o navegador está abaixo do suporte mínimo (OPFS / Safari 16.4+). */
export function BrowserUnsupportedGate() {
  return (
    <IonPage data-testid="browser-unsupported">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{strings.appName}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <section className="hvcf-gate hvcf-content-col hvcf-content-col--form" aria-live="assertive">
          <p className="hvcf-gate__brand">{strings.appName}</p>
          <h1 className="hvcf-gate__title" data-testid="browser-unsupported-title">
            {strings.shell.unsupportedTitle}
          </h1>
          <p className="hvcf-gate__body" data-testid="browser-unsupported-body">
            {strings.shell.unsupportedBody}
          </p>
          <p className="hvcf-gate__browsers-label">{strings.shell.unsupportedBrowsersLabel}</p>
          <p className="hvcf-gate__browsers" data-testid="browser-unsupported-browsers">
            {strings.shell.unsupportedBrowsers}
          </p>
        </section>
      </IonContent>
    </IonPage>
  )
}
