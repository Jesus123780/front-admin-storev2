'use client'

import { Text } from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'

import styles from './style.module.css'

export const TableSetting = ({
  loading = false,
  number = null,
  index = null,
  list = []
}) => {

  const MAX_SEATS = list.reduce((acc, curr) => {return Math.max(acc, curr)}, 0)
  const limitedSeats = Math.min(number, MAX_SEATS) // Limit the number of seats to 12
    
  const baseTableSize = 100
  const tableWidth = limitedSeats > 4 ? baseTableSize + (limitedSeats - 4) * 25 : baseTableSize // Horizontal expansion
  const tableHeight = baseTableSize
  const seats = Array.from({ length: limitedSeats }, (_, i) => {return i + 1}) // Seat numbers
  
  /**
     * Calculate seat position and size based on seat index and side.
     * Seats are arranged to fill each side of the table dynamically.
     * @param {number} index - The seat index.
     * @returns {object} Style object with positioning and sizing.
     */
  const getSeatPosition = (index) => {
    const seatsPerSide = Math.ceil(limitedSeats / 4)
    const side = Math.floor(index / seatsPerSide) % 4
    const position = index % seatsPerSide
    const offsetPercent = ((position + 0.5) / seatsPerSide) * 100
    
    const seatStyle =
        side % 2 === 0
          ? { width: `${80 / seatsPerSide}%`, height: '15%', margin: '0 5%' }
          : { width: '8%', height: `${80 / seatsPerSide}%`, margin: '5% 0' }
    
    const positionStyle = (() => {
      switch (side) {
        case 0: // Top side
          return {
            top: '-10%',
            left: `${offsetPercent - 5}%`,
            transform: 'translate(-50%, -100%)'
          }
        case 1: // Right side
          return {
            right: '-10%',
            top: `${offsetPercent - 10}%`,
            transform: 'translate(100%, -40%)'
          }
        case 2: // Bottom side
          return {
            bottom: '-10%',
            left: `${offsetPercent - 5}%`,
            transform: 'translate(-50%, 100%)'
          }
        case 3: // Left side
          return {
            left: '-10%',
            top: `${offsetPercent}%`,
            transform: 'translate(-100%, -50%)'
          }
        default:
          return {}
      }
    })()
    
    return { ...seatStyle, ...positionStyle }
  }
  return (
    <div className={styles.container}>
      <div
        className={styles.table}
        style={{ width: `${tableWidth}px`, height: `${tableHeight}px` }}
      >
        {loading 
          ? null 
          :
          <div className={styles.number_table}>
            <Text size='sm' weight='semibold'>
              {Number((index || 0) + 1)}
            </Text>
          </div>
        }
        {seats.map((seat, index) => {
          const seatsPerSide = Math.ceil(limitedSeats / 4)
          const side = Math.floor(index / seatsPerSide) % 4

          const sideLabels = ['top', 'right', 'bottom', 'left']
          const dataSide = sideLabels[side] || 'left'

          return (
            <div
              className={styles.seat}
              data-side={dataSide}
              key={seat}
              style={getSeatPosition(index)}
            >
              {seat}
              <div className={styles.backrest}></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

TableSetting.propTypes = {
  list: PropTypes.array,
  loading: PropTypes.bool,
  number: PropTypes.number,
  index: PropTypes.number,
}
