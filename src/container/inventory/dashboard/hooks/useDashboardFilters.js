'use client'

import {
 useCallback, useMemo, useState 
} from 'react'

import { DEFAULT_TIMEZONE } from '../utils/format'
import {
 buildPeriodFilter, getPeriodLabel, getTodayInTimezone 
} from '../utils/period'

/**
 * Single source of truth for the dashboard's filter state.
 *
 * Holds the *source* state (preset, anchor date, custom range, category filter,
 * timezone) and derives everything else (the GraphQL filter object, period
 * label, active-filter chips) during render — never duplicated in extra state.
 *
 * @param {object} [options] - Initial configuration.
 * @param {string} [options.timezone] - Business IANA timezone.
 * @returns {object} Filter state and actions for the dashboard widgets.
 */
export const useDashboardFilters = ({ timezone = DEFAULT_TIMEZONE } = {}) => {
  const today = useMemo(() => getTodayInTimezone(timezone), [timezone])

  const [preset, setPreset] = useState('day')
  const [referenceDate, setReferenceDate] = useState(today)
  const [customRange, setCustomRange] = useState(null)
  const [categoryIds, setCategoryIds] = useState([])

  /**
   * Applies a quick preset (day/15-days/month), clearing any custom range.
   */
  const selectPreset = useCallback((nextPreset) => {
    setPreset(nextPreset)
    setCustomRange(null)
  }, [])

  /**
   * Applies a confirmed custom range (from/to as YYYY-MM-DD).
   */
  const applyCustomRange = useCallback((range) => {
    if (!range?.from || !range?.to) {return}
    setCustomRange({ from: range.from, to: range.to })
    setPreset('custom')
  }, [])

  /**
   * Toggles a category id in the active category filter.
   */
  const toggleCategory = useCallback((categoryId) => {
    setCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
  }, [])

  /** Resets every filter to its default state. */
  const clearFilters = useCallback(() => {
    setPreset('day')
    setReferenceDate(today)
    setCustomRange(null)
    setCategoryIds([])
  }, [today])

  const periodState = useMemo(
    () => ({ preset, referenceDate, customRange, timezone }),
    [preset, referenceDate, customRange, timezone]
  )

  // Derived GraphQL filter. Stable reference while inputs are unchanged, so
  // widgets don't refetch on unrelated re-renders.
  const filter = useMemo(() => {
    const period = buildPeriodFilter(periodState)
    return {
      ...period,
      ...(categoryIds.length > 0 ? { categoryIds } : {})
    }
  }, [periodState, categoryIds])

  const periodLabel = useMemo(() => getPeriodLabel(periodState), [periodState])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (preset !== 'day') {count += 1}
    if (categoryIds.length > 0) {count += 1}
    return count
  }, [preset, categoryIds])

  return {
    // source state
    preset,
    referenceDate,
    customRange,
    categoryIds,
    timezone,
    // derived
    filter,
    periodLabel,
    activeFilterCount,
    // actions
    selectPreset,
    setReferenceDate,
    applyCustomRange,
    toggleCategory,
    clearFilters
  }
}
