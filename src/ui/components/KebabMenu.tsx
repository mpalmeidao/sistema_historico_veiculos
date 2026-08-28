import { useId, useState } from 'react'
import { IonActionSheet, IonButton, IonIcon } from '@ionic/react'
import { ellipsisVertical } from 'ionicons/icons'
import { strings } from '../../shared/i18n'

export interface KebabMenuAction {
  id: string
  label: string
  role?: 'destructive' | 'cancel'
  testId?: string
  onSelect: () => void
}

export interface KebabMenuProps {
  /** Rótulo acessível do botão gatilho (deve descrever o contexto). */
  triggerLabel: string
  triggerTestId?: string
  actions: KebabMenuAction[]
  className?: string
}

/**
 * Menu kebab acessível: botão nativo + IonActionSheet.
 * Fecha ao escolher, ao tocar fora ou Escape; o Action Sheet devolve o foco ao gatilho.
 */
export function KebabMenu({ triggerLabel, triggerTestId, actions, className }: KebabMenuProps) {
  const [open, setOpen] = useState(false)
  const sheetId = useId()

  return (
    <>
      <IonButton
        type="button"
        fill="clear"
        color="medium"
        className={className}
        data-testid={triggerTestId}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? sheetId : undefined}
        onClick={() => setOpen(true)}
      >
        <IonIcon slot="icon-only" icon={ellipsisVertical} aria-hidden="true" />
      </IonButton>

      <IonActionSheet
        id={sheetId}
        isOpen={open}
        header={triggerLabel}
        onDidDismiss={() => setOpen(false)}
        buttons={[
          ...actions.map((action) => ({
            text: action.label,
            role: action.role,
            htmlAttributes: action.testId ? { 'data-testid': action.testId } : undefined,
            handler: () => {
              action.onSelect()
            },
          })),
          {
            text: strings.veiculos.cancel,
            role: 'cancel' as const,
          },
        ]}
      />
    </>
  )
}
