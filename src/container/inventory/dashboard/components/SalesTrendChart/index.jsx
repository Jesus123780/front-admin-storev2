'use client'

import { useSalesTrend } from 'npm-pkg-hook'
import {
  CounterAnimation, getGlobalStyle, Icon, Text
} from 'pkg-components'
import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'

import {
  formatCompact, formatCurrency, formatDate, formatNumber, getCurrencySymbol
} from '../../utils/format'
import { WidgetError } from '../WidgetError'
import styles from './styles.module.css'

const VIEWBOX_W = 720
const VIEWBOX_H = 260
const PADDING = { top: 16, right: 16, bottom: 28, left: 56 }

/**
 * Formats a bucket key into a short axis label in the business timezone.
 *
 * @param {string} bucket - Bucket key (hour or day).
 * @param {string} granularity - hour | day | week.
 * @param {string} timezone - IANA timezone.
 * @returns {string} Short axis label.
 */
const bucketLabel = (bucket, granularity, timezone) => {
  if (granularity === 'hour') {
    return formatDate(bucket.length <= 13 ? `${bucket}:00` : bucket, {
      timezone,
      dateStyleOptions: { hour: '2-digit', hour12: false }
    })
  }
  return formatDate(`${bucket}T12:00:00`, { timezone, dateStyleOptions: { day: '2-digit', month: 'short' } })
}

/**
 * Sales trend chart: revenue line + gradient area over time. Dependency-free
 * SVG (no new chart library), with hover/focus tooltip, currency Y axis and
 * loading/empty/error states.
 *
 * @param {object} props - Component props.
 * @param {object} props.filter - DashboardFilterInput for the active period.
 * @param {string} [props.currency] - ISO currency code.
 * @returns {JSX.Element} The sales trend panel.
 */
export const SalesTrendChart = ({ filter, currency }) => {
  const [trend, { loading, error, refetch }] = useSalesTrend(filter)
  const [activeIndex, setActiveIndex] = useState(null)

  const points = useMemo(() => trend?.points ?? [], [trend])
  const timezone = filter?.timezone
  const currencySymbol = getCurrencySymbol(currency)

  const geometry = useMemo(() => {
    if (points.length === 0) {return null}
    const innerW = VIEWBOX_W - PADDING.left - PADDING.right
    const innerH = VIEWBOX_H - PADDING.top - PADDING.bottom
    const max = Math.max(...points.map((p) => p.revenue), 0)
    const min = 0
    const range = max - min || 1
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0

    const coords = points.map((p, i) => {
      const x = PADDING.left + (points.length > 1 ? i * stepX : innerW / 2)
      const y = PADDING.top + innerH - ((p.revenue - min) / range) * innerH
      return { x, y, point: p }
    })

    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ')
    const area = `${line} L${coords[coords.length - 1].x.toFixed(2)},${PADDING.top + innerH} L${coords[0].x.toFixed(2)},${PADDING.top + innerH} Z`

    // Up to 4 gridline values.
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      value: max * f,
      y: PADDING.top + innerH - f * innerH
    }))

    return { coords, line, area, ticks, innerH }
  }, [points])

  const isInitialLoading = loading && !trend

  const renderBody = () => {
    if (error && !trend) {return <WidgetError onRetry={refetch} />}
    if (isInitialLoading) {return <div className={styles.skeleton} aria-busy='true' />}
    if (points.length === 0) {
      return (
        <div className={styles.empty}>
          <Icon color={getGlobalStyle('--color-icons-gray-light')} icon='IconChart' size={32} />
          <Text as='p' className={styles.emptyText} size='md'>
            No hay ventas en el periodo seleccionado. Prueba ampliar el rango de fechas.
          </Text>
        </div>
      )
    }

    const active = activeIndex !== null ? geometry.coords[activeIndex] : null

    return (
      <div className={styles.chartWrap}>
        <svg
          className={styles.svg}
          preserveAspectRatio='none'
          role='img'
          aria-label='Gráfico de tendencia de ventas'
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        >
          <defs>
            <linearGradient id='salesTrendFill' x1='0' x2='0' y1='0' y2='1'>
              <stop offset='0%' stopColor='var(--color-feedback-success-dark)' stopOpacity='0.28' />
              <stop offset='100%' stopColor='var(--color-feedback-success-dark)' stopOpacity='0' />
            </linearGradient>
          </defs>

          {geometry.ticks.map((tick, i) => (
            <g key={`tick-${i}`}>
              <line
                className={styles.gridline}
                x1={PADDING.left}
                x2={VIEWBOX_W - PADDING.right}
                y1={tick.y}
                y2={tick.y}
              />
              <text className={styles.axisLabel} x={PADDING.left - 8} y={tick.y + 4} textAnchor='end'>
                {formatCompact(tick.value)}
              </text>
            </g>
          ))}

          <path d={geometry.area} fill='url(#salesTrendFill)' />
          <path
            className={styles.line}
            d={geometry.line}
            fill='none'
            stroke='var(--color-feedback-success-dark)'
            strokeLinecap='round'
            strokeLinejoin='round'
          />

          {active && (
            <g>
              <line
                className={styles.activeLine}
                x1={active.x}
                x2={active.x}
                y1={PADDING.top}
                y2={PADDING.top + geometry.innerH}
              />
              <circle className={styles.activeDot} cx={active.x} cy={active.y} r={5} />
            </g>
          )}

          {geometry.coords.map((c, i) => (
            <rect
              aria-label={`${bucketLabel(c.point.bucket, trend.granularity, timezone)}: ${formatCurrency(c.point.revenue, { currency })}, ${formatNumber(c.point.orders)} pedidos`}
              className={styles.hotspot}
              height={VIEWBOX_H}
              key={`hot-${i}`}
              onBlur={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(i)}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              tabIndex={0}
              width={Math.max(VIEWBOX_W / geometry.coords.length, 8)}
              x={c.x - Math.max(VIEWBOX_W / geometry.coords.length, 8) / 2}
              y={0}
            />
          ))}
        </svg>

        <div className={styles.axisX}>
          {geometry.coords.map((c, i) => {
            // Thin out labels when there are many points.
            const show = geometry.coords.length <= 8 || i % Math.ceil(geometry.coords.length / 8) === 0
            return (
              <span className={styles.axisXLabel} key={`xlabel-${i}`}>
                {show ? bucketLabel(c.point.bucket, trend.granularity, timezone) : ''}
              </span>
            )
          })}
        </div>

        {active && (
          <div
            className={styles.tooltip}
            style={{ left: `${(active.x / VIEWBOX_W) * 100}%` }}
          >
            <Text as='span' className={styles.tooltipDate} size='sm'>
              {bucketLabel(active.point.bucket, trend.granularity, timezone)}
            </Text>
            <Text as='span' className={styles.tooltipValue} size='md' weight={700}>
              {formatCurrency(active.point.revenue, { currency })}
            </Text>
            <Text as='span' className={styles.tooltipMeta} size='sm'>
              {formatNumber(active.point.orders)} pedidos
            </Text>
          </div>
        )}
      </div>
    )
  }

  return (
    <section aria-busy={loading} aria-label='Tendencia de ventas' className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Text as='h2' className={styles.title} size='xl' weight={700}>
            Tendencia de ventas
          </Text>
          {trend && (
            <div className={styles.headerStats}>
              <span className={styles.amount}>
                <Text as='span' className={styles.amountSymbol} size='2xl' weight={700}>
                  {currencySymbol}
                </Text>
                <CounterAnimation
                  number={Number.isFinite(Number(trend.totalRevenue)) ? Number(trend.totalRevenue) : 0}
                  numberformat
                  size='1.75rem'
                />
              </span>
              <Text as='span' className={styles.ordersCount} size='md'>
                {trend.totalOrders} pedidos
              </Text>
            </div>
          )}
        </div>
      </header>
      {renderBody()}
    </section>
  )
}

SalesTrendChart.propTypes = {
  filter: PropTypes.object.isRequired,
  currency: PropTypes.string
}
