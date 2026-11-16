'use client'
import PropTypes from 'prop-types'
import { useId } from 'react'
import styles from './styles.module.css'

export const Sparkline = ({ data = [], stroke = 'var(--color-feedback-success-dark)', fill = 'transparent', width = 96, height = 32, ariaLabel = 'Tendencia' }) => {
  const id = `spark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const values = Array.isArray(data) ? data.map(v => typeof v === 'number' && Number.isFinite(v) ? v : null) : []
  const known = values.filter(v => v !== null)
  if (known.length < 2 || width <= 6 || height <= 6) return null
  const min = Math.min(...known), max = Math.max(...known)
  const range = max - min
  const groups = []
  let group = []
  values.forEach((v, i) => {
    if (v === null) { if (group.length) groups.push(group); group = []; return }
    group.push([3 + i * (width - 6) / (values.length - 1), range ? height - 3 - (v - min) / range * (height - 6) : height / 2])
  })
  if (group.length) groups.push(group)
  const line = points => points.map(([x,y],i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  return (
    <svg aria-label={ariaLabel} role='img' className={styles.svg} viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio='none'>
      <defs><linearGradient id={id} x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor={fill} stopOpacity='.22'/><stop offset='100%' stopColor={fill} stopOpacity='0'/></linearGradient></defs>
      {groups.map((points,i) => points.length === 1 ? <circle key={i} cx={points[0][0]} cy={points[0][1]} r='2' fill={stroke}/> : (
        <g key={i}>
          {fill !== 'transparent' && <path d={`${line(points)} L${points.at(-1)[0]},${height} L${points[0][0]},${height} Z`} fill={`url(#${id})`}/>}
          <path d={line(points)} stroke={stroke} strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round' vectorEffect='non-scaling-stroke' fill='none'/>
        </g>
      ))}
    </svg>
  )
}
Sparkline.propTypes = { data: PropTypes.arrayOf(PropTypes.number), stroke: PropTypes.string, fill: PropTypes.string, width: PropTypes.number, height: PropTypes.number, ariaLabel: PropTypes.string }
