'use client'
import React from 'react'
import styled from 'styled-components'
import { PVColor, BGColor, PColor } from 'pkg-components'

const CalendarContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: auto repeat(24, 1fr);
    height: 100vh;
    border-radius: 4px 4px 0px 0px;
    box-shadow: rgba(0, 0, 0, 0.14) 0px 1px 2px 0px, rgba(0, 0, 0, 0.12) 0px 0px 2px 0px;
    flex: 1 1 auto;
    width: 95%;
    margin: 8px 8px 0px;
    overflow: auto;
`

const DayNameCell = styled.div`
    display: flex;
    justify-content: start;
    align-items: start;
    border-bottom: 1px solid #D1D1D1;
    background-color: ${BGColor};
    font-weight: bold;
    padding: 20px;
    flex-direction: column;
    font-family: PFont-Light;
    color: #424242;
    font-size: var(--font-size-base);
    border-right: 1px solid #D1D1D1;
    .circle-day {
        margin-top: 10px;
        align-items: center;
        background-color: ${props => {return (props.isDay ? PVColor : '#ffffff')}};
        color: ${props => {return (props.isDay ? BGColor : '')}};
        display: flex;
        flex-wrap: wrap;
        font-weight: 600;
        height: 28px;
        justify-content: center;
        width: 28px;
        border-radius: 100%;
    }
`

const TimeCell = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-right: 1px solid #D1D1D1;
  background-color: ${props => {return (props.isEvenHour ? '#f4f4f4' : '#ffffff')}};
`

const HalfHourIndicator = styled.div`
  position: absolute;
  bottom: 0;
  display: flex;
  align-items: center;
  font-size: 8px;
  border-bottom: 1px dashed #ccc;
  border-right: none;
  padding-bottom: 2px;
`

const CurrentTimeIndicator = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: ${props => {return `${props.topPercentage}%`}};
  height: 2px;
  background-color: #ff0000;
`

const EventCell = styled.div`
  border-bottom: 1px solid #D1D1D1;
  border-right: 1px solid #D1D1D1;
  background-color: #fff;
  position: relative;
  height: 100px;
`

const HalfHourDivider = styled.div`
  position: absolute;
  bottom: 50%; /* Posiciona la línea en la mitad vertical */
  left: 0;
  right: 0;
  font-size: 8px;
  font-family: PFont-Regular;
  border-bottom: 1px dashed #ccc; /* Línea que divide a la mitad */
`

const MyCalendar = ({
  combinedArray,
  calculateDurationInHours = () => { return }
}) => {
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  const times = Array.from({ length: 24 }, (_, index) => {return index})
  const currentDate = new Date()
  const currentHour = currentDate.getHours()
  const currentDay = currentDate.getDay() // Día actual (0 para Domingo, 1 para Lunes, etc.)
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate() // Días en el mes actual

  const newArray = combinedArray.map((s, i) => {
    return {
      'day': s.schDay,
      'schHoSta': s.schHoSta || '',
      'schHoEnd': s.schHoEnd || ''
    }
  })
  const scheduleArray = newArray || []

  const calendarMatrix = Array.from({ length: 24 }, () =>
  {return Array.from({ length: 7 }, () => {return []})}
  )

  scheduleArray.forEach(schedule => {
    const dayIndex = schedule.day
    const startTime = schedule.schHoSta.split(':')
    const endTime = schedule.schHoEnd.split(':')
    const startHour = parseInt(startTime[0])
    const endHour = parseInt(endTime[0])
      
    for (let hour = startHour; hour <= endHour; hour++) {
      // Verifica si la hora ya está en el día actual, si no está, agrega la hora
      if (!calendarMatrix[hour][dayIndex].some(existingSchedule => {return existingSchedule.schId === schedule.schId})) {
        calendarMatrix[hour][dayIndex].push(schedule)
      }
    }
  })
      
  // Función para calcular la duración en horas entre dos horas en formato "HH:mm"
  // Función para calcular la duración en horas entre dos horas en formato "HH:mm"
  // Función para calcular y formatear la duración en horas y minutos entre dos horas en formato "HH:mm"
  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const totalStartMinutes = startHour * 60 + startMinute
    const totalEndMinutes = endHour * 60 + endMinute

    const durationInMinutes = totalEndMinutes - totalStartMinutes
    const hours = Math.floor(durationInMinutes / 60)
    const minutes = durationInMinutes % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }


  return (
    <CalendarContainer>
      {daysOfWeek.map((day, dayIndex) => {return (
        <DayNameCell isDay={dayIndex === new Date().getDay()} key={day}>
          <div>{day}</div>
          <div className='circle-day'>
            {new Date(currentYear, currentMonth, new Date().getDate() + (dayIndex - currentDay)).getDate()}
          </div>
        </DayNameCell>
      )})}
      {times.map(time => {return (
        <>
          <TimeCell isEvenHour={time % 2 === 0} key={`time-${time}`}>
            {time === currentHour && (
              <CurrentTimeIndicator topPercentage={(time * 100) / 24} />
            )}
            <span>{`${time.toString().padStart(2, '0')}:00`}</span>
            {time !== 23 && (
              <HalfHourIndicator>
                <span>30 min</span>
              </HalfHourIndicator>
            )}
          </TimeCell>
          {daysOfWeek.map((day, dayIndex) => {
            return (
              <EventCell key={`${day}-${time}`}>
                <HalfHourDivider>
                  <span>30 min</span>
                </HalfHourDivider>
                {calendarMatrix[time][dayIndex].map(schedule => {
                  // const duration = calculateDurationInHours(schedule.schHoSta, schedule.schHoEnd);

                  return (
                    <div
                      key={schedule.schId}
                      style={{
                        position: 'absolute',
                        backgroundColor: PColor,
                        zIndex: 9999
                        // height: `${duration * 40}px`,
                      }}
                    >
                      {`${schedule.schHoSta}-${schedule.schHoEnd}`}
                      <br></br>
                      {/* {`Duración: ${calculateDuration(schedule.schHoSta, schedule.schHoEnd)} horas`} */}
                    </div>
                  )
                })}
              </EventCell>
            )
          })}
        </>
      )})}
    </CalendarContainer>
  )
}

export default MyCalendar
