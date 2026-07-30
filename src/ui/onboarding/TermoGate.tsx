import { useState } from 'react'
import { IonButton, IonCheckbox, IonItem, IonLabel, IonText } from '@ionic/react'
import { TERMO_ISENCAO_PARAGRAFOS, TERMO_ISENCAO_TITULO } from '../../shared/legal'
import { strings } from '../../shared/i18n'

export interface TermoGateProps {
  onAccept: () => void
}

/**
 * Aceite leve quando já existe cofre de trabalho, mas o termo ainda não foi aceito
 * (ex.: upgrade do app). Não repete o onboarding completo.
 */
export function TermoGate({ onAccept }: TermoGateProps) {
  const [accepted, setAccepted] = useState(false)

  return (
    <section data-testid="termo-gate" aria-labelledby="termo-gate-title">
      <h2 id="termo-gate-title">{strings.termo.gateTitle}</h2>
      <p>{strings.termo.gateBody}</p>

      <h3>{TERMO_ISENCAO_TITULO}</h3>
      <div data-testid="termo-gate-body">
        {TERMO_ISENCAO_PARAGRAFOS.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <IonItem lines="none">
        <IonCheckbox
          data-testid="termo-gate-checkbox"
          checked={accepted}
          onIonChange={(event) => setAccepted(event.detail.checked)}
          labelPlacement="end"
          justify="start"
        >
          <IonLabel className="ion-text-wrap">{strings.onboarding.acceptCheckbox}</IonLabel>
        </IonCheckbox>
      </IonItem>

      <IonButton
        data-testid="termo-gate-accept"
        expand="block"
        disabled={!accepted}
        onClick={() => {
          if (!accepted) return
          onAccept()
        }}
      >
        {strings.termo.gateAccept}
      </IonButton>

      <IonText color="medium">
        <p>{strings.onboarding.refuseHint}</p>
      </IonText>
    </section>
  )
}
