import { IonSpinner } from '@ionic/react'
import { strings } from '../../shared/i18n'

/** Loading minimalista enquanto o cofre de trabalho é aberto. */
export function CofreLoadingGate() {
  return (
    <section className="hvcf-gate hvcf-gate--loading" data-testid="cofre-loading" aria-busy="true">
      <p className="hvcf-gate__brand">{strings.shell.loadingAppName}</p>
      <IonSpinner name="crescent" data-testid="cofre-loading-spinner" />
      <p className="hvcf-gate__body" role="status" aria-live="polite">
        {strings.cofre.openWorking}
      </p>
    </section>
  )
}
