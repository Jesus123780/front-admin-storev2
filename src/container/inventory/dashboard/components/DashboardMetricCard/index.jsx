'use client'

import {
  CounterAnimation, getGlobalStyle, Icon, KpiSparkChart, Row, Text
} from 'pkg-components'
import PropTypes from 'prop-types'

import { formatPercentage } from '../../utils/format'
import styles from './styles.module.css'

/**
 * Maps a KPI trend to an accessible icon + token color. Trend is always
 * communicated with an icon and text, never color alone.
 */
const TREND_META = {
  up: { icon: 'IconUpRightArrow', color: '--color-icons-success', label: 'al alza' },
  down: { icon: 'IconDownRightArrow', color: '--color-icons-error', label: 'a la baja' },
  flat: { icon: 'IconMinus', color: '--color-icons-gray', label: 'sin variación' },
  unknown: { icon: 'IconInfo', color: '--color-icons-gray-light', label: 'sin datos' }
}

/**
 * A single KPI card: label, icon, main value, period comparison and sparkline.
 * The first card can be rendered as "featured" (filled accent surface).
 *
 * @param {object} props - Component props.
 * @param {string} props.label - KPI label.
 * @param {number} props.value - Raw numeric value; animated via CounterAnimation.
 * @param {string} props.iconName - pkg-components Icon name.
 * @param {boolean} [props.isCurrency] - When true, prefixes the currency symbol
 *   and groups thousands with two decimals (es-CO). Counts use no decimals.
 * @param {string} [props.currencySymbol] - Symbol shown before a currency value.
 * @param {object} [props.metric] - KPI metric from the summary (trend/change).
 * @param {number[]} [props.sparkline] - Sparkline series.
 * @param {string} [props.comparisonLabel] - What the comparison measures.
 * @param {string} [props.subtitle] - Optional clarifying subtitle.
 * @param {boolean} [props.featured] - Render the filled accent variant.
 * @param {boolean} [props.loading] - Loading state (renders a skeleton).
 * @returns {JSX.Element} The KPI card.
 */
export const DashboardMetricCard = ({
  label,
  value,
  iconName,
  isCurrency = false,
  currencySymbol = '$',
  metric = null,
  sparkline = [],
  comparisonLabel = '',
  subtitle = '',
  featured = false,
  loading = false
}) => {
  if (loading) {
    return (
      <section aria-busy='true' className={`${styles.card} ${featured ? styles.featured : ''}`}>
        <div className={styles.skelLine} style={{ width: '45%' }} />
        <div className={styles.skelValue} />
        <div className={styles.skelLine} style={{ width: '60%' }} />
      </section>
    )
  }

  const trend = metric?.trend ?? 'unknown'
  const meta = TREND_META[trend] ?? TREND_META.unknown
  const hasChange = metric && metric.percentageChange !== null && metric.percentageChange !== undefined
  const changeText = hasChange ? formatPercentage(metric.percentageChange) : 'Sin datos'

  // lightweight-charts renders to canvas, so CSS variables won't resolve; use
  // explicit rgba values that mirror the design tokens
  // (--color-feedback-success-dark = #50a773). The featured card uses white.
  const spark = featured
    ? {
        lineColor: 'rgba(255, 255, 255, 1)',
        topColor: 'rgba(255, 255, 255, 0.35)',
        bottomColor: 'rgba(255, 255, 255, 0)'
      }
    : {
        lineColor: 'rgba(80, 167, 115, 1)',
        topColor: 'rgba(80, 167, 115, 0.25)',
        bottomColor: 'rgba(80, 167, 115, 0)'
      }

  return (
    <section aria-label={label} className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <header className={styles.header}>
        <span className={`${styles.iconWrap} ${featured ? styles.iconWrapFeatured : ''}`}>
          <Icon
            color={featured ? getGlobalStyle('--color-text-white') : getGlobalStyle('--color-icons-success')}
            icon={iconName}
            size={22}
          />
        </span>
        <Text as='h3' className={styles.label} size='md' weight={600}>
          {label}
        </Text>
      </header>

<Row>
      <div className={styles.value}>
        {isCurrency && (
          <Text as='span' className={styles.currencySymbol} size='2xl' weight={700}>
            {currencySymbol}
          </Text>
        )}
        <CounterAnimation
          number={Number.isFinite(Number(value)) ? Number(value) : 0}
          numberformat={isCurrency}
          size='1.75rem'
        />
      </div>

      <div className={styles.sparkRow}>
        <KpiSparkChart
          ariaLabel={`Tendencia de ${label}`}
          bottomColor={spark.bottomColor}
          data={sparkline}
          height={40}
          lineColor={spark.lineColor}
          topColor={spark.topColor}
        />
      </div>
</Row>


      <footer className={styles.footer}>
        <span
          aria-label={`Variación ${meta.label}: ${changeText} ${comparisonLabel}`}
          className={`${styles.trend} ${styles[`trend_${trend}`]} ${featured ? styles.trendFeatured : ''}`}
        >
          <Icon
            color={featured ? getGlobalStyle('--color-text-white') : getGlobalStyle(meta.color)}
            icon={meta.icon}
            size={16}
          />
          <Text as='span' size='sm' weight={600}>
            {changeText}
          </Text>
        </span>
        {(comparisonLabel || subtitle) && (
          <Text as='span' className={styles.comparison} size='sm'>
            {subtitle || comparisonLabel}
          </Text>
        )}
      </footer>
    </section>
  )
}

DashboardMetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  iconName: PropTypes.string.isRequired,
  isCurrency: PropTypes.bool,
  currencySymbol: PropTypes.string,
  metric: PropTypes.object,
  sparkline: PropTypes.arrayOf(PropTypes.number),
  comparisonLabel: PropTypes.string,
  subtitle: PropTypes.string,
  featured: PropTypes.bool,
  loading: PropTypes.bool
}
