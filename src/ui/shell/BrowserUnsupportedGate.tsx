import { IonContent, IonHeader, IonPage, IonText, IonTitle, IonToolbar } from '@ionic/react'
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
        <section aria-live="assertive">
          <IonText color="danger">
            <h1 data-testid="browser-unsupported-title">{strings.shell.unsupportedTitle}</h1>
            <p data-testid="browser-unsupported-body">{strings.shell.unsupportedBody}</p>
          </IonText>
        </section>
      </IonContent>
    </IonPage>
  )
}
