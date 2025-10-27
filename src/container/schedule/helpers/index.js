export function autocompleteStoreSchedules(storeSchedules) {
  // Definimos los valores predeterminados para schHoSta y schHoEnd
  const defaultStartTime = ''
  const defaultEndTime = ''

  // Días de la semana en formato numérico (de 0 a 6)
  const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]

  // Creamos un nuevo array para almacenar los horarios autocompletados
  const autocompletedSchedules = []

  // Iteramos sobre cada día de la semana
  daysOfWeek.forEach(day => {
    // Verificamos si existe un horario para el día actual en el array original
    const existingSchedule = storeSchedules?.find(schedule => {return schedule.schDay === day})

    // Si no existe un horario para el día actual, lo autocompletamos
    if (!existingSchedule) {
      autocompletedSchedules.push({
        '__typename': 'StoreSchedule',
        'schId': generateUUID(), // Generamos un nuevo ID para el horario
        'idStore': storeSchedules?.length > 0 ? storeSchedules[0]?.idStore : 0, // Utilizamos el mismo ID de tienda que el primer horario
        'schDay': day,
        'schHoSta': defaultStartTime,
        'schHoEnd': defaultEndTime,
        'schState': 0
      })
    } else {
      // Si existe un horario para el día actual, lo agregamos al array autocompletado
      autocompletedSchedules.push(existingSchedule)
    }
  })

  return autocompletedSchedules
}

// Función para generar un UUID (identificador único universal)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
