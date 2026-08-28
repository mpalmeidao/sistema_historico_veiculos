import type { ReactNode } from 'react'
import { IonButton, IonIcon } from '@ionic/react'
import type { JSX } from 'react'

export interface EmptyStateProps {
  icon?: string
  title: string
  body: string
  testId?: string
  actionLabel?: string
  actionTestId?: string
  onAction?: () => void
  children?: ReactNode
}

/** Empty state leve: ícone + título + corpo + CTA opcional. */
export function EmptyState({
  icon,
  title,
  body,
  testId,
  actionLabel,
  actionTestId,
  onAction,
  children,
}: EmptyStateProps): JSX.Element {
  return (
    <div className="hvcf-empty" data-testid={testId}>
      {icon && (
        <span className="hvcf-empty__icon" aria-hidden="true">
          <IonIcon icon={icon} />
        </span>
      )}
      <div className="hvcf-empty__text">
        <h3 className="hvcf-empty__title">{title}</h3>
        <p className="hvcf-empty__body">{body}</p>
      </div>
      {actionLabel && onAction && (
        <IonButton data-testid={actionTestId} className="hvcf-empty__cta" onClick={onAction}>
          {actionLabel}
        </IonButton>
      )}
      {children}
    </div>
  )
}
