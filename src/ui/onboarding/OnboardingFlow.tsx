import { useEffect, useRef, useState } from 'react'
import { IonButton, IonCheckbox, IonIcon, IonItem, IonLabel, IonText } from '@ionic/react'
import {
  carOutline,
  cloudUploadOutline,
  documentOutline,
  phonePortraitOutline,
  constructOutline,
  timeOutline,
} from 'ionicons/icons'
import { TERMO_ISENCAO_PARAGRAFOS } from '../../shared/legal'
import { strings } from '../../shared/i18n'

export interface OnboardingFlowProps {
  onAccept: () => void
  /** Voltar à landing (etapa 1 do fluxo completo, ou etapa 3 no caminho só-termo). */
  onExit?: () => void
  /** Etapa inicial: 1 = onboarding completo; 3 = só termo (Já tenho um cofre). */
  initialStep?: OnboardingStep
}

type OnboardingStep = 1 | 2 | 3

function progressLabel(step: OnboardingStep): string {
  return strings.onboarding.progressLabel
    .replace('{{current}}', String(step))
    .replace('{{total}}', '3')
}

export function OnboardingFlow({ onAccept, onExit, initialStep = 1 }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>(initialStep)
  const [accepted, setAccepted] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const enteredAtTermoOnly = initialStep === 3

  useEffect(() => {
    titleRef.current?.focus()
  }, [step])

  function handleBackFromStep1() {
    onExit?.()
  }

  function handleBackFromStep3() {
    if (enteredAtTermoOnly) {
      onExit?.()
      return
    }
    setStep(2)
  }

  return (
    <section
      data-testid="onboarding"
      className="hvcf-onboarding"
      aria-labelledby="onboarding-title"
    >
      <div
        className="hvcf-wizard__progress"
        data-testid="onboarding-progress"
        role="group"
        aria-label={progressLabel(step)}
      >
        <p className="hvcf-wizard__progress-label">{progressLabel(step)}</p>
        <div className="hvcf-wizard__progress-track" aria-hidden="true">
          {([1, 2, 3] as const).map((dot) => (
            <span
              key={dot}
              className={[
                'hvcf-wizard__progress-dot',
                dot === step ? 'hvcf-wizard__progress-dot--active' : '',
                dot < step ? 'hvcf-wizard__progress-dot--done' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="hvcf-onboarding__panel" data-testid="onboarding-step-1">
          <h2 id="onboarding-title" ref={titleRef} className="hvcf-onboarding__title" tabIndex={-1}>
            {strings.onboarding.welcomeTitle}
          </h2>
          <p className="hvcf-onboarding__body">{strings.onboarding.welcomeBody}</p>
          <ol className="hvcf-onboarding-flow" aria-label={strings.onboarding.welcomeTitle}>
            <li>
              <IonIcon icon={carOutline} aria-hidden="true" />
              <span>{strings.onboarding.flowVehicle}</span>
            </li>
            <li>
              <IonIcon icon={timeOutline} aria-hidden="true" />
              <span>{strings.onboarding.flowHistorico}</span>
            </li>
            <li>
              <IonIcon icon={constructOutline} aria-hidden="true" />
              <span>{strings.onboarding.flowManutencao}</span>
            </li>
          </ol>
          <div className="hvcf-wizard__actions">
            <IonButton
              data-testid="onboarding-continuar"
              className="hvcf-wizard__cta"
              expand="block"
              onClick={() => setStep(2)}
            >
              {strings.onboarding.continueStep}
            </IonButton>
            {onExit ? (
              <IonButton
                data-testid="onboarding-voltar"
                className="hvcf-wizard__cta--secondary"
                fill="outline"
                expand="block"
                onClick={handleBackFromStep1}
              >
                {strings.shell.back}
              </IonButton>
            ) : null}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="hvcf-onboarding__panel" data-testid="onboarding-step-2">
          <h2 id="onboarding-title" ref={titleRef} className="hvcf-onboarding__title" tabIndex={-1}>
            {strings.onboarding.dataTitle}
          </h2>
          <h3 className="hvcf-onboarding__block-title">{strings.onboarding.autoSaveTitle}</h3>
          <p className="hvcf-onboarding__body">{strings.onboarding.autoSaveBody}</p>
          <h3 className="hvcf-onboarding__block-title">{strings.onboarding.backupTitle}</h3>
          <p className="hvcf-onboarding__body">{strings.onboarding.backupBody}</p>
          <p className="hvcf-onboarding__body" data-testid="onboarding-export-hint">
            {strings.onboarding.howToExportBody}
          </p>
          <ol className="hvcf-onboarding-flow" aria-hidden="true">
            <li>
              <IonIcon icon={phonePortraitOutline} aria-hidden="true" />
              <span>{strings.onboarding.flowDevice}</span>
            </li>
            <li>
              <IonIcon icon={documentOutline} aria-hidden="true" />
              <span>{strings.onboarding.flowCofre}</span>
            </li>
            <li>
              <IonIcon icon={cloudUploadOutline} aria-hidden="true" />
              <span>{strings.onboarding.flowBackup}</span>
            </li>
          </ol>
          <div className="hvcf-wizard__actions">
            <IonButton
              data-testid="onboarding-continuar"
              className="hvcf-wizard__cta"
              expand="block"
              onClick={() => setStep(3)}
            >
              {strings.onboarding.continueStep}
            </IonButton>
            <IonButton
              data-testid="onboarding-voltar"
              className="hvcf-wizard__cta--secondary"
              fill="outline"
              expand="block"
              onClick={() => setStep(1)}
            >
              {strings.shell.back}
            </IonButton>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="hvcf-onboarding__panel" data-testid="onboarding-step-3">
          <h2 id="onboarding-title" ref={titleRef} className="hvcf-onboarding__title" tabIndex={-1}>
            {strings.onboarding.beforeStartTitle}
          </h2>
          <div className="hvcf-termo-scroll" data-testid="onboarding-termo">
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

          <div className="hvcf-wizard__actions">
            <IonButton
              data-testid="onboarding-continue"
              className="hvcf-wizard__cta"
              expand="block"
              disabled={!accepted}
              onClick={() => {
                if (!accepted) return
                onAccept()
              }}
            >
              {strings.onboarding.continue}
            </IonButton>
            <IonButton
              data-testid="onboarding-voltar"
              className="hvcf-wizard__cta--secondary"
              fill="outline"
              expand="block"
              onClick={handleBackFromStep3}
            >
              {strings.shell.back}
            </IonButton>
          </div>

          <IonText color="medium">
            <p>{strings.onboarding.refuseHint}</p>
          </IonText>
        </div>
      )}
    </section>
  )
}
