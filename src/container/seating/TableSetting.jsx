'use client'

import { Text } from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'

import styles from './style.module.css'

/**
 * Clamp a number between min and max.
 * @param {number} v
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

/**
 * Distribute seats to 4 sides (top, right, bottom, left).
 * Special waiter-friendly rules:
 * - 1 seat -> top (center)
 * - 2 seats -> top & bottom (opposite)
 * - otherwise -> distribute evenly with remainder to top->right->bottom->left
 * @param {number} n
 * @returns {number[]} [top, right, bottom, left]
 */
const distributeSeatsToSides = (n) => {
  if (!Number.isInteger(n) || n <= 0) {return [0, 0, 0, 0]}
  if (n === 1) {return [1, 0, 0, 0]} // one seat — show at top center (waiter-facing)
  if (n === 2) {return [1, 0, 1, 0]} // two seats — opposite (top & bottom) — waiter-friendly

  const base = Math.floor(n / 4)
  const rem = n % 4
  const counts = [base, base, base, base]
  for (let i = 0; i < rem; i++) {counts[i]++}
  return counts
}

/**
 * Compute seat inline style for a side.
 * Avoids corners using paddingPercent and places seats evenly.
 * @param {number} side - 0=top,1=right,2=bottom,3=left
 * @param {number} idx - index on that side (0-based)
 * @param {number} count - seats on that side
 * @param {number} paddingPercent - corner padding percent
 * @returns {object}
 */
const seatStyleForSide = (side, idx, count, paddingPercent = 8) => {
  if (count <= 0) {return {}}
  const available = 100 - paddingPercent * 2
  const posPercent = count === 1 ? 50 : paddingPercent + (available * (idx / (count - 1)))

  switch (side) {
    case 0:
      return { top: '-5%', left: `${posPercent}%`, transform: 'translate(-50%, -100%)' }
    case 1:
      return { right: '-5%', top: `${posPercent}%`, transform: 'translate(100%, -50%)' }
    case 2:
      return { bottom: '-5%', left: `${posPercent}%`, transform: 'translate(-50%, 100%)' }
    case 3:
      return { left: '-5%', top: `${posPercent}%`, transform: 'translate(-100%, -50%)' }
    default:
      return {}
  }
}

/**
 * TableSetting component — arranges seats symmetrically and waiter-friendly.
 *
 * - Prefers explicit `number` prop.
 * - Falls back to Math.max(...list) if number missing.
 * - Clamped between 1 and MAX_ALLOWED_SEATS.
 *
 * @param {object} props
 * @param {boolean} props.loading
 * @param {number|null} props.number
 * @param {number|null} props.index
 * @param {number[]} props.list
 */
export const TableSetting = ({ loading = false, number = null, index = null, list = [] }) => {
  const MAX_ALLOWED_SEATS = 30

  // derive fallback from list safely
  const maxFromList =
    Array.isArray(list) && list.length > 0
      ? Math.max(...list.map((v) => (Number.isInteger(v) && v > 0 ? v : 0)))
      : 0

  const requested = Number.isInteger(number) && number > 0 ? number : (maxFromList || 4)
  const limitedSeats = clamp(requested, 1, MAX_ALLOWED_SEATS)

  // distribute seats using waiter-friendly logic
  const counts = distributeSeatsToSides(limitedSeats)

  // build seat descriptors in order top->right->bottom->left
  const seatDescriptors = []
  for (let side = 0; side < 4; side++) {
    const countOnSide = counts[side]
    for (let i = 0; i < countOnSide; i++) {
      seatDescriptors.push({ side, indexOnSide: i, countOnSide })
    }
  }

  // table sizing (keeps aspect similar to your reference)
  const baseW = 120
  const baseH = 100
  const extraPerSeat = 12
  const tableWidth = baseW + Math.max(0, limitedSeats - 4) * extraPerSeat
  const tableHeight = baseH

  // seat sizing tuned to look like the reference cards
  const maxSideCount = Math.max(...counts)
  const seatPadding = 8
  const seatWidthPercent = Math.max(18, Math.min(36, Math.round(90 / Math.max(1, maxSideCount))))

  const sideLabels = ['top', 'right', 'bottom', 'left']

  return (
    <div className={styles.container} aria-live="polite">
      <div
        className={styles.table}
        style={{ width: `${tableWidth}px`, height: `${tableHeight}px`, position: 'relative' }}
        role="group"
        aria-label={`Table with ${limitedSeats} seats`}
      >
        {!loading && (
          <div className={styles.number_table}>
            <Text size="sm" weight="semibold">
              {Number((index || 0) + 1)}
            </Text>
          </div>
        )}

        {seatDescriptors.map((sd, i) => {
          const { side, indexOnSide, countOnSide } = sd
          const inline = {
            ...seatStyleForSide(side, indexOnSide, countOnSide, seatPadding),
            width: side % 2 === 0 ? `${seatWidthPercent}%` : `${Math.round(baseH * 0.35)}px`,
            height: side % 2 === 0 ? `${Math.round(baseH * 0.36)}px` : `${Math.round(baseH * 0.28)}%`
          }
          const dataSide = sideLabels[side] || 'left'
          return (
            <div
              key={`seat-${i + 1}`}
              className={styles.seat}
              data-side={dataSide}
              style={inline}
              role="button"
              tabIndex={0}
              aria-label={`Seat ${i + 1} on ${dataSide}`}
            >
              <span className={styles.seatLabel}>{i + 1}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

TableSetting.propTypes = {
  list: PropTypes.arrayOf(PropTypes.number),
  loading: PropTypes.bool,
  number: PropTypes.number,
  index: PropTypes.number
}
