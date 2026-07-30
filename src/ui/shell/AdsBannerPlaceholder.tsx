import { strings } from '../../shared/i18n'

/** Altura reservada do banner (sem AdSense no MVP) — evita layout shift futuro. */
export const ADS_BANNER_HEIGHT_PX = 50

/**
 * Espaço reservado para banner de ads.
 * Fora dos fluxos de cadastro; sem integração real de ads no MVP.
 */
export function AdsBannerPlaceholder() {
  return (
    <div
      className="ads-banner-placeholder"
      data-testid="ads-banner-placeholder"
      role="presentation"
      aria-hidden="true"
      style={{
        height: ADS_BANNER_HEIGHT_PX,
        minHeight: ADS_BANNER_HEIGHT_PX,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ion-color-light, #f4f5f8)',
        borderTop: '1px solid var(--ion-color-light-shade, #d7d8da)',
        color: 'var(--ion-color-medium, #92949c)',
        fontSize: '0.75rem',
        userSelect: 'none',
      }}
    >
      {strings.shell.adsPlaceholder}
    </div>
  )
}
