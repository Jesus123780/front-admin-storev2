'use client'

import React from 'react'

/**
 * Componente para mostrar una lista de horarios.
 */
type Schedule = {
  schDay?: number
  day?: number
  schHoSta?: string
  schHoEnd?: string
}

type ListSchedulesProps = {
  style?: React.CSSProperties
  totalWidth?: number
  isMobile?: boolean
  uniqueHours?: string[]
  combinedArray?: Schedule[]
  data?: Schedule[]
  lastDay?: number
  columnIndex?: number
  isChart?: boolean
  openStoreEveryDay?: boolean
  showTiming?: number
  days?: string[]
  dayWidth?: number
  handleHourPmAM?: (time: string) => string
  calculateYPosition?: (time: string) => number
  handleClick?: (day: number, s?: Schedule) => void
  calculateTimeLinesHeight?: () => number
  calculateDurationInHours?: (start: string, end: string) => number
}

export const ListSchedules: React.FC<ListSchedulesProps> = ({
  columnIndex = 0,
  combinedArray = [],
  data = [],
  days = [],
  dayWidth = 155,
  isChart = false,
  isMobile = false,
  lastDay = -1,
  openStoreEveryDay = false,
  showTiming = -1,
  style = {},
  uniqueHours = [],
  handleHourPmAM = (time: string) => time,
  calculateYPosition = (time: string) => 0,
  handleClick = () => {},
  calculateTimeLinesHeight = () => 0,
  calculateDurationInHours = () => 1
}) => {
  let localColumnIndex = columnIndex
  let localLastDay = lastDay

  if (isChart || isMobile) {
    return (
      <div style={{ ...style, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data && combinedArray?.map((s, i) => {
          const start = handleHourPmAM(s.schHoSta || '')
          const end = handleHourPmAM(s.schHoEnd || '')
          const dayIdx = s.schDay ?? s.day ?? 0
          return (
            <div
              key={i + 1}
              style={{
                margin: 10,
                padding: 12,
                borderRadius: 8,
                background: dayIdx === showTiming ? '#e0f7fa' : '#fff',
                border: '1px solid #ddd',
                boxShadow: dayIdx === showTiming ? '0 0 8px #b2ebf2' : undefined,
                cursor: openStoreEveryDay ? 'not-allowed' : 'pointer',
                opacity: openStoreEveryDay ? 0.6 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onClick={() => { if (!openStoreEveryDay) {handleClick(Number(dayIdx))} }}
            >
              <div style={{ fontWeight: 600 }}>{days[Number(dayIdx)]}</div>
              <div style={{ fontSize: '1em' }}>{start} - {end}</div>
            </div>
          )
        })}
        {!data && <div>Agenda tus horarios</div>}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {!isChart && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 2,
          height: '100%',
          background: '#eee'
        }} />
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Time lines */}
        <div style={{ position: 'relative', height: `${calculateTimeLinesHeight()}px` }}>
          {uniqueHours.map(hour => {
            const regex = /^(\d{1,2}:\d{2})/
            const match = hour.match(regex)
            const firstHour = match ? match[1] : hour
            const top = calculateYPosition(firstHour)
            return (
              <div key={hour} style={{ position: 'absolute', top, left: 0, width: '100%' }}>
                <span style={{
                  fontSize: '1.1em',
                  fontWeight: 400,
                  padding: '0 0 20px 0',
                  filter: openStoreEveryDay ? 'grayscale(1)' : ''
                }}>{hour}</span>
                <div style={{
                  position: 'absolute',
                  left: 60,
                  right: 0,
                  top: 12,
                  height: 1,
                  background: '#eee'
                }} />
              </div>
            )
          })}
        </div>
        {/* Schedule cards */}
        <div style={{ position: 'relative', width: '100%' }}>
          {data && combinedArray?.map((s, i) => {
            const day = s.schDay !== undefined ? s.schDay : s.day ?? 0
            const start = handleHourPmAM(s.schHoSta || '')
            const end = handleHourPmAM(s.schHoEnd || '')
            const duration = calculateDurationInHours(s.schHoSta || '', s.schHoEnd || '')
            const yPosition = (calculateYPosition(s.schHoSta || '') || 0) * 40
            const xPosition = localColumnIndex * dayWidth

            if (localLastDay !== day) {
              localColumnIndex++
            }
            localLastDay = day

            return (
              <div
                key={i + 1}
                style={{
                  position: 'absolute',
                  left: Math.max(0, xPosition),
                  top: yPosition,
                  height: `${Math.max(duration * 40, 60)}px`,
                  width: `${dayWidth - 10}px`,
                  padding: 5,
                  borderRadius: 5,
                  boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
                  background: s.schHoSta ? '#fff' : '#e3f2fd',
                  border: '1px solid #ddd',
                  filter: openStoreEveryDay ? 'grayscale(1)' : '',
                  cursor: openStoreEveryDay ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => { if (!openStoreEveryDay) {handleClick(day, s)} }}
              >
                <div style={{
                  fontSize: '1em',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: s.schHoSta ? '#222' : '#1976d2'
                }}>
                  {days[day]}
                </div>
                <div style={{ textAlign: 'center' }}>
                  {start ? `${start} - ${end}` : 'Sin horarios'}
                </div>
              </div>
            )
          })}
          {!data && <div>Agenda tus horarios</div>}
        </div>
      </div>
    </div>
  )
}
