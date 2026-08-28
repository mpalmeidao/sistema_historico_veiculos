import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { TERMO_ISENCAO_PARAGRAFOS } from '../../shared/legal'
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
          <IonTitle>{strings.termo.modalTitle}</IonTitle>
          <IonButtons slot="end">
            <IonButton data-testid="termo-modal-close" onClick={onClose}>
              {strings.termo.close}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div data-testid="termo-modal-body" className="hvcf-termo-scroll hvcf-termo-scroll--modal">
          {TERMO_ISENCAO_PARAGRAFOS.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </IonContent>
    </IonModal>
  )
}
