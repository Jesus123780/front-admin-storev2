'use client'

import PropTypes from 'prop-types'

import styles from './styles.module.css'

/**
 * Minimal, dependency-free SVG sparkline. Renders nothing meaningful when the
 * series has fewer than two finite points (avoids drawing a flat decorative
 * line that implies data where there is none).
 *
 * @param {object} props - Component props.
 * @param {number[]} props.data - Numeric series.
 * @param {string} [props.stroke] - Stroke color (token value).
 * @param {string} [props.fill] - Area fill color (token value), optional.
 * @param {number} [props.width] - SVG width.
 * @param {number} [props.height] - SVG height.
 * @param {string} [props.ariaLabel] - Accessible description.
 * @returns {JSX.Element|null} The sparkline or null when there is no series.
 */
export const Sparkline = ({
  data = [],
  stroke = 'var(--color-feedback-success-dark)',
  fill = 'transparent',
  width = 96,
  height = 32,
  ariaLabel = 'Tendencia'
}) => {
  const points = Array.isArray(data) ? data.filter((n) => Number.isFinite(Number(n))).map(Number) : []

  if (points.length < 2) {
    return <span aria-hidden='true' className={styles.placeholder} style={{ width, height }} />
  }

  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const stepX = width / (points.length - 1)

  const coords = points.map((value, index) => {
    const x = index * stepX
    // Leave a 2px vertical padding so the stroke is never clipped.
    const y = height - 2 - ((value - min) / range) * (height - 4)
    return [x, y]
  })

  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`

  return (
    <svg
      aria-label={ariaLabel}
      className={styles.svg}
      height={height}
      preserveAspectRatio='none'
      role='img'
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      {fill !== 'transparent' && <path d={areaPath} fill={fill} stroke='none' />}
      <path d={linePath} fill='none' stroke={stroke} strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
    </svg>
  )
}

Sparkline.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number),
  stroke: PropTypes.string,
  fill: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  ariaLabel: PropTypes.string
}
