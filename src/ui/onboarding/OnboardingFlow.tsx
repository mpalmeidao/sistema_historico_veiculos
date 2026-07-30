import { useState } from 'react'
import { IonButton, IonCheckbox, IonItem, IonLabel, IonText } from '@ionic/react'
import { TERMO_ISENCAO_PARAGRAFOS, TERMO_ISENCAO_TITULO } from '../../shared/legal'
import { strings } from '../../shared/i18n'

export interface OnboardingFlowProps {
  onAccept: () => void
}

export function OnboardingFlow({ onAccept }: OnboardingFlowProps) {
  const [accepted, setAccepted] = useState(false)

  return (
    <section data-testid="onboarding" aria-labelledby="onboarding-title">
      <h2 id="onboarding-title">{strings.onboarding.title}</h2>
      <p>{strings.onboarding.intro}</p>

      <h3>{strings.onboarding.autoSaveTitle}</h3>
      <p>{strings.onboarding.autoSaveBody}</p>

      <h3>{strings.onboarding.backupTitle}</h3>
      <p>{strings.onboarding.backupBody}</p>

      <h3>{strings.onboarding.howToExportTitle}</h3>
      <p data-testid="onboarding-export-hint">{strings.onboarding.howToExportBody}</p>

      <h3>{TERMO_ISENCAO_TITULO}</h3>
      <div data-testid="onboarding-termo">
        {TERMO_ISENCAO_PARAGRAFOS.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <IonItem lines="none">
        <IonCheckbox
          data-testid="onboarding-accept-checkbox"
          checked={accepted}
          onIonChange={(event) => setAccepted(event.detail.checked)}
          labelPlacement="end"
          justify="start"
        >
          <IonLabel className="ion-text-wrap">{strings.onboarding.acceptCheckbox}</IonLabel>
        </IonCheckbox>
      </IonItem>

      {!accepted && (
        <IonText color="medium">
          <p data-testid="onboarding-must-accept">{strings.onboarding.mustAccept}</p>
        </IonText>
      )}

      <IonButton
        data-testid="onboarding-continue"
        expand="block"
        disabled={!accepted}
        onClick={() => {
          if (!accepted) return
          onAccept()
        }}
      >
        {strings.onboarding.continue}
      </IonButton>

      <IonText color="medium">
        <p>{strings.onboarding.refuseHint}</p>
      </IonText>
    </section>
  )
}
