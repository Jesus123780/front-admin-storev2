/**
 * Formatting helpers for the commercial dashboard. These centralize locale and
 * currency handling so widgets never implement ad-hoc number/date formatting.
 *
 * Monetary and count values are formatted through the shared `numberFormat`
 * helper from npm-pkg-hook so the whole app stays consistent and exact. That
 * helper renders es-CO decimals (e.g. 140618.43 -> "140.618,43") without the
 * decimal-corruption bug that previously inflated values by 100.
 *
 * Defaults target Colombia (es-CO / COP). Currency is configurable because the
 * business may operate in another currency; the data model is single-currency.
 */

import { numberFormat } from 'npm-pkg-hook'

export const DEFAULT_LOCALE = 'es-CO'
export const DEFAULT_CURRENCY = 'COP'
export const DEFAULT_TIMEZONE = 'America/Bogota'

/** Currency symbols for the business currencies we support. */
const CURRENCY_SYMBOL = {
  COP: '$',
  USD: 'US$',
  EUR: '€'
}

/**
 * Returns the display symbol for a currency code (defaults to '$').
 *
 * @param {string} [currency] - ISO 4217 currency code.
 * @returns {string} The currency symbol.
 */
export const getCurrencySymbol = (currency = DEFAULT_CURRENCY) => {
  return CURRENCY_SYMBOL[currency] ?? '$'
}

/**
 * Coerces any input into a finite number (0 when invalid), so formatting never
 * throws or shows NaN.
 *
 * @param {number|string} value - Raw value.
 * @returns {number} A finite number.
 */
const toSafeNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/**
 * Formats a monetary value using the shared `numberFormat` helper and prefixes
 * the business currency symbol. Exact to two decimals (e.g. "$ 140.618,43").
 *
 * @param {number} value - Numeric amount.
 * @param {object} [options] - Overrides.
 * @param {string} [options.currency] - ISO 4217 currency code.
 * @returns {string} Formatted currency string (empty-safe).
 */
export const formatCurrency = (value, options = {}) => {
  const { currency = DEFAULT_CURRENCY } = options
  const symbol = CURRENCY_SYMBOL[currency] ?? '$'
  const formatted = numberFormat(toSafeNumber(value))
  return `${symbol} ${formatted}`
}

/**
 * Formats a plain number through the shared `numberFormat` helper.
 *
 * @param {number} value - Numeric value.
 * @returns {string} Grouped number string (es-CO, two decimals).
 */
export const formatNumber = (value) => {
  return `${numberFormat(toSafeNumber(value))}`
}

/**
 * Formats an integer count (no decimals) — for pedidos, productos, clientes.
 * Uses the shared helper's grouping but trims the ",00" decimal tail since
 * counts are whole numbers.
 *
 * @param {number} value - Integer-like value.
 * @returns {string} Grouped integer string (es-CO).
 */
export const formatCount = (value) => {
  const safe = Math.round(toSafeNumber(value))
  try {
    return new Intl.NumberFormat(DEFAULT_LOCALE, { maximumFractionDigits: 0 }).format(safe)
  } catch {
    return `${safe}`
  }
}

/**
 * Abbreviates large numbers (1.2K, 3.4M) while keeping small ones intact.
 *
 * @param {number} value - Numeric value.
 * @param {string} [locale] - BCP-47 locale.
 * @returns {string} Compact number string.
 */
export const formatCompact = (value, locale = DEFAULT_LOCALE) => {
  const numeric = Number(value)
  const safe = Number.isFinite(numeric) ? numeric : 0
  try {
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(safe)
  } catch {
    return `${safe}`
  }
}

/**
 * Formats an ISO UTC timestamp as a date in the business timezone.
 *
 * @param {string|number|Date} value - ISO/epoch/Date value.
 * @param {object} [options] - Overrides.
 * @param {string} [options.locale] - BCP-47 locale.
 * @param {string} [options.timezone] - IANA timezone.
 * @param {Intl.DateTimeFormatOptions} [options.dateStyleOptions] - Intl options.
 * @returns {string} Formatted date, or '—' when invalid.
 */
export const formatDate = (value, options = {}) => {
  const {
    locale = DEFAULT_LOCALE,
    timezone = DEFAULT_TIMEZONE,
    dateStyleOptions = { day: '2-digit', month: 'short' }
  } = options
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {return '—'}
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: timezone, ...dateStyleOptions }).format(date)
  } catch {
    return '—'
  }
}

/**
 * Formats a percentage change with sign, handling null/unknown gracefully.
 *
 * @param {number|null|undefined} value - Percentage (already computed).
 * @param {object} [options] - Overrides.
 * @param {number} [options.precision] - Decimal places.
 * @returns {string} e.g. "+12.5%", "-3%", or "Sin datos" when null.
 */
export const formatPercentage = (value, options = {}) => {
  const { precision = 1 } = options
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return 'Sin datos'
  }
  const numeric = Number(value)
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric.toFixed(precision)}%`
}

/**
 * Human-readable label describing what a KPI comparison measures.
 *
 * @param {('day'|'15-days'|'month'|'custom')} preset - Active period preset.
 * @returns {string} Comparison description for tooltips/subtitles.
 */
export const getComparisonLabel = (preset) => {
  switch (preset) {
    case 'day':
      return 'vs. día anterior'
    case '15-days':
      return 'vs. 15 días previos'
    case 'month':
      return 'vs. mes anterior'
    case 'custom':
      return 'vs. periodo anterior equivalente'
    default:
      return 'vs. periodo anterior'
  }
}
