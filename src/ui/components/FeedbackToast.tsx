export interface FeedbackToastProps {
  message: string | null
  variant: 'success' | 'error'
  testId: string
}

/**
 * Canal único de feedback global (toast / live region).
 * Sucesso = polite/status; erro = assertive/alert.
 * Permanece visível enquanto a mensagem existir no estado do shell
 * (substitui o texto solto verde/vermelho no topo do content).
 */
export function FeedbackToast({ message, variant, testId }: FeedbackToastProps) {
  if (!message) return null

  return (
    <div
      className={`hvcf-feedback-toast hvcf-feedback-toast--${variant}`}
      data-testid={testId}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      {message}
    </div>
  )
}
