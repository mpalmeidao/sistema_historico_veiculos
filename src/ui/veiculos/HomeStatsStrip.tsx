import { IonIcon } from '@ionic/react'
import { carOutline, constructOutline, shieldCheckmarkOutline } from 'ionicons/icons'
import { strings } from '../../shared/i18n'

export interface HomeStatsStripProps {
  veiculos: number
  manutencoes: number
  backupLabel: string
}

const STATS = [
  {
    key: 'veiculos' as const,
    icon: carOutline,
    label: () => strings.home.statsVeiculos,
    testId: 'home-stat-veiculos',
  },
  {
    key: 'manutencoes' as const,
    icon: constructOutline,
    label: () => strings.home.statsManutencoes,
    testId: 'home-stat-manutencoes',
  },
  {
    key: 'backup' as const,
    icon: shieldCheckmarkOutline,
    label: () => strings.home.statsBackup,
    testId: 'home-stat-backup',
  },
]

/** Três cards informativos (não clicáveis) da home Veículos. */
export function HomeStatsStrip({ veiculos, manutencoes, backupLabel }: HomeStatsStripProps) {
  const values = {
    veiculos: String(veiculos),
    manutencoes: String(manutencoes),
    backup: backupLabel,
  }

  return (
    <div
      className="hvcf-stats-strip"
      data-testid="home-stats"
      role="group"
      aria-label={strings.home.statsGroupLabel}
    >
      {STATS.map((stat) => (
        <div key={stat.key} className="hvcf-stat-card" data-testid={stat.testId}>
          <span className="hvcf-stat-card__icon" aria-hidden="true">
            <IonIcon icon={stat.icon} />
          </span>
          <span className="hvcf-stat-card__label">{stat.label()}</span>
          <span className="hvcf-stat-card__value">{values[stat.key]}</span>
        </div>
      ))}
    </div>
  )
}
