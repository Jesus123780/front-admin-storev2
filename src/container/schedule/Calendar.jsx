import { PVColor, BGColor, PColor } from 'pkg-components'

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
    <div>
      {daysOfWeek.map((day, dayIndex) => {return (
        <div isDay={dayIndex === new Date().getDay()} key={day}>
          <div>{day}</div>
          <div className='circle-day'>
            {new Date(currentYear, currentMonth, new Date().getDate() + (dayIndex - currentDay)).getDate()}
          </div>
        </div>
      )})}
      {times.map(time => {return (
        <>
          <div isEvenHour={time % 2 === 0} key={`time-${time}`}>
            {time === currentHour && (
              <CurrentTimeIndicator topPercentage={(time * 100) / 24} />
            )}
            <span>{`${time.toString().padStart(2, '0')}:00`}</span>
            {time !== 23 && (
              <div>
                <span>30 min</span>
              </div>
            )}
          </div>
          {daysOfWeek.map((day, dayIndex) => {
            return (
              <div key={`${day}-${time}`}>
                <div>
                  <span>30 min</span>
                </div>
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
              </div>
            )
          })}
        </>
      )})}
    </div>
  )
}

export default MyCalendar
