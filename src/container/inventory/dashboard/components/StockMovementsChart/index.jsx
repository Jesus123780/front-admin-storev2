'use client'

import { getGlobalStyle, Text } from 'pkg-components'
import PropTypes from 'prop-types'
import { useMemo } from 'react'

import { formatCount, formatDate } from '../../utils/format'
import { TrendAreaChart } from '../TrendAreaChart'
import styles from './styles.module.css'

const DEFAULT_TIMEZONE = 'America/Bogota'

/**
 * Definition of the three stock movement series rendered by the chart. Each
 * movement maps to a `ChartData` numeric field and a distinct, accessible color
 * so entradas (in), salidas (out) and ajustes (adjustments) stay visually
 * differentiable.
 */
const SERIES_DEFS = [
  { key: 'TotalIn', label: 'Entradas', token: '--color-feedback-success-dark' },
  { key: 'TotalOut', label: 'Salidas', token: '--color-campaigns-orange' },
  { key: 'TotalAdjustment', label: 'Ajustes', token: '--color-icons-secondary' }
]

/**
 * Coerces an API value into a finite, non-negative integer.
 *
 * @param {unknown} value - Raw value from the stock-movements hook.
 * @returns {number} A safe non-negative number (0 when invalid).
 */
const toSafeCount = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0
}

/**
 * Stock movements widget. Renders the three inventory movement types (entradas,
 * salidas, ajustes) as overlaid area/line series using the shared
 * {@link TrendAreaChart}, replacing the previous lightweight-charts
 * `ChartComponent` while keeping the same data source (`useStockMovements`).
 *
 * Counts are whole numbers, so values are formatted with {@link formatCount}
 * (no currency, no decimals). X-axis labels are derived from each point's date
 * in the business timezone.
 *
 * @param {object} props - Component props.
 * @param {Array<{ date: string, TotalIn: number, TotalOut: number, TotalAdjustment: number }>} props.chartData
 *   - Stock movements per day from `useStockMovements` (already date-filled).
 * @param {string} [props.title] - Panel heading.
 * @param {string} [props.timezone] - IANA timezone for date labels.
 * @param {string} [props.className] - Optional wrapper class.
 * @returns {JSX.Element} The stock movements chart panel.
 */
export const StockMovementsChart = ({
  chartData = [],
  title = 'Entradas y Salidas de Inventario por día',
  timezone = DEFAULT_TIMEZONE,
  className = ''
}) => {
  const { labels, series, totals, hasData } = useMemo(() => {
    const rows = Array.isArray(chartData)
      ? chartData.filter((row) => row && typeof row.date === 'string' && row.date.trim())
      : []

    const nextLabels = rows.map((row) => formatDate(`${row.date}T12:00:00`, {
      timezone,
      dateStyleOptions: { day: '2-digit', month: 'short' }
    }))

    const nextSeries = SERIES_DEFS.map((def) => ({
      key: def.key,
      label: def.label,
      color: getGlobalStyle(def.token),
      values: rows.map((row) => toSafeCount(row[def.key]))
    }))

    const nextTotals = nextSeries.map((serie) => ({
      key: serie.key,
      label: serie.label,
      color: serie.color,
      total: serie.values.reduce((accumulator, value) => accumulator + value, 0)
    }))

    const anyValue = nextSeries.some((serie) => serie.values.some((value) => value > 0))

    return {
      labels: nextLabels,
      series: nextSeries,
      totals: nextTotals,
      hasData: rows.length > 0 && anyValue
    }
  }, [chartData, timezone])

  return (
    <section
      aria-label='Entradas y salidas de inventario'
      className={`${styles.panel} ${className}`.trim()}
    >
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Text as='h3' className={styles.title} size='lg' weight={700}>
            {title}
          </Text>
          <Text as='p' className={styles.subtitle} size='sm'>
            Entradas, salidas y ajustes de stock por día
          </Text>
        </div>

        {hasData && (
          <ul aria-label='Totales por tipo de movimiento' className={styles.legend}>
            {totals.map((item) => (
              <li className={styles.legendItem} key={item.key}>
                <span
                  aria-hidden='true'
                  className={styles.legendDot}
                  style={{ backgroundColor: item.color }}
                />
                <Text as='span' className={styles.legendLabel} size='sm'>
                  {item.label}
                </Text>
                <Text as='span' className={styles.legendValue} size='sm' weight={700}>
                  {formatCount(item.total)}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </header>

      <TrendAreaChart
        ariaLabel='Gráfico de entradas, salidas y ajustes de inventario'
        emptyMessage='No hay movimientos de inventario para el periodo seleccionado.'
        formatValue={formatCount}
        labels={labels}
        series={series}
      />
    </section>
  )
}

StockMovementsChart.propTypes = {
  chartData: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string,
    TotalIn: PropTypes.number,
    TotalOut: PropTypes.number,
    TotalAdjustment: PropTypes.number
  })),
  title: PropTypes.string,
  timezone: PropTypes.string,
  className: PropTypes.string
}
