'use client'

import { useSalesByCategory } from 'npm-pkg-hook'
import {
  CounterAnimation,
  getGlobalStyle,
  Icon,
  Text
} from 'pkg-components'
import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'

import {
  DEFAULT_TIMEZONE,
  formatCurrency,
  formatNumber,
  getCurrencySymbol
} from '../../utils/format'
import { buildPeriodFilter, getTodayInTimezone } from '../../utils/period'
import { WidgetError } from '../WidgetError'
import styles from './styles.module.css'

/**
 * Token-based palette with enough distinct hues for dashboard categories.
 * The last color is reserved for the aggregated "other categories" segment.
 *
 * @type {string[]}
 */
const PALETTE = [
  // Menta — Brand palette
  '#1EA664',
  '#2ECC71',
  '#3DD68C',
  '#5FD39B',
  '#17B890',
  '#0E8A5F',
  '#7BE0AE',
  '#43C59E',
  '#A8E6C5',

  // Blue
  '#0062FF',
  '#006C85',

  // Orange / Yellow
  '#E07C00',
  '#CC870F',

  // Red / Pink
  '#A21B11',
  '#EE0000',
  '#FFC2C2',

  // Neutral
  '#666666',
  '#C4C4C4'
]

const CENTER = 100
const RADIUS = 80
const STROKE_WIDTH = 20
const DEFAULT_SEGMENT_GAP = 3
const DEFAULT_MAX_VISIBLE_ITEMS = 4
const DEFAULT_MAX_CHART_SEGMENTS = 10
const CORNER_SLOTS = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']

/**
 * Converts an unknown value to a finite, non-negative number.
 * Invalid, negative and infinite values are normalized to zero.
 *
 * @param {unknown} value - Value received from the API.
 * @returns {number} A finite non-negative number.
 */
const toFiniteNumber = (value) => {
  if (typeof value === 'number') {return Number.isFinite(value) ? value : NaN}
  if (typeof value !== 'string' || value.trim() === '') {return NaN}

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : NaN
}

/**
 * Converts an unknown API value to a finite, non-negative number.
 * Invalid, negative and infinite values are normalized to zero.
 *
 * @param {unknown} value - Value received from the API.
 * @returns {number} A finite non-negative number.
 */
const toNonNegativeNumber = (value) => {
  const parsed = toFiniteNumber(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/**
 * Returns a safe positive integer for configurable item limits.
 *
 * @param {unknown} value - Configured limit.
 * @param {number} fallback - Fallback used when the value is invalid.
 * @param {number} [minimum=1] - Minimum allowed value.
 * @returns {number} A valid positive integer.
 */
const toPositiveInteger = (value, fallback, minimum = 1) => {
  const numericValue = toFiniteNumber(value)
  const parsed = Math.floor(numericValue)

  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback
}

/**
 * Adds monetary values with compensated summation to reduce floating-point
 * accumulation errors when the API sends decimal values.
 *
 * @param {number[]} values - Values to add.
 * @returns {number} The accumulated finite total.
 */
const sumPrecisely = (values) => {
  let total = 0
  let compensation = 0

  values.forEach((value) => {
    const adjusted = value - compensation
    const nextTotal = total + adjusted

    compensation = (nextTotal - total) - adjusted
    total = nextTotal
  })

  return Number.isFinite(total) ? total : 0
}

/**
 * Normalizes API slices and assigns a deterministic token color by source
 * order. Categories with no revenue are retained for the detailed legend.
 *
 * @param {unknown} input - Raw slices returned by the dashboard API.
 * @returns {Array<object>} Normalized category slices.
 */
const normalizeSlices = (input) => {
  if (!Array.isArray(input)) {return []}

  return input.reduce((result, slice, index) => {
    if (!slice || typeof slice !== 'object' || Array.isArray(slice)) {
      return result
    }

    const revenue = toNonNegativeNumber(slice.revenue)
    const units = toNonNegativeNumber(slice.units)
    const categoryId = typeof slice.categoryId === 'string' && slice.categoryId.trim()
      ? slice.categoryId.trim()
      : null
    const categoryName = typeof slice.categoryName === 'string' && slice.categoryName.trim()
      ? slice.categoryName.trim()
      : 'Categoría sin nombre'

    // Ignore only records that carry neither identity nor useful metrics.
    if (!categoryId && revenue === 0 && units === 0) {return result}

    result.push({
      key: categoryId ?? `${categoryName}-${index}`,
      categoryId,
      categoryName,
      revenue,
      units,
      sourceIndex: index,
      color: PALETTE[index % (PALETTE.length - 1)]
    })

    return result
  }, [])
}

/**
 * Converts a polar coordinate to an SVG point. Zero degrees starts at 12
 * o'clock and angles increase clockwise.
 *
 * @param {number} angle - Angle in degrees.
 * @param {number} radius - Circle radius.
 * @returns {{ x: number, y: number }} SVG coordinates.
 */
const polarToXY = (angle, radius) => {
  const radians = ((angle - 90) * Math.PI) / 180

  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians)
  }
}

/**
 * Creates an SVG arc path between two clockwise angles.
 *
 * @param {number} startAngle - Starting angle in degrees.
 * @param {number} endAngle - Ending angle in degrees.
 * @param {number} radius - Circle radius.
 * @returns {string} SVG path definition.
 */
const createArcPath = (startAngle, endAngle, radius) => {
  const start = polarToXY(startAngle, radius)
  const end = polarToXY(endAngle, radius)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${start.x.toFixed(5)} ${start.y.toFixed(5)}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(5)} ${end.y.toFixed(5)}`
  ].join(' ')
}

/**
 * Limits the number of SVG segments. When the limit is exceeded, the remaining
 * revenue is represented by one "Otras categorías" segment so the chart still
 * sums to exactly 100% of the normalized revenue total.
 *
 * @param {Array<object>} slices - Normalized category slices.
 * @param {number} maxSegments - Maximum number of visible SVG segments.
 * @returns {Array<object>} Positive-revenue slices ready for chart rendering.
 */
const getChartSlices = (slices, maxSegments) => {
  const ranked = slices
    .filter((slice) => slice.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue || a.sourceIndex - b.sourceIndex)

  if (ranked.length <= maxSegments) {return ranked}

  const visibleCount = Math.max(1, maxSegments - 1)
  const visible = ranked.slice(0, visibleCount)
  const remainder = ranked.slice(visibleCount)

  visible.push({
    key: '__other_categories__',
    categoryId: null,
    categoryName: 'Otras categorías',
    revenue: sumPrecisely(remainder.map((slice) => slice.revenue)),
    units: sumPrecisely(remainder.map((slice) => slice.units)),
    sourceIndex: Number.MAX_SAFE_INTEGER,
    color: PALETTE[PALETTE.length - 1],
    isAggregate: true
  })

  return visible
}

/**
 * Builds proportional arcs using a physical gap measured in SVG user units.
 * Each gap is exactly `gapSize` pixels along the donut centerline (2.5px by
 * default), rather than a fixed angle that would distort small categories.
 *
 * @param {Array<object>} slices - Positive-revenue chart slices.
 * @param {number} total - Sum of all normalized category revenues.
 * @param {object} options - Geometry options.
 * @param {number} options.radius - Donut centerline radius.
 * @param {number} options.gapSize - Desired gap in SVG user units.
 * @returns {Array<object>} Slices enriched with exact SVG arc geometry.
 */
const buildDonutArcs = (slices, total, { radius, gapSize }) => {
  if (total <= 0 || slices.length === 0) {return []}

  if (slices.length === 1) {
    return [{ ...slices[0], isFullCircle: true, hasArc: true }]
  }

  const circumference = 2 * Math.PI * radius
  const capAllowance = STROKE_WIDTH
  const requestedGap = Math.max(0, gapSize)

  const safeGap = Math.min(
    requestedGap + capAllowance,
    circumference / (slices.length * 2)
  )
  const availableLength = circumference - (safeGap * slices.length)

  let cursor = safeGap / 2

  return slices.map((slice) => {
    const arcLength = availableLength * (slice.revenue / total)
    const startAngle = (cursor / radius) * (180 / Math.PI)
    const endAngle = ((cursor + arcLength) / radius) * (180 / Math.PI)

    cursor += arcLength + safeGap

    return {
      ...slice,
      hasArc: arcLength > 0,
      isFullCircle: false,
      arcLength,
      d: createArcPath(startAngle, endAngle, radius)
    }
  })
}

/**
 * Formats a revenue share from the unrounded ratio. Rounding is applied only
 * for presentation; SVG geometry always uses the original numeric ratio.
 *
 * @param {number} revenue - Category revenue.
 * @param {number} total - Total revenue.
 * @returns {string} Percentage formatted with two decimal places.
 */
const formatShare = (revenue, total) => {
  const percentage = total > 0 ? (revenue / total) * 100 : 0

  return `${percentage.toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`
}

/**
 * Sales-by-category dashboard widget with an animated SVG donut, precise
 * proportional segments, an interactive legend and explicit loading/error
 * states. The displayed total and all percentages are derived from the same
 * normalized slice values, preventing chart/legend total mismatches.
 *
 * @param {object} props - Component properties.
 * @param {object} props.filter - DashboardFilterInput for the active period.
 * @param {string} [props.currency='COP'] - ISO currency code.
 * @param {number} [props.maxVisibleItems=4] - Initial number of legend rows.
 * @param {number} [props.maxChartSegments=10] - Maximum number of rendered arcs.
 * @param {number} [props.segmentGap=2.5] - Gap between arcs in SVG pixels.
 * @returns {JSX.Element} Sales-by-category panel.
 */
export const SalesByCategoryChart = ({
  filter,
  currency = 'COP',
  maxVisibleItems = DEFAULT_MAX_VISIBLE_ITEMS,
  maxChartSegments = DEFAULT_MAX_CHART_SEGMENTS,
  segmentGap = DEFAULT_SEGMENT_GAP
}) => {
  // When embedded in the GridStack dashboard the component is rendered with the
  // grid's coordinate payload (not a DashboardFilterInput). Detect a real
  // period filter and otherwise default to "today" in the business timezone, so
  // the widget works both inside InventoryC (with a shared filter) and
  // standalone on the dashboard.
  const resolvedFilter = useMemo(() => {
    const isPeriodFilter = filter !== null &&
      filter !== undefined &&
      typeof filter === 'object' &&
      ('preset' in filter || 'from' in filter || 'referenceDate' in filter || 'startAt' in filter)

    if (isPeriodFilter) {return filter}

    return buildPeriodFilter({
      preset: 'day',
      referenceDate: getTodayInTimezone(DEFAULT_TIMEZONE),
      customRange: null,
      timezone: DEFAULT_TIMEZONE
    })
  }, [filter])

  const [data, { loading, error, refetch }] = useSalesByCategory(resolvedFilter)
  const [activeKey, setActiveKey] = useState(null)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const visibleLimit = toPositiveInteger(maxVisibleItems, DEFAULT_MAX_VISIBLE_ITEMS)
  const chartLimit = toPositiveInteger(maxChartSegments, DEFAULT_MAX_CHART_SEGMENTS, 2)
  const gapSize = Number.isFinite(Number(segmentGap)) && Number(segmentGap) >= 0
    ? Number(segmentGap)
    : DEFAULT_SEGMENT_GAP

  const slices = useMemo(
    () => normalizeSlices(data?.slices),
    [data?.slices]
  )

  // Derive the total from the same records used by the pie chart. This avoids
  // percentages that do not add up when totalRevenue and slices disagree.
  const total = useMemo(
    () => sumPrecisely(slices.map((slice) => slice.revenue)),
    [slices]
  )

  const chartSlices = useMemo(
    () => getChartSlices(slices, chartLimit),
    [slices, chartLimit]
  )

  const arcs = useMemo(
    () => buildDonutArcs(chartSlices, total, {
      radius: RADIUS,
      gapSize
    }),
    [chartSlices, total, gapSize]
  )

  const rankedSlices = useMemo(
    () => [...slices].sort((a, b) => (
      b.revenue - a.revenue ||
      b.units - a.units ||
      a.sourceIndex - b.sourceIndex
    )),
    [slices]
  )

  const legendSlices = showAllCategories
    ? rankedSlices
    : rankedSlices.slice(0, visibleLimit)

  const cornerLabels = useMemo(
    () => chartSlices
      .slice(0, 4)
      .map((slice, index) => ({
        ...slice,
        slot: CORNER_SLOTS[index]
      })),
    [chartSlices]
  )

  const currencySymbol = getCurrencySymbol(currency)
  const leadingSlice = rankedSlices.find((slice) => slice.revenue > 0)
  const isInitialLoading = loading && !data
  const hasCategories = slices.length > 0

  if (error && !data) {
    return (
      <section aria-label='Ventas por categoría' className={styles.panel}>
        <Text as='h2' className={styles.title} size='xl' weight={700}>
          Ventas por categoría
        </Text>
        <WidgetError onRetry={refetch} />
      </section>
    )
  }

  return (
    <section
      aria-busy={loading}
      aria-label='Ventas por categoría'
      className={styles.panel}
    >
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Text as='h2' className={styles.title} size='xl' weight={700}>
            Ventas por categoría
          </Text>
          {hasCategories && (
            <Text as='span' className={styles.subtitle} size='sm'>
              {slices?.length} categorías en el periodo
            </Text>
          )}
        </div>
        {loading && !isInitialLoading && (
          <span aria-label='Actualizando información' className={styles.refreshIndicator} />
        )}
      </header>

      {isInitialLoading ? (
        <div aria-busy='true' className={styles.skeleton} />
      ) : !hasCategories ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <Icon
              color={getGlobalStyle('--color-icons-gray-light')}
              icon='IconDonut'
              size={34}
            />
          </span>
          <Text as='p' className={styles.emptyTitle} size='md' weight={600}>
            Todavía no hay ventas
          </Text>
          <Text as='p' className={styles.emptyText} size='sm'>
            No hay movimientos por categoría durante el periodo seleccionado.
          </Text>
        </div>
      ) : (
        <>
          <div className={styles.chartArea}>
            {cornerLabels.map((slice) => (
              <div
                className={`${styles.cornerLabel} ${styles[slice.slot]} ${activeKey === slice.key ? styles.cornerActive : ''}`}
                key={slice.key}
                onMouseEnter={() => setActiveKey(slice.key)}
                onMouseLeave={() => setActiveKey(null)}
              >
                <span className={styles.cornerName} title={slice.categoryName}>
                  <span
                    aria-hidden='true'
                    className={styles.cornerDot}
                    style={{ backgroundColor: slice.color }}
                  />
                  {slice.categoryName}
                </span>
                <span className={styles.cornerValue}>
                  {slice.units} <small>uds.</small>
                </span>
              </div>
            ))}

            <div className={styles.donutWrap}>
              <svg
                aria-label={`Distribución de ingresos por categoría. Total ${formatCurrency(total, { currency })}.`}
                className={styles.donut}
                role='img'
                viewBox='0 0 200 200'
              >
                <circle
                  className={styles.track}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  strokeWidth={STROKE_WIDTH}
                />

                {arcs.map((arc, index) => {
                  if (!arc.hasArc) {return null}

                  const commonProps = {
                    className: `${styles.arc} ${activeKey === arc.key ? styles.arcActive : ''}`,
                    fill: 'none',
                    key: arc.key,
                    onMouseEnter: () => setActiveKey(arc.key),
                    onMouseLeave: () => setActiveKey(null),
                    pathLength: 1,
                    stroke: arc.color,
                    strokeLinecap: 'round',
                    strokeWidth: activeKey === arc.key ? STROKE_WIDTH + 3 : STROKE_WIDTH,
                    style: { '--arc-delay': `${index * 85}ms` }
                  }

                  return arc.isFullCircle
                    ? (
                      <circle
                        {...commonProps}
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                      />
                    )
                    : <path {...commonProps} d={arc.d} />
                })}
              </svg>

              <div className={styles.center}>
                <span className={styles.centerCaption}>VENTAS TOTALES</span>
                <span aria-live='polite' className={styles.centerValue}>
                  <Text as='span' className={styles.centerSymbol} size='md' weight={700}>
                    {currencySymbol}
                  </Text>
                  <CounterAnimation
                    number={total}
                    numberformat
                    size='1.25rem'
                  />
                </span>

                {leadingSlice && total > 0 ? (
                  <span className={styles.centerBadge}>
                    <Icon
                      color={getGlobalStyle('--color-text-white')}
                      icon='IconUpRightArrow'
                      size={12}
                    />
                    {formatShare(leadingSlice.revenue, total)}
                  </span>
                ) : (
                  <span className={styles.centerEmpty}>Sin ingresos</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.legendHeader}>
            <Text as='h3' className={styles.legendTitle} size='md' weight={700}>
              Detalle por categoría
            </Text>
            <Text as='span' className={styles.legendCount} size='xs'>
              {formatNumber(slices.length)} registros
            </Text>
          </div>

          <ul className={styles.legend}>
            {legendSlices.map((slice, index) => (
              <li
                className={`${styles.legendItem} ${activeKey === slice.key ? styles.legendActive : ''}`}
                key={slice.key}
                style={{ '--item-index': index }}
              >
                <button
                  aria-label={`Resaltar ${slice.categoryName}, ${formatShare(slice.revenue, total)} del total`}
                  aria-pressed={activeKey === slice.key}
                  className={styles.legendButton}
                  onBlur={() => setActiveKey((current) => (
                    current === slice.key ? null : current
                  ))}
                  onClick={() => setActiveKey(slice.key)}
                  onFocus={() => setActiveKey(slice.key)}
                  onMouseEnter={() => setActiveKey(slice.key)}
                  onMouseLeave={() => setActiveKey((current) => (
                    current === slice.key ? null : current
                  ))}
                  type='button'
                >
                  <span
                    aria-hidden='true'
                    className={styles.dot}
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className={styles.legendName} title={slice.categoryName}>
                    {slice.categoryName}
                  </span>
                  <span className={styles.legendMetrics}>
                    <span className={styles.legendValue}>
                      {formatCurrency(slice.revenue, { currency })}
                    </span>
                    <span className={styles.legendPct}>
                      {formatShare(slice.revenue, total)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {rankedSlices.length > visibleLimit && (
            <button
              aria-expanded={showAllCategories}
              className={styles.moreButton}
              onClick={() => setShowAllCategories((current) => !current)}
              type='button'
            >
              {showAllCategories
                ? 'Mostrar menos'
                : `Ver ${rankedSlices.length - visibleLimit} categorías más`}
              <span
                aria-hidden='true'
                className={`${styles.moreChevron} ${showAllCategories ? styles.moreChevronOpen : ''}`}
              />
            </button>
          )}
        </>
      )}
    </section>
  )
}

SalesByCategoryChart.propTypes = {
  filter: PropTypes.object,
  currency: PropTypes.string,
  maxVisibleItems: PropTypes.number,
  maxChartSegments: PropTypes.number,
  segmentGap: PropTypes.number
}
