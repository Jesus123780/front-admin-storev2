'use client'

import {
 getGlobalStyle, Icon, Text 
} from 'pkg-components'
import PropTypes from 'prop-types'
import {
 useId, useMemo, useState 
} from 'react'

import { formatCompact } from '../../utils/format'
import styles from './styles.module.css'

const VIEWBOX_W = 720
const VIEWBOX_H = 260
const PADDING = { top: 24, right: 20, bottom: 28, left: 56 }
const X_INSET_LEFT = 10
const X_INSET_RIGHT = 6
const CURVE_TENSION = 0.16

/** @returns {{x:number,y:number}} An SVG coordinate. */
const createPoint = (x, y) => ({ x, y })

/**
 * Smooth cubic Bézier path through coordinates, with control points clamped to
 * each segment's y-range so the curve never overshoots past its data points.
 *
 * @param {Array<{x:number,y:number}>} coordinates - Ordered coordinates.
 * @returns {string} SVG path `d`.
 */
const createSmoothPath = (coordinates) => {
  if (coordinates.length === 0) { return '' }
  if (coordinates.length === 1) {
    const [first] = coordinates
    return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
  }

  return coordinates.reduce((path, current, index) => {
    if (index === 0) { return `M ${current.x.toFixed(2)} ${current.y.toFixed(2)}` }

    const previous = coordinates[index - 1]
    const beforePrevious = coordinates[index - 2] ?? previous
    const next = coordinates[index + 1] ?? current
    const deltaX = current.x - previous.x

    const minY = Math.min(previous.y, current.y)
    const maxY = Math.max(previous.y, current.y)
    const clampY = (y) => Math.min(Math.max(y, minY), maxY)

    const control1 = createPoint(
      previous.x + deltaX / 3,
      clampY(previous.y + (current.y - beforePrevious.y) * CURVE_TENSION)
    )
    const control2 = createPoint(
      current.x - deltaX / 3,
      clampY(current.y - (next.y - previous.y) * CURVE_TENSION)
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
 * Closes a line path into an area down to the baseline.
 *
 * @param {string} linePath - SVG line path.
 * @param {Array<{x:number,y:number}>} coordinates - Coordinates.
 * @param {number} baselineY - Baseline Y.
 * @returns {string} Closed area path.
 */
const createAreaPath = (linePath, coordinates, baselineY) => {
  if (!linePath || coordinates.length === 0) { return '' }
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
 * Resolves tooltip horizontal position + alignment, clamped inside the panel.
 *
 * @param {number} x - Active X coordinate.
 * @returns {object} Inline style for the tooltip.
 */
const getTooltipPosition = (x) => {
  const percentage = (x / VIEWBOX_W) * 100
  const clamped = Math.min(Math.max(percentage, 9), 91)
  const alignment = clamped <= 12 ? 'left' : clamped >= 88 ? 'right' : 'center'
  const translate = { left: '0', center: '-50%', right: '-100%' }
  return { left: `${clamped}%`, '--tooltip-offset': translate[alignment] }
}

/**
 * Generic, dependency-free multi-series area/line chart (SVG). Renders one or
 * more overlaid series sharing an X axis, a Y axis derived from the combined
 * max, a shared hover/focus tooltip and keyboard navigation. Values are plain
 * numbers; the caller supplies labels and a value formatter.
 *
 * Reused by the sales trend and inventory movements widgets so both charts look
 * and behave consistently.
 *
 * @param {object} props - Component props.
 * @param {string[]} props.labels - X-axis category labels (one per index).
 * @param {Array<{ key: string, label: string, color: string, values: number[] }>} props.series
 *   - One entry per series; `values` aligns index-for-index with `labels`.
 * @param {(value: number) => string} [props.formatValue] - Value formatter for
 *   the Y axis and tooltip. Defaults to compact number formatting.
 * @param {string} [props.ariaLabel] - Accessible chart label.
 * @param {string} [props.emptyMessage] - Message shown when there is no data.
 * @returns {JSX.Element} The chart.
 */
export const TrendAreaChart = ({
  labels = [],
  series = [],
  formatValue = formatCompact,
  ariaLabel = 'Gráfico de tendencia',
  emptyMessage = 'No hay datos para el periodo seleccionado.'
}) => {
  const [activeIndex, setActiveIndex] = useState(null)
  const rawId = useId().replace(/:/g, '')

  const geometry = useMemo(() => {
    const safeSeries = Array.isArray(series)
      ? series.filter((s) => s && Array.isArray(s.values) && s.values.length > 0)
      : []
    const count = labels.length
    if (count === 0 || safeSeries.length === 0) { return null }

    const innerWidth = VIEWBOX_W - PADDING.left - PADDING.right
    const innerHeight = VIEWBOX_H - PADDING.top - PADDING.bottom
    const plotWidth = Math.max(innerWidth - X_INSET_LEFT - X_INSET_RIGHT, 1)
    const plotLeft = PADDING.left + X_INSET_LEFT
    const baselineY = PADDING.top + innerHeight

    const max = Math.max(
      0,
      ...safeSeries.flatMap((s) => s.values.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0)))
    )
    const safeMax = max || 1
    const stepX = count > 1 ? plotWidth / (count - 1) : 0

    const xOf = (index) => (count > 1 ? plotLeft + index * stepX : plotLeft + plotWidth / 2)
    const yOf = (value) => baselineY - (Math.max(Number(value) || 0, 0) / safeMax) * innerHeight

    const built = safeSeries.map((s) => {
      const coords = labels.map((_, index) => ({ x: xOf(index), y: yOf(s.values[index] ?? 0) }))
      const line = createSmoothPath(coords)
      return { ...s, coords, line, area: createAreaPath(line, coords, baselineY) }
    })

    const ticks = max > 0
      ? [0, 0.25, 0.5, 0.75, 1].map((f) => ({ value: max * f, y: baselineY - f * innerHeight }))
      : [{ value: 0, y: baselineY }]

    // Shared hit areas (one per X index) that select all series at that index.
    const hotspots = labels.map((_, index) => {
      const x = xOf(index)
      const prevX = index > 0 ? xOf(index - 1) : x - (stepX || 24) / 2
      const nextX = index < count - 1 ? xOf(index + 1) : x + (stepX || 24) / 2
      const left = Math.max(plotLeft, (prevX + x) / 2)
      const right = Math.min(plotLeft + plotWidth, (x + nextX) / 2)
      return { x: left, width: Math.max(right - left, 1), centerX: x }
    })

    return { built, ticks, hotspots, innerHeight, baselineY }
  }, [labels, series])

  if (!geometry) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>
          <Icon color={getGlobalStyle('--color-icons-gray-light')} icon='IconChart' size={32} />
        </span>
        <Text as='p' className={styles.emptyText} size='sm'>{emptyMessage}</Text>
      </div>
    )
  }

  const gradientPrefix = `trendArea-${rawId}`
  const activeHotspot = activeIndex !== null ? geometry.hotspots[activeIndex] : null

  return (
    <div className={styles.chartWrap}>
      <svg
        aria-label={ariaLabel}
        className={styles.svg}
        preserveAspectRatio='none'
        role='img'
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      >
        <defs>
          {geometry.built.map((s, i) => (
            <linearGradient id={`${gradientPrefix}-${i}`} key={`grad-${s.key}`} x1='0' x2='0' y1='0' y2='1'>
              <stop offset='0%' stopColor={s.color} stopOpacity='0.22' />
              <stop offset='100%' stopColor={s.color} stopOpacity='0' />
            </linearGradient>
          ))}
        </defs>

        {/* Gridlines + Y axis */}
        <g>
          {geometry.ticks.map((tick, i) => (
            <g key={`tick-${i}`}>
              <line className={styles.gridline} x1={PADDING.left} x2={VIEWBOX_W - PADDING.right} y1={tick.y} y2={tick.y} />
              <text className={styles.axisLabel} textAnchor='end' x={PADDING.left - 8} y={tick.y + 4}>
                {formatValue(tick.value)}
              </text>
            </g>
          ))}
        </g>

        {/* Series (area + line) */}
        {geometry.built.map((s, i) => (
          <g key={`series-${s.key}`}>
            <path className={styles.area} d={s.area} fill={`url(#${gradientPrefix}-${i})`} />
            <path
              className={styles.line}
              d={s.line}
              fill='none'
              stroke={s.color}
              strokeLinecap='round'
              strokeLinejoin='round'
              vectorEffect='non-scaling-stroke'
            />
          </g>
        ))}

        {/* Active vertical guide + dots on each series */}
        {activeHotspot && (
          <g pointerEvents='none'>
            <line
              className={styles.activeLine}
              x1={activeHotspot.centerX}
              x2={activeHotspot.centerX}
              y1={PADDING.top}
              y2={geometry.baselineY}
            />
            {geometry.built.map((s) => (
              <circle
                className={styles.activeDot}
                cx={s.coords[activeIndex].x}
                cy={s.coords[activeIndex].y}
                key={`dot-${s.key}`}
                r={4}
                stroke={s.color}
              />
            ))}
          </g>
        )}

        {/* Hit areas */}
        {geometry.hotspots.map((hotspot, index) => (
          <rect
            aria-label={`${labels[index]}: ${geometry.built.map((s) => `${s.label} ${formatValue(s.values[index] ?? 0)}`).join(', ')}`}
            className={styles.hotspot}
            height={geometry.innerHeight}
            key={`hot-${index}`}
            onBlur={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            role='button'
            tabIndex={0}
            width={hotspot.width}
            x={hotspot.x}
            y={PADDING.top}
          />
        ))}
      </svg>

      {/* X axis labels */}
      <div className={styles.axisX}>
        {labels.map((label, index) => {
          const shouldShow = labels.length <= 8 ||
            index === 0 ||
            index === labels.length - 1 ||
            index % Math.ceil(labels.length / 8) === 0
          return (
            <span className={styles.axisXLabel} key={`xl-${index}`} title={label}>
              {shouldShow ? label : ''}
            </span>
          )
        })}
      </div>

      {/* Tooltip */}
      {activeHotspot && (
        <div aria-live='polite' className={styles.tooltip} style={getTooltipPosition(activeHotspot.centerX)}>
          <Text as='span' className={styles.tooltipDate} size='sm'>{labels[activeIndex]}</Text>
          <span className={styles.tooltipRows}>
            {geometry.built.map((s) => (
              <span className={styles.tooltipRow} key={`tr-${s.key}`}>
                <span aria-hidden='true' className={styles.tooltipDot} style={{ backgroundColor: s.color }} />
                <Text as='span' className={styles.tooltipLabel} size='sm'>{s.label}</Text>
                <Text as='span' className={styles.tooltipValue} size='sm' weight={700}>
                  {formatValue(s.values[activeIndex] ?? 0)}
                </Text>
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  )
}

TrendAreaChart.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string),
  series: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    values: PropTypes.arrayOf(PropTypes.number).isRequired
  })),
  formatValue: PropTypes.func,
  ariaLabel: PropTypes.string,
  emptyMessage: PropTypes.string
}
