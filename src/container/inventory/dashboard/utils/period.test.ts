import {
 buildPeriodFilter, getPeriodLabel, getTodayInTimezone, PERIOD_PRESETS 
} from './period'

describe('dashboard period utils', () => {
  describe('getTodayInTimezone', () => {
    it('returns an ISO date (YYYY-MM-DD)', () => {
      expect(getTodayInTimezone('America/Bogota')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('buildPeriodFilter', () => {
    it('sends preset + referenceDate for quick presets', () => {
      const out = buildPeriodFilter({
        preset: 'day',
        referenceDate: '2026-02-15',
        customRange: null,
        timezone: 'America/Bogota'
      })
      expect(out).toEqual({ preset: 'day', referenceDate: '2026-02-15', timezone: 'America/Bogota' })
    })

    it('sends from/to for a confirmed custom range', () => {
      const out = buildPeriodFilter({
        preset: 'custom',
        referenceDate: '2026-02-15',
        customRange: { from: '2026-02-01', to: '2026-02-10' },
        timezone: 'America/Bogota'
      })
      expect(out).toEqual({
        preset: 'custom',
        from: '2026-02-01',
        to: '2026-02-10',
        timezone: 'America/Bogota'
      })
    })

    it('ignores an incomplete custom range (falls back to preset fields)', () => {
      const out = buildPeriodFilter({
        preset: 'custom',
        referenceDate: '2026-02-15',
        customRange: { from: '2026-02-01', to: '' },
        timezone: 'America/Bogota'
      }) as Record<string, unknown>
      expect(out.from).toBeUndefined()
      expect(out.referenceDate).toBe('2026-02-15')
    })
  })

  describe('getPeriodLabel', () => {
    it('produces a non-empty label for day/month/custom', () => {
      const base = { referenceDate: '2026-02-15', customRange: null, timezone: 'America/Bogota' }
      expect(getPeriodLabel({ ...base, preset: 'day' }).length).toBeGreaterThan(0)
      expect(getPeriodLabel({ ...base, preset: 'month' }).length).toBeGreaterThan(0)
      expect(
        getPeriodLabel({
          preset: 'custom',
          referenceDate: '2026-02-15',
          customRange: { from: '2026-02-01', to: '2026-02-10' },
          timezone: 'America/Bogota'
        }).length
      ).toBeGreaterThan(0)
    })
  })

  describe('PERIOD_PRESETS', () => {
    it('exposes day, 15-days and month', () => {
      expect(PERIOD_PRESETS.map((p) => p.id)).toEqual(['day', '15-days', 'month'])
    })
  })
})
