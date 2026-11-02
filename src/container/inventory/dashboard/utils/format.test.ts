import {
  formatCompact,
  formatCount,
  formatCurrency,
  formatDate,
  formatPercentage,
  getComparisonLabel
} from './format'

// NOTE: formatCurrency/formatNumber delegate to numberFormat from npm-pkg-hook,
// which jest maps to a no-op mock here. The exact numeric output of numberFormat
// is unit-tested in the pkg-hook package (numberFormat.test). These tests cover
// the dashboard-owned behavior that does not depend on that mock.

describe('dashboard format utils', () => {
  describe('formatCurrency', () => {
    it('prefixes the currency symbol and never throws', () => {
      expect(formatCurrency(24582, { currency: 'COP' }).startsWith('$')).toBe(true)
      expect(formatCurrency(100, { currency: 'USD' }).startsWith('US$')).toBe(true)
    })
    it('is safe with non-numeric input', () => {
      expect(formatCurrency(undefined as unknown as number)).toEqual(expect.any(String))
      expect(formatCurrency(Number.NaN)).toEqual(expect.any(String))
    })
  })

  describe('formatCount', () => {
    it('renders whole numbers without decimals', () => {
      expect(formatCount(3842)).toBe('3.842')
    })
    it('rounds and is safe for invalid input', () => {
      expect(formatCount(10.6)).toBe('11')
      expect(formatCount(Number.NaN)).toBe('0')
    })
  })

  describe('formatCompact', () => {
    it('abbreviates large numbers', () => {
      expect(formatCompact(1200, 'en-US')).toMatch(/1\.2K/i)
    })
  })

  describe('formatDate', () => {
    it('renders in the business timezone', () => {
      // 2026-02-16T04:30Z is still Feb 15 in Bogota (UTC-5)
      const out = formatDate('2026-02-16T04:30:00.000Z', {
        timezone: 'America/Bogota',
        locale: 'es-CO',
        dateStyleOptions: { day: '2-digit', month: '2-digit' }
      })
      expect(out).toContain('15')
    })
    it('returns a dash for invalid input', () => {
      expect(formatDate('nope')).toBe('—')
    })
  })

  describe('formatPercentage', () => {
    it('adds a + sign for positive values', () => {
      expect(formatPercentage(12.5)).toBe('+12.5%')
    })
    it('keeps the - sign for negatives', () => {
      expect(formatPercentage(-3)).toBe('-3.0%')
    })
    it('reports "Sin datos" for null/undefined/non-finite', () => {
      expect(formatPercentage(null)).toBe('Sin datos')
      expect(formatPercentage(undefined)).toBe('Sin datos')
      expect(formatPercentage(Number.POSITIVE_INFINITY)).toBe('Sin datos')
    })
  })

  describe('getComparisonLabel', () => {
    it('maps each preset to a human label', () => {
      expect(getComparisonLabel('day')).toMatch(/día anterior/)
      expect(getComparisonLabel('month')).toMatch(/mes anterior/)
      expect(getComparisonLabel('15-days')).toMatch(/15 días/)
      expect(getComparisonLabel('custom')).toMatch(/periodo anterior/)
    })
  })
})
