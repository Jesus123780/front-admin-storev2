'use client'

import { useSalesTrend } from 'npm-pkg-hook'
import {
  CounterAnimation,
  getGlobalStyle,
  Icon,
  Text
} from 'pkg-components'
import PropTypes from 'prop-types'
import {
 useId, useMemo, useState 
} from 'react'

import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  getCurrencySymbol
} from '../../utils/format'
import { WidgetError } from '../WidgetError'
import styles from './styles.module.css'

const VIEWBOX_W = 720
const VIEWBOX_H = 260

const PADDING = {
  top: 24,
  right: 20,
  bottom: 28,
  left: 56
}

const X_INSET_LEFT = 10
const X_INSET_RIGHT = 0
const ENDPOINT_RADIUS = 5
const DEFAULT_TIMEZONE = 'America/Bogota'
const CURVE_TENSION = 0.16

/**
 * Converts an API value into a finite, non-negative number.
 *
 * @param {unknown} value - Value received from the API.
 * @returns {number} A safe non-negative number.
 */
const toSafeNumber = (value) => {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : NaN

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/**
 * Normalizes trend points received from the API.
 * Invalid records are discarded to prevent broken SVG geometry.
 *
 * @param {unknown} input - Raw trend points.
 * @returns {Array<object>} Normalized trend points.
 */
const normalizePoints = (input) => {
  if (!Array.isArray(input)) {return []}

  return input.reduce((result, point, index) => {
    if (!point || typeof point !== 'object' || Array.isArray(point)) {
      return result
    }

    const bucket = typeof point.bucket === 'string'
      ? point.bucket.trim()
      : ''

    if (!bucket) {return result}

    result.push({
      key: `${bucket}-${index}`,
      bucket,
      revenue: toSafeNumber(point.revenue),
      orders: toSafeNumber(point.orders)
    })

    return result
  }, [])
}

/**
 * Formats a bucket key using the business timezone.
 *
 * @param {string} bucket - Bucket key returned by the API.
 * @param {string} granularity - hour | day | week.
 * @param {string} timezone - IANA timezone.
 * @returns {string} Formatted bucket label.
 */
const bucketLabel = (bucket, granularity, timezone) => {
  if (!bucket) {return ''}

  try {
    if (granularity === 'hour') {
      const normalizedBucket = bucket.length <= 13
        ? `${bucket}:00`
        : bucket

      return formatDate(normalizedBucket, {
        timezone,
        dateStyleOptions: {
          hour: '2-digit',
          hour12: false
        }
      })
    }

    return formatDate(`${bucket}T12:00:00`, {
      timezone,
      dateStyleOptions: {
        day: '2-digit',
        month: 'short'
      }
    })
  } catch {
    return bucket
  }
}

/**
 * Human label for the trend granularity.
 *
 * @param {('hour'|'day'|'week')} granularity - Series granularity.
 * @returns {string} Readable granularity label.
 */
const granularityLabel = (granularity) => {
  switch (granularity) {
    case 'hour':
      return 'Por hora'
    case 'week':
      return 'Por semana'
    case 'day':
    default:
      return 'Por día'
  }
}

/**
 * Pluralizes the orders count ("1 pedido" / "N pedidos").
 *
 * @param {number} count - Orders count.
 * @returns {string} Pluralized orders label.
 */
const ordersLabel = (count) => {
  const safe = Number.isFinite(Number(count)) ? Number(count) : 0
  return `${safe} ${safe === 1 ? 'pedido' : 'pedidos'}`
}

/**
 * Average ticket (revenue per order), guarding against division by zero.
 *
 * @param {number} revenue - Total revenue.
 * @param {number} orders - Total orders.
 * @returns {number} Average revenue per order (0 when no orders).
 */
const averageTicket = (revenue, orders) => {
  const safeRevenue = Number.isFinite(Number(revenue)) ? Number(revenue) : 0
  const safeOrders = Number.isFinite(Number(orders)) ? Number(orders) : 0
  return safeOrders > 0 ? safeRevenue / safeOrders : 0
}

/**
 * Creates an SVG coordinate.
 *
 * @param {number} x - Horizontal coordinate.
 * @param {number} y - Vertical coordinate.
 * @returns {{x: number, y: number}} SVG coordinate.
 */
const createPoint = (x, y) => ({ x, y })

/**
 * Creates a smooth cubic Bézier path through the supplied coordinates.
 * The final curve segment always terminates at the final data coordinate.
 *
 * @param {Array<{x: number, y: number}>} coordinates - Chart coordinates.
 * @returns {string} SVG path definition.
 */
const createSmoothPath = (coordinates) => {
  if (coordinates.length === 0) {return ''}

  if (coordinates.length === 1) {
    const [first] = coordinates
    return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
  }

  return coordinates.reduce((path, current, index) => {
    if (index === 0) {
      return `M ${current.x.toFixed(2)} ${current.y.toFixed(2)}`
    }

    const previous = coordinates[index - 1]
    const beforePrevious = coordinates[index - 2] ?? previous
    const next = coordinates[index + 1] ?? current
    const deltaX = current.x - previous.x

    const control1 = createPoint(
      previous.x + deltaX / 3,
      previous.y + (current.y - beforePrevious.y) * CURVE_TENSION
    )

    const control2 = createPoint(
      current.x - deltaX / 3,
      current.y - (next.y - previous.y) * CURVE_TENSION
    )

    return [
      path,
      `C ${control1.x.toFixed(2)} ${control1.y.toFixed(2)}`,
      `${control2.x.toFixed(2)} ${control2.y.toFixed(2)}`,
      `${current.x.toFixed(2)} ${current.y.toFixed(2)}`
    ].join(' ')
  }, '')
}

/**
 * Creates a closed area path below the sales trend line.
 *
 * @param {string} linePath - Existing SVG line path.
 * @param {Array<{x: number, y: number}>} coordinates - Chart coordinates.
 * @param {number} baselineY - Bottom coordinate of the plotting area.
 * @returns {string} Closed SVG area path.
 */
const createAreaPath = (linePath, coordinates, baselineY) => {
  if (!linePath || coordinates.length === 0) {return ''}

  const first = coordinates[0]
  const last = coordinates[coordinates.length - 1]

  return [
    linePath,
    `L ${last.x.toFixed(2)} ${baselineY.toFixed(2)}`,
    `L ${first.x.toFixed(2)} ${baselineY.toFixed(2)}`,
    'Z'
  ].join(' ')
}

/**
 * Builds SVG geometry, axes and interaction boundaries.
 *
 * @param {Array<object>} points - Normalized sales trend points.
 * @returns {object|null} Chart geometry.
 */
const buildChartGeometry = (points) => {
  if (points.length === 0) {return null}

  const innerWidth = VIEWBOX_W - PADDING.left - PADDING.right
  const innerHeight = VIEWBOX_H - PADDING.top - PADDING.bottom
  const plotWidth = Math.max(innerWidth - X_INSET_LEFT - X_INSET_RIGHT, 1)
  const plotLeft = PADDING.left + X_INSET_LEFT
  const plotRight = plotLeft + plotWidth
  const baselineY = PADDING.top + innerHeight

  const maxRevenue = Math.max(
    ...points.map((point) => point.revenue),
    0
  )

  const safeMax = maxRevenue || 1
  const stepX = points.length > 1
    ? plotWidth / (points.length - 1)
    : 0

  const coordinates = points.map((point, index) => {
    const x = points.length > 1
      ? plotLeft + index * stepX
      : plotLeft + plotWidth / 2

    const y = baselineY - (point.revenue / safeMax) * innerHeight

    return { x, y, point, index }
  })

  const line = createSmoothPath(coordinates)
  const area = createAreaPath(line, coordinates, baselineY)

  const ticks = maxRevenue > 0
    ? [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
      value: maxRevenue * fraction,
      y: baselineY - fraction * innerHeight
    }))
    : [{ value: 0, y: baselineY }]

  const hotspots = coordinates.map((coordinate, index) => {
    const previous = coordinates[index - 1]
    const next = coordinates[index + 1]

    const left = previous
      ? (previous.x + coordinate.x) / 2
      : coordinate.x - (stepX || 24) / 2

    const right = next
      ? (coordinate.x + next.x) / 2
      : coordinate.x + (stepX || 24) / 2

    const x = Math.max(plotLeft, left)
    const endX = Math.min(plotRight, right)

    return {
      x,
      width: Math.max(endX - x, 1)
    }
  })

  return {
    coordinates,
    hotspots,
    line,
    area,
    ticks,
    innerHeight,
    baselineY,
    plotLeft,
    plotRight,
    plotWidth,
    maxRevenue
  }
}

/**
 * Resolves the horizontal tooltip position and alignment.
 *
 * @param {number} x - Active point horizontal coordinate.
 * @returns {{left: string, '--tooltip-offset': string}} Tooltip positioning.
 */
const getTooltipPosition = (x) => {
  const percentage = (x / VIEWBOX_W) * 100
  const clamped = Math.min(Math.max(percentage, 9), 91)

  const alignment = clamped <= 12
    ? 'left'
    : clamped >= 88
      ? 'right'
      : 'center'

  const translate = {
    left: '0',
    center: '-50%',
    right: '-100%'
  }

  return {
    left: `${clamped}%`,
    '--tooltip-offset': translate[alignment]
  }
}

/**
 * Sales trend dashboard widget.
 *
 * Features:
 * - Smooth SVG Bézier line ending exactly at the last data point.
 * - SVG clip-path reveal animation; no dash-length measurement required.
 * - Final endpoint marker revealed by the same animation mask.
 * - Animation restarts when the revenue series changes.
 * - Gradient area reveal and responsive tooltip.
 * - Keyboard-accessible data points.
 * - Loading, empty and error states.
 *
 * @param {object} props - Component properties.
 * @param {object} props.filter - DashboardFilterInput.
 * @param {string} [props.currency='COP'] - ISO currency code.
 * @returns {JSX.Element} Sales trend dashboard widget.
 */
export const SalesTrendChart = ({
  filter,
  currency = 'COP'
}) => {
  const [trend, { loading, error, refetch }] = useSalesTrend(filter)
  const [activeIndex, setActiveIndex] = useState(null)

  const generatedId = useId().replace(/:/g, '')
  const gradientId = `salesTrendFill-${generatedId}`
  const revealId = `salesTrendReveal-${generatedId}`

  const timezone = filter?.timezone || DEFAULT_TIMEZONE
  const currencySymbol = getCurrencySymbol(currency)

  const points = useMemo(
    () => normalizePoints(trend?.points),
    [trend?.points]
  )

  const geometry = useMemo(
    () => buildChartGeometry(points),
    [points]
  )

  /**
   * Changes when the rendered line data changes, forcing the clip-path
   * rectangle to remount and replay its CSS reveal animation.
   *
   * @returns {string} Current data-series key.
   */
  const animationKey = useMemo(
    () => points
      .map((point) => `${point.bucket}:${point.revenue}`)
      .join('|'),
    [points]
  )

  const isInitialLoading = loading && !trend
  const active = activeIndex !== null
    ? geometry?.coordinates[activeIndex] ?? null
    : null

  const totalRevenue = toSafeNumber(trend?.totalRevenue)
  const totalOrders = toSafeNumber(trend?.totalOrders)

  /**
   * Allows navigating data points using the keyboard.
   *
   * @param {KeyboardEvent} event - Keyboard interaction.
   * @param {number} index - Current point index.
   * @returns {void}
   */
  const handlePointKeyDown = (event, index) => {
    const lastIndex = points.length - 1

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        setActiveIndex(Math.min(index + 1, lastIndex))
        break
      case 'ArrowLeft':
        event.preventDefault()
        setActiveIndex(Math.max(index - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(lastIndex)
        break
      case 'Escape':
        setActiveIndex(null)
        break
      default:
        break
    }
  }

  /**
   * Renders the chart body according to the current query state.
   *
   * @returns {JSX.Element} Chart content.
   */
  const renderBody = () => {
    if (error && !trend) {
      return <WidgetError onRetry={refetch} />
    }

    if (isInitialLoading) {
      return (
        <div aria-busy='true' className={styles.skeleton} />
      )
    }

    if (points.length === 0 || !geometry) {
      return (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <Icon
              color={getGlobalStyle('--color-icons-gray-light')}
              icon='IconChart'
              size={34}
            />
          </span>

          <Text
            as='p'
            className={styles.emptyTitle}
            size='md'
            weight={600}
          >
            Todavía no hay ventas
          </Text>

          <Text
            as='p'
            className={styles.emptyText}
            size='sm'
          >
            No hay movimientos durante el periodo seleccionado.
            Prueba ampliar el rango de fechas.
          </Text>
        </div>
      )
    }

    const tooltipPosition = active
      ? getTooltipPosition(active.x)
      : null

    const lastCoordinate = geometry.coordinates[
      geometry.coordinates.length - 1
    ]

    // Extend the reveal mask past the final marker so its entire circle is visible.
    const revealWidth = Math.min(
      VIEWBOX_W,
      geometry.plotRight + ENDPOINT_RADIUS + 5
    )

    return (
      <div className={styles.chartWrap}>
        <svg
          aria-label='Gráfico de tendencia de ventas'
          className={styles.svg}
          preserveAspectRatio='none'
          role='img'
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1='0'
              x2='0'
              y1='0'
              y2='1'
            >
              <stop
                offset='0%'
                stopColor='var(--color-feedback-success-dark)'
                stopOpacity='0.25'
              />
              <stop
                offset='55%'
                stopColor='var(--color-feedback-success-dark)'
                stopOpacity='0.10'
              />
              <stop
                offset='100%'
                stopColor='var(--color-feedback-success-dark)'
                stopOpacity='0'
              />
            </linearGradient>

            {/*
              The mask itself animates from left to right. It covers the
              endpoint marker too, so the animation cannot stop before it.
            */}
            <clipPath
              key={animationKey}
              clipPathUnits='userSpaceOnUse'
              id={revealId}
            >
              <rect
                className={styles.revealMask}
                height={VIEWBOX_H}
                width={revealWidth}
                x={0}
                y={0}
              />
            </clipPath>
          </defs>

          {/* Horizontal grid and Y-axis labels */}
          <g className={styles.grid}>
            {geometry.ticks.map((tick, index) => (
              <g
                className={styles.gridRow}
                key={`tick-${index}`}
                style={{ '--grid-delay': `${200 + index * 65}ms` }}
              >
                <line
                  className={styles.gridline}
                  x1={PADDING.left}
                  x2={VIEWBOX_W - PADDING.right}
                  y1={tick.y}
                  y2={tick.y}
                />

                <text
                  className={styles.axisLabel}
                  textAnchor='end'
                  x={PADDING.left - 8}
                  y={tick.y + 4}
                >
                  {formatCompact(tick.value)}
                </text>
              </g>
            ))}
          </g>

          {/*
            The line, area and final marker share exactly the same clip path.
            No stroke-dash calculations are involved in the reveal animation.
          */}
          <g clipPath={`url(#${revealId})`}>
            <path
              className={styles.area}
              d={geometry.area}
              fill={`url(#${gradientId})`}
            />

            <path
              className={styles.line}
              d={geometry.line}
              fill='none'
              stroke='var(--color-feedback-success-dark)'
              strokeLinecap='round'
              strokeLinejoin='round'
              vectorEffect='non-scaling-stroke'
            />

            {geometry.coordinates.length > 1 && (
              <g className={styles.endPoint}>
                <circle
                  className={styles.endPointHalo}
                  cx={lastCoordinate.x}
                  cy={lastCoordinate.y}
                  r={ENDPOINT_RADIUS + 4}
                />
                <circle
                  className={styles.endPointCore}
                  cx={lastCoordinate.x}
                  cy={lastCoordinate.y}
                  r={ENDPOINT_RADIUS}
                />
              </g>
            )}

            {geometry.coordinates.length === 1 && (
              <circle
                className={styles.singlePoint}
                cx={geometry.coordinates[0].x}
                cy={geometry.coordinates[0].y}
                r={ENDPOINT_RADIUS}
              />
            )}
          </g>

          {/* Interactive and keyboard-accessible data points */}
          {geometry.coordinates.map((coordinate, index) => {
            const hotspot = geometry.hotspots[index]

            return (
              <rect
                aria-label={`${bucketLabel(
                  coordinate.point.bucket,
                  trend.granularity,
                  timezone
                )}: ${formatCurrency(coordinate.point.revenue, { currency })}, ${formatNumber(coordinate.point.orders)} pedidos`}
                aria-pressed={activeIndex === index}
                className={styles.hotspot}
                height={geometry.innerHeight}
                key={coordinate.point.key}
                onBlur={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handlePointKeyDown(event, index)}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                role='button'
                tabIndex={0}
                width={hotspot.width}
                x={hotspot.x}
                y={PADDING.top}
              />
            )
          })}

          {/* Selected point indicator */}
          {active && (
            <g
              className={styles.activeIndicator}
              pointerEvents='none'
            >
              <line
                className={styles.activeLine}
                x1={active.x}
                x2={active.x}
                y1={PADDING.top}
                y2={geometry.baselineY}
              />

              <circle
                className={styles.activeHalo}
                cx={active.x}
                cy={active.y}
                r={10}
              />

              <circle
                className={styles.activeDot}
                cx={active.x}
                cy={active.y}
                r={5}
              />
            </g>
          )}
        </svg>

        {/* X-axis labels */}
        <div className={styles.axisX}>
          {geometry.coordinates.map((coordinate, index) => {
            const totalPoints = geometry.coordinates.length
            const interval = Math.ceil(totalPoints / 8)

            const shouldShow = totalPoints <= 8 ||
              index === 0 ||
              index === totalPoints - 1 ||
              index % interval === 0

            return (
              <span
                className={styles.axisXLabel}
                key={coordinate.point.key}
                title={bucketLabel(
                  coordinate.point.bucket,
                  trend.granularity,
                  timezone
                )}
              >
                {shouldShow
                  ? bucketLabel(
                    coordinate.point.bucket,
                    trend.granularity,
                    timezone
                  )
                  : ''}
              </span>
            )
          })}
        </div>

        {/* Floating tooltip */}
        {active && tooltipPosition && (() => {
          const pointRevenue = toSafeNumber(active.point.revenue)
          const pointOrders = toSafeNumber(active.point.orders)
          const pointTicket = averageTicket(pointRevenue, pointOrders)
          const shareOfTotal = totalRevenue > 0
            ? Math.round((pointRevenue / totalRevenue) * 1000) / 10
            : 0

          return (
            <div
              aria-live='polite'
              className={styles.tooltip}
              key={active.point.key}
              style={tooltipPosition}
            >
              <Text as='span' className={styles.tooltipDate} size='sm'>
                {bucketLabel(active.point.bucket, trend.granularity, timezone)}
              </Text>

              <Text as='span' className={styles.tooltipValue} size='md' weight={700}>
                {formatCurrency(pointRevenue, { currency })}
              </Text>

              {/* Relevant per-point breakdown: orders, average ticket and the
                  share this point represents of the period total. */}
              <span className={styles.tooltipRows}>
                <span className={styles.tooltipRow}>
                  <Icon
                    color={getGlobalStyle('--color-icons-white')}
                    icon='IconShopping'
                    size={13}
                  />
                  <Text as='span' className={styles.tooltipMeta} size='sm'>
                    {ordersLabel(pointOrders)}
                  </Text>
                </span>

                {pointOrders > 0 && (
                  <span className={styles.tooltipRow}>
                    <Icon
                      color={getGlobalStyle('--color-icons-white')}
                      icon='IconDollar'
                      size={13}
                    />
                    <Text as='span' className={styles.tooltipMeta} size='sm'>
                      Ticket prom. {formatCurrency(pointTicket, { currency })}
                    </Text>
                  </span>
                )}

                {shareOfTotal > 0 && (
                  <span className={styles.tooltipRow}>
                    <Icon
                      color={getGlobalStyle('--color-icons-white')}
                      icon='IconChart'
                      size={13}
                    />
                    <Text as='span' className={styles.tooltipMeta} size='sm'>
                      {shareOfTotal}% del periodo
                    </Text>
                  </span>
                )}
              </span>
            </div>
          )
        })()}
      </div>
    )
  }

  return (
    <section
      aria-busy={loading}
      aria-label='Tendencia de ventas'
      className={styles.panel}
    >
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Text
            as='h2'
            className={styles.title}
            size='xl'
            weight={700}
          >
            Tendencia de ventas
          </Text>

          {trend && (
            <>
              <div className={styles.headerStats}>
                <span className={styles.amount}>
                  <Text
                    as='span'
                    className={styles.amountSymbol}
                    size='2xl'
                    weight={700}
                  >
                    {currencySymbol}
                  </Text>

                  <CounterAnimation
                    number={totalRevenue}
                    numberformat
                    size='1.75rem'
                  />
                </span>

                <Text
                  as='span'
                  className={styles.ordersCount}
                  size='md'
                >
                  {ordersLabel(totalOrders)}
                </Text>
              </div>

              {/* Period context: average ticket and the series granularity. */}
              <div className={styles.headerSub}>
                {totalOrders > 0 && (
                  <Text as='span' className={styles.headerSubItem} size='sm'>
                    Promedio de ventas{' '}
                    <strong>
                      {formatCurrency(averageTicket(totalRevenue, totalOrders), { currency })}
                    </strong>
                  </Text>
                )}
                <span className={styles.granularityTag}>
                  {granularityLabel(trend.granularity)}
                </span>
              </div>
            </>
          )}
        </div>

        {loading && !isInitialLoading && (
          <span
            aria-label='Actualizando información'
            className={styles.refreshIndicator}
          />
        )}
      </header>

      {renderBody()}
    </section>
  )
}

SalesTrendChart.propTypes = {
  filter: PropTypes.object.isRequired,
  currency: PropTypes.string
}
