import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { TERMO_ISENCAO_PARAGRAFOS, TERMO_ISENCAO_TITULO } from '../../shared/legal'
import { strings } from '../../shared/i18n'

export interface TermoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TermoModal({ isOpen, onClose }: TermoModalProps) {
  return (
    <IonModal
      data-testid="termo-modal"
      isOpen={isOpen}
      onDidDismiss={() => {
        onClose()
      }}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>{TERMO_ISENCAO_TITULO}</IonTitle>
          <IonButtons slot="end">
            <IonButton data-testid="termo-modal-close" onClick={onClose}>
              {strings.termo.close}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div data-testid="termo-modal-body">
          {TERMO_ISENCAO_PARAGRAFOS.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </IonContent>
    </IonModal>
  )
}
