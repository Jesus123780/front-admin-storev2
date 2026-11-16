'use client'

import { Icon } from 'pkg-components'
import { numberFormat } from 'npm-pkg-hook'
import PropTypes from 'prop-types'
import { formatCount, formatPercentage } from '../../utils/format'
import { Sparkline } from '../Sparkline'
import styles from './styles.module.css'

const TREND_META = {
  up: { icon: 'IconUpRightArrow', label: 'al alza' },
  down: { icon: 'IconDownRightArrow', label: 'a la baja' },
  flat: { icon: 'IconMinus', label: 'sin variación' },
  unknown: { icon: 'IconInfo', label: 'sin referencia anterior' }
}

const isNumeric = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value))

export const DashboardMetricCard = ({
  label, value, iconName, isCurrency = false, currencySymbol = '$',
  metric = null, sparkline = [], comparisonLabel = '', subtitle = '',
  featured = false, loading = false, iconTone = 'green'
}) => {
  const className = `${styles.card} ${featured ? styles.featured : ''}`
  if (loading) {
    return (
      <section aria-busy='true' aria-label='Cargando indicador' className={className}>
        <div className={styles.skelLine} />
        <div className={styles.skelValue} />
        <div className={styles.skelLine} />
      </section>
    )
  }

  const hasChange = isNumeric(metric?.percentageChange)
  const change = hasChange ? Number(metric.percentageChange) : null
  const trend = !hasChange ? 'unknown' : change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  const meta = TREND_META[trend]
  const hasSeries = Array.isArray(sparkline) && sparkline.filter(isNumeric).length >= 2
  const known = isNumeric(value)
  const formatted = known ? (isCurrency ? String(numberFormat(Number(value))) : formatCount(Number(value))) : '—'
  const changeText = hasChange ? formatPercentage(change) : 'Sin datos'
  const showComparison = Boolean(comparisonLabel || hasChange)

  return (
    <section aria-label={label} className={className} data-tone={iconTone}>
      <header className={styles.header}>
        <span aria-hidden='true' className={styles.iconWrap}>
          <Icon color='currentColor' icon={iconName} size={22} />
        </span>
        <h3 className={styles.label}>{label}</h3>
      </header>

      <div className={`${styles.body} ${hasSeries ? styles.withSeries : ''} ${formatted.length + (isCurrency ? currencySymbol.length + 1 : 0) > 10 ? styles.longValue : ''}`}>
        <div className={styles.value}>
          {isCurrency && known && <span className={styles.currencySymbol}>{currencySymbol}</span>}
          <span className={styles.amount}>{formatted}</span>
        </div>
        {hasSeries && (
          <div className={styles.sparkRow}>
            <Sparkline ariaLabel={`Tendencia de ${label}`} data={sparkline} height={44} width={120} stroke='currentColor' fill='currentColor' />
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        {showComparison && (
          <span aria-label={`Variación ${meta.label}: ${changeText} ${comparisonLabel}`} className={`${styles.trend} ${styles[`trend_${trend}`]}`}>
            <Icon color='currentColor' icon={meta.icon} size={15} />
            <span>{changeText}</span>
          </span>
        )}
        {(comparisonLabel || subtitle) && <span className={styles.comparison}>{subtitle || comparisonLabel}</span>}
      </footer>
    </section>
  )
}

DashboardMetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  iconName: PropTypes.string.isRequired,
  isCurrency: PropTypes.bool,
  currencySymbol: PropTypes.string,
  metric: PropTypes.object,
  sparkline: PropTypes.arrayOf(PropTypes.number),
  comparisonLabel: PropTypes.string,
  subtitle: PropTypes.string,
  featured: PropTypes.bool,
  loading: PropTypes.bool,
  iconTone: PropTypes.oneOf(['green', 'blue', 'purple', 'rose'])
}
