import {
 DEFAULT_LOCALE, DEFAULT_TIMEZONE, formatDate 
} from './format'

/**
 * @typedef {('day'|'15-days'|'month'|'custom')} PeriodPreset
 */

/**
 * Returns today's calendar date (YYYY-MM-DD) in the business timezone.
 * Using Intl avoids depending on the browser's local timezone.
 *
 * @param {string} [timezone] - IANA timezone.
 * @returns {string} ISO date (YYYY-MM-DD).
 */
export const getTodayInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  try {
    // en-CA yields YYYY-MM-DD ordering regardless of locale.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/**
 * Builds the GraphQL DashboardFilterInput period fields from UI state.
 * The backend performs the actual local->UTC conversion; the UI only sends the
 * preset, the anchor calendar date, an optional custom range, and the timezone.
 *
 * @param {object} state - Period UI state.
 * @param {PeriodPreset} state.preset - Active preset.
 * @param {string} state.referenceDate - Anchor calendar date (YYYY-MM-DD).
 * @param {{from: string, to: string}|null} state.customRange - Custom range.
 * @param {string} state.timezone - IANA timezone.
 * @returns {object} Period fields for DashboardFilterInput.
 */
export const buildPeriodFilter = ({ preset, referenceDate, customRange, timezone }) => {
  if (preset === 'custom' && customRange?.from && customRange?.to) {
    return {
      preset: 'custom',
      from: customRange.from,
      to: customRange.to,
      timezone
    }
  }

  return {
    preset,
    referenceDate,
    timezone
  }
}

/**
 * Produces a human-readable label for the currently selected period.
 *
 * @param {object} state - Period UI state (see buildPeriodFilter).
 * @returns {string} Readable period label for display next to the selector.
 */
export const getPeriodLabel = ({ preset, referenceDate, customRange, timezone }) => {
  const opts = { locale: DEFAULT_LOCALE, timezone }

  if (preset === 'custom' && customRange?.from && customRange?.to) {
    const from = formatDate(`${customRange.from}T12:00:00`, {
      ...opts,
      dateStyleOptions: { day: '2-digit', month: 'short', year: 'numeric' }
    })
    const to = formatDate(`${customRange.to}T12:00:00`, {
      ...opts,
      dateStyleOptions: { day: '2-digit', month: 'short', year: 'numeric' }
    })
    return from === to ? from : `${from} – ${to}`
  }

  // Use midday to avoid any off-by-one when rendering the anchor date.
  const anchor = `${referenceDate}T12:00:00`

  switch (preset) {
    case 'day':
      return formatDate(anchor, {
        ...opts,
        dateStyleOptions: { weekday: 'long', day: '2-digit', month: 'long' }
      })
    case '15-days':
      return `15 días hasta ${formatDate(anchor, { ...opts, dateStyleOptions: { day: '2-digit', month: 'short' } })}`
    case 'month':
      return formatDate(anchor, {
        ...opts,
        dateStyleOptions: { month: 'long', year: 'numeric' }
      })
    default:
      return ''
  }
}

/**
 * The ordered set of quick presets rendered by the period selector.
 * @type {{ id: PeriodPreset, label: string }[]}
 */
export const PERIOD_PRESETS = [
  { id: 'day', label: 'Día' },
  { id: '15-days', label: '15 días' },
  { id: 'month', label: 'Mes' }
]
