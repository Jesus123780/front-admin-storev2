const numberFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' })

/** Calendar-only dates: avoid the browser's local timezone shifting a Monday. */
export const formatWeek = (start, end) => {
  const first = new Date(`${start}T00:00:00Z`)
  const last = new Date(`${end}T00:00:00Z`)
  const firstMonth = monthFormatter.format(first)
  const lastMonth = monthFormatter.format(last)
  const firstYear = first.getUTCFullYear()
  const lastYear = last.getUTCFullYear()
  const firstDay = first.getUTCDate()
  const lastDay = last.getUTCDate()

  if (firstYear !== lastYear) {
    return `${firstDay} de ${firstMonth} de ${firstYear} al ${lastDay} de ${lastMonth} de ${lastYear}`
  }
  if (first.getUTCMonth() === last.getUTCMonth()) {
    return `${firstDay} al ${lastDay} de ${lastMonth} de ${lastYear}`
  }
  return `${firstDay} de ${firstMonth} al ${lastDay} de ${lastMonth} de ${lastYear}`
}

export const formatUnits = value => value == null ? '—' : numberFormatter.format(value)

const formatChange = (value, direction) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {return 'Comparación no disponible'}
  if (value === 0) {return `${direction} menos del 0,01 %`}
  return `${direction} ${numberFormatter.format(Math.abs(value))} %`
}

/** Presentation mapping only: no percentage recalculation in the frontend. */
export const comparisonText = row => {
  switch (row.comparisonStatus) {
    case 'NO_HISTORY': return 'Sin historial disponible'
    case 'NO_REFERENCE': return 'Sin referencia anterior completa'
    case 'NO_ACTIVITY': return 'Sin movimiento'
    case 'NEW_ACTIVITY': return 'Nueva actividad'
    case 'UNCHANGED': return 'Sin variación'
    case 'INCREASED': return formatChange(row.percentageValue, 'Subió')
    case 'DECREASED': return formatChange(row.percentageValue, 'Bajó')
    default: return 'Comparación no disponible'
  }
}
