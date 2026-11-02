'use client'

import {
 getGlobalStyle, Icon, Text 
} from 'pkg-components'
import PropTypes from 'prop-types'
import {
 useEffect, useRef, useState 
} from 'react'

import { getTodayInTimezone, PERIOD_PRESETS } from '../../utils/period'
import styles from './styles.module.css'

/**
 * Global period selector: a segmented control (Día / 15 días / Mes) plus a
 * calendar popover for picking the anchor date or a custom inclusive range.
 *
 * Temporal selection inside the popover is held locally and only applied on
 * "Aplicar", so the dashboard never refetches on an incomplete range.
 *
 * @param {object} props - Component props.
 * @param {('day'|'15-days'|'month'|'custom')} props.preset - Active preset.
 * @param {string} props.referenceDate - Anchor calendar date (YYYY-MM-DD).
 * @param {{from: string, to: string}|null} props.customRange - Custom range.
 * @param {string} props.timezone - Business IANA timezone.
 * @param {string} props.periodLabel - Readable label of the active period.
 * @param {Function} props.onSelectPreset - Preset change handler.
 * @param {Function} props.onChangeReferenceDate - Anchor-date change handler.
 * @param {Function} props.onApplyCustomRange - Custom-range apply handler.
 * @returns {JSX.Element} The period filter bar.
 */
export const DashboardPeriodFilter = ({
  preset,
  referenceDate,
  customRange,
  timezone,
  periodLabel,
  onSelectPreset,
  onChangeReferenceDate,
  onApplyCustomRange
}) => {
  const today = getTodayInTimezone(timezone)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('single')
  const [draftDate, setDraftDate] = useState(referenceDate)
  const [draftFrom, setDraftFrom] = useState(customRange?.from ?? referenceDate)
  const [draftTo, setDraftTo] = useState(customRange?.to ?? referenceDate)
  const [rangeError, setRangeError] = useState('')
  const popoverRef = useRef(null)
  const triggerRef = useRef(null)

  // Keep drafts in sync when the confirmed period changes from outside.
  useEffect(() => {
    setDraftDate(referenceDate)
    setDraftFrom(customRange?.from ?? referenceDate)
    setDraftTo(customRange?.to ?? referenceDate)
  }, [referenceDate, customRange])

  // Close on outside click / Escape; return focus to the trigger.
  useEffect(() => {
    if (!open) {return undefined}

    const handlePointer = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const apply = () => {
    if (mode === 'single') {
      onChangeReferenceDate(draftDate)
      onSelectPreset(preset === 'custom' ? 'day' : preset)
    } else {
      if (draftTo < draftFrom) {
        setRangeError('La fecha final no puede ser anterior a la inicial.')
        return
      }
      onApplyCustomRange({ from: draftFrom, to: draftTo })
    }
    setRangeError('')
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className={styles.wrapper}>
      <div aria-label='Seleccionar periodo' className={styles.segmented} role='tablist'>
        {PERIOD_PRESETS.map((item) => {
          const selected = preset === item.id
          return (
            <button
              aria-selected={selected}
              className={`${styles.segment} ${selected ? styles.segmentActive : ''}`}
              key={item.id}
              onClick={() => onSelectPreset(item.id)}
              role='tab'
              type='button'
            >
              {item.label}
            </button>
          )
        })}

        <button
          aria-expanded={open}
          aria-haspopup='dialog'
          className={`${styles.segment} ${styles.calendarBtn} ${preset === 'custom' ? styles.segmentActive : ''}`}
          onClick={() => setOpen((v) => !v)}
          ref={triggerRef}
          type='button'
        >
          <Icon color={getGlobalStyle('--color-icons-gray')} icon='IconCalendar' size={18} />
          <span className={styles.calendarLabel}>Calendario</span>
        </button>
      </div>

      <Text as='span' className={styles.periodLabel} size='sm'>
        {periodLabel}
        <span className={styles.tzHint}> · {timezone}</span>
      </Text>

      {open && (
        <div aria-label='Selección de fecha' className={styles.popover} ref={popoverRef} role='dialog'>
          <div className={styles.modeTabs}>
            <button
              className={`${styles.modeTab} ${mode === 'single' ? styles.modeTabActive : ''}`}
              onClick={() => setMode('single')}
              type='button'
            >
              Fecha
            </button>
            <button
              className={`${styles.modeTab} ${mode === 'range' ? styles.modeTabActive : ''}`}
              onClick={() => setMode('range')}
              type='button'
            >
              Rango
            </button>
          </div>

          {mode === 'single'
            ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Selecciona un día</span>
                <input
                  className={styles.input}
                  max={today}
                  onChange={(e) => setDraftDate(e.target.value)}
                  type='date'
                  value={draftDate}
                />
              </label>
              )
            : (
              <div className={styles.rangeFields}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Desde</span>
                  <input
                    className={styles.input}
                    max={today}
                    onChange={(e) => setDraftFrom(e.target.value)}
                    type='date'
                    value={draftFrom}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Hasta</span>
                  <input
                    className={styles.input}
                    max={today}
                    min={draftFrom}
                    onChange={(e) => setDraftTo(e.target.value)}
                    type='date'
                    value={draftTo}
                  />
                </label>
              </div>
              )}

          {rangeError && (
            <Text as='p' className={styles.rangeError} role='alert' size='sm'>
              {rangeError}
            </Text>
          )}

          <div className={styles.popoverActions}>
            <button className={styles.cancelBtn} onClick={() => { setOpen(false); setRangeError('') }} type='button'>
              Cancelar
            </button>
            <button className={styles.applyBtn} onClick={apply} type='button'>
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

DashboardPeriodFilter.propTypes = {
  preset: PropTypes.oneOf(['day', '15-days', 'month', 'custom']).isRequired,
  referenceDate: PropTypes.string.isRequired,
  customRange: PropTypes.shape({ from: PropTypes.string, to: PropTypes.string }),
  timezone: PropTypes.string.isRequired,
  periodLabel: PropTypes.string,
  onSelectPreset: PropTypes.func.isRequired,
  onChangeReferenceDate: PropTypes.func.isRequired,
  onApplyCustomRange: PropTypes.func.isRequired
}
