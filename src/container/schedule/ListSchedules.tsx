'use client'

import { PColor,SEGColor } from 'pkg-components'
import React from 'react'

import {
  Card,
  ContainLine,
  LeftLine,
  Line,
  ListSchedulesContainer,
  ScheduleContent,
  ScheduleHeader,
  Text,
  TimeLines
} from './styled'

/**
 * Componente para mostrar una lista de horarios.
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.style - estilos del componente.
 * @param {number} props.totalWidth - Ancho total del componente.
 * @param {boolean} props.isMobile - Indica si se está visualizando en modo móvil.
 * @param {Array} props.uniqueHours - Lista de horas únicas.
 * @param {Array} props.combinedArray - Array combinado de datos.
 * @param {Array} props.data - Datos de horarios.
 * @param {number} props.lastDay - Último día procesado.
 * @param {number} props.columnIndex - Índice de la columna actual.
 * @param {boolean} props.isChart - Indica si se está en modo gráfico.
 * @param {boolean} props.openStoreEveryDay - Indica abierto siempre.
 * @param {number} props.showTiming - Hora que se está mostrando.
 * @param {Array} props.days - Lista de nombres de días.
 * @param {number} props.dayWidth - Ancho de cada día en el grid.
 * @param {function} props.handleHourPmAM - Función para manejar hora AM/PM.
 * @param {function} props.calculateYPosition - Función para calcular posición en el eje Y.
 * @param {function} props.handleClick - Función para manejar clic en horario.
 * @param {function} props.calculateDurationInHours - Función para calcular duración en horas.
 */
export const ListSchedules = ({
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
  handleHourPmAM = (time) => { return time },
  calculateYPosition = (time) => { return time || 0 },
  handleClick = () => { return },
  calculateTimeLinesHeight = () => { return },
  calculateDurationInHours = () => { return }
}) => {
  if (isChart || isMobile) {
    return (
      <ScheduleHeader isChart={isChart || isMobile} style={style}>
        {data ? combinedArray?.map((s, i) => {
          const start = handleHourPmAM(s.schHoSta)
          const end = handleHourPmAM(s.schHoEnd)
          return (
            <Card
              active={s.schDay === showTiming}
              current={s.schDay === showTiming}
              direction='column'
              key={i + 1}
              margin='10px'
              onClick={() => { return openStoreEveryDay ? () => { return } : handleClick(Number(s.schDay || s.day)) }}
            >
              <Text>
                {days[Number(s.schDay ?? s.day)]}</Text>
              <Text size='1em'>
                {start} - {end}
              </Text>
            </Card>
          )
        }) : <div>Agenda tus horarios</div>}
      </ScheduleHeader>
    )
  }


  return (
    <>
      {!isChart && <LeftLine />}
      <ListSchedulesContainer>
        <TimeLines style={{ height: `${calculateTimeLinesHeight()}px` }}>
          {uniqueHours.map(hour => {
            const regex = /^(\d{1,2}:\d{2})/
            const match = hour.match(regex)
            const firstHour = match ? match[1] : hour
            const top = calculateYPosition(firstHour)
            return (
              <ContainLine key={hour} top={top}>
                <Text
                  style={{
                    filter: openStoreEveryDay ? 'grayscale(1)' : '',
                    fontSize: '1.9em',
                    fontWeight: '400',
                    padding: '0 0 20px 0'
                  }}

                >{hour}</Text>
                <Line top={top} />
              </ContainLine>
            )
          })}

        </TimeLines>
        <ScheduleContent>
          {/* Aquí va tu código actual de Card con la Barra */}
          {data ? combinedArray?.map((s, i) => {
            const day = s.schDay !== undefined ? s.schDay : s.day
            const start = handleHourPmAM(s.schHoSta)
            const end = handleHourPmAM(s.schHoEnd)
            const duration = calculateDurationInHours(s.schHoSta, s.schHoEnd)
            const yPosition = calculateYPosition(s.schHoSta) * 40 // Calculamos la posición en el eje Y
            const xPosition = columnIndex * dayWidth // Ajusta el valor para adaptarse a la posición deseada en el eje X

            if (lastDay !== day) {
              columnIndex++
            }

            lastDay = day

            return (
              <Card
                active={day === showTiming}
                bgColor={s.schHoSta !== '' ? null : `${PColor}20`}
                current={day === showTiming}
                direction='column'
                key={i + 1}
                margin='0'
                onClick={() => { return openStoreEveryDay ? {} : handleClick(day, s) }}
                style={{
                  position: 'absolute',
                  filter: openStoreEveryDay ? 'grayscale(1)' : '',
                  height: `${Math.max(duration * 40, 60)}px`,
                  width: `${dayWidth - 10}px`,
                  left: `${Math.max(0, xPosition)}px`,
                  top: `${yPosition}px`,
                  padding: '5px',
                  borderRadius: '5px',
                  boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
                  backgroundColor: s.schHoSta !== '' ? 'white' : `${PColor}20`,
                  border: '1px solid #ddd'
                }}
              >
                <Text
                  style={{
                    fontSize: '1em', // Aumenta el tamaño de la fuente
                    textAlign: 'center',
                    fontWeight: '600', // Cambia el peso de la fuente
                    color: s.schHoSta !== '' ? '' : SEGColor
                  }}
                >
                  {days[day]}
                </Text>
                <Text
                  style={{ textAlign: 'center' }}
                >
                  {start ? `${start} - ${end}` : 'Sin horarios'}
                </Text>
              </Card>
            )
          })
            : <div>Agenda tus horarios</div>}
        </ScheduleContent>
      </ListSchedulesContainer>
    </>


  )
}
