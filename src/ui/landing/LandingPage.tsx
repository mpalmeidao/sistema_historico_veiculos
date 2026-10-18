import { useEffect, useRef } from 'react'
import { IonButton, IonIcon } from '@ionic/react'
import {
  cameraOutline,
  carOutline,
  documentTextOutline,
  folderOpenOutline,
  lockClosedOutline,
  phonePortraitOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'
import { strings } from '../../shared/i18n'
import type { LandingCta } from './resolveLandingIntent'

export interface LandingPageProps {
  onCta: (cta: LandingCta) => void
}

export function LandingPage({ onCta }: LandingPageProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <article data-testid="landing" className="hvcf-landing" aria-labelledby="landing-title">
      <header className="hvcf-landing__hero">
        <p className="hvcf-landing__brand">{strings.landing.brand}</p>
        <h1 id="landing-title" ref={titleRef} className="hvcf-landing__title" tabIndex={-1}>
          {strings.landing.heroTitle}
        </h1>
        <p className="hvcf-landing__lead">{strings.landing.heroBody}</p>
        <div className="hvcf-landing__actions">
          <IonButton
            data-testid="landing-cta-experimentar"
            className="hvcf-landing__cta"
            expand="block"
            onClick={() => onCta('experimentar')}
          >
            {strings.landing.ctaExperimentar}
          </IonButton>
          <IonButton
            data-testid="landing-cta-ja-tenho-cofre"
            className="hvcf-landing__cta hvcf-landing__cta--secondary"
            fill="outline"
            expand="block"
            onClick={() => onCta('ja-tenho-cofre')}
          >
            {strings.landing.ctaJaTenhoCofre}
          </IonButton>
        </div>
      </header>

      <section className="hvcf-landing__section" aria-labelledby="landing-problem-title">
        <h2 id="landing-problem-title" className="hvcf-landing__section-title">
          {strings.landing.problemTitle}
        </h2>
        <p className="hvcf-landing__body">{strings.landing.problemBody}</p>
      </section>

      <section className="hvcf-landing__section" aria-labelledby="landing-how-title">
        <h2 id="landing-how-title" className="hvcf-landing__section-title">
          {strings.landing.howTitle}
        </h2>
        <ol className="hvcf-landing__steps">
          <li>
            <IonIcon icon={folderOpenOutline} aria-hidden="true" />
            <div>
              <h3 className="hvcf-landing__step-title">{strings.landing.howStep1Title}</h3>
              <p className="hvcf-landing__body">{strings.landing.howStep1Body}</p>
            </div>
          </li>
          <li>
            <IonIcon icon={carOutline} aria-hidden="true" />
            <div>
              <h3 className="hvcf-landing__step-title">{strings.landing.howStep2Title}</h3>
              <p className="hvcf-landing__body">{strings.landing.howStep2Body}</p>
            </div>
          </li>
          <li>
            <IonIcon icon={documentTextOutline} aria-hidden="true" />
            <div>
              <h3 className="hvcf-landing__step-title">{strings.landing.howStep3Title}</h3>
              <p className="hvcf-landing__body">{strings.landing.howStep3Body}</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="hvcf-landing__section" aria-labelledby="landing-benefits-title">
        <h2 id="landing-benefits-title" className="hvcf-landing__section-title">
          {strings.landing.benefitsTitle}
        </h2>
        <ul className="hvcf-landing__benefits">
          <li>
            <IonIcon icon={lockClosedOutline} aria-hidden="true" />
            <div>
              <h3 className="hvcf-landing__step-title">{strings.landing.benefitNoLoginTitle}</h3>
              <p className="hvcf-landing__body">{strings.landing.benefitNoLoginBody}</p>
            </div>
          </li>
          <li>
            <IonIcon icon={phonePortraitOutline} aria-hidden="true" />
            <div>
              <h3 className="hvcf-landing__step-title">{strings.landing.benefitLocalTitle}</h3>
              <p className="hvcf-landing__body">{strings.landing.benefitLocalBody}</p>
            </div>
          </li>
          <li>
            <IonIcon icon={cameraOutline} aria-hidden="true" />
            <div>
              <h3 className="hvcf-landing__step-title">{strings.landing.benefitAnexoTitle}</h3>
              <p className="hvcf-landing__body">{strings.landing.benefitAnexoBody}</p>
            </div>
          </li>
          <li>
            <IonIcon icon={documentTextOutline} aria-hidden="true" />
            <div>
              <h3 className="hvcf-landing__step-title">{strings.landing.benefitPdfTitle}</h3>
              <p className="hvcf-landing__body">{strings.landing.benefitPdfBody}</p>
            </div>
          </li>
          <li>
            <IonIcon icon={shieldCheckmarkOutline} aria-hidden="true" />
            <div>
              <h3 className="hvcf-landing__step-title">{strings.landing.benefitPortableTitle}</h3>
              <p className="hvcf-landing__body">{strings.landing.benefitPortableBody}</p>
            </div>
          </li>
        </ul>
      </section>

      <section
        className="hvcf-landing__section hvcf-landing__section--free"
        aria-labelledby="landing-free-title"
      >
        <h2 id="landing-free-title" className="hvcf-landing__section-title">
          {strings.landing.freeTitle}
        </h2>
        <p className="hvcf-landing__body">{strings.landing.freeBody}</p>
      </section>

      <section
        className="hvcf-landing__section hvcf-landing__closing"
        aria-labelledby="landing-closing-title"
      >
        <h2 id="landing-closing-title" className="hvcf-landing__section-title">
          {strings.landing.closingTitle}
        </h2>
        <p className="hvcf-landing__body">{strings.landing.closingBody}</p>
        <div className="hvcf-landing__actions">
          <IonButton
            data-testid="landing-cta-experimentar-footer"
            className="hvcf-landing__cta"
            expand="block"
            onClick={() => onCta('experimentar')}
          >
            {strings.landing.ctaExperimentar}
          </IonButton>
          <IonButton
            data-testid="landing-cta-ja-tenho-cofre-footer"
            className="hvcf-landing__cta hvcf-landing__cta--secondary"
            fill="outline"
            expand="block"
            onClick={() => onCta('ja-tenho-cofre')}
          >
            {strings.landing.ctaJaTenhoCofre}
          </IonButton>
        </div>
      </section>
    </article>
  )
}
