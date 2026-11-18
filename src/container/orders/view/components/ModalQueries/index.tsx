'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon, Text } from 'pkg-components'
import type { DateRangeValue } from '../../types'
import { fromDateInput, localDateInput } from '../../../utils/orders'
import styles from './styles.module.css'

interface Props {
  open: boolean
  range: DateRangeValue
  onApply: (range: DateRangeValue) => void
  onClose: () => void
}

export function ModalQueries({ open, range, onApply, onClose }: Props) {
  const headingId = useId()
  const fromRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLElement>(null)
  const [from, setFrom] = useState(localDateInput(range.fromDate))
  const [to, setTo] = useState(localDateInput(range.toDate))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setFrom(localDateInput(range.fromDate))
    setTo(localDateInput(range.toDate))
    setError('')
    const focusTimer = window.setTimeout(() => fromRef.current?.focus(), 30)
    return () => window.clearTimeout(focusTimer)
  }, [open, range.fromDate, range.toDate])

  useEffect(() => {
    if (!open) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const controls = Array.from(modalRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') ?? [])
      const first = controls[0], last = controls[controls.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null
  const apply = () => {
    if (!from || !to) { setError('Selecciona ambas fechas.'); return }
    const fromDate = fromDateInput(from, false)
    const toDate = fromDateInput(to, true)
    if (!Number.isFinite(fromDate.getTime()) || !Number.isFinite(toDate.getTime()) || fromDate > toDate) {
      setError('La fecha inicial debe ser menor o igual a la final.'); return
    }
    setError('')
    onApply({ fromDate, toDate })
  }
  return (
    <div className={styles.overlay} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <div className={styles.header}>
          <div className={styles.heading}><div className={styles.headingIcon}><Icon icon="IconCalendar" size={20} color="currentColor" /></div><div><Text as="h2" id={headingId} customSize="1.12rem" weight={700}>Filtrar por fechas</Text><Text as="p" color="gray-dark" customSize="0.76rem">Selecciona el rango de órdenes que deseas consultar</Text></div></div>
          <button type="button" className={styles.close} onClick={onClose} title="Cerrar filtros" aria-label="Cerrar filtros"><Icon icon="IconClose" size={19} color="currentColor" /></button>
        </div>
        <div className={styles.body}>
          <div className={styles.fields}>
            <label>Desde <input ref={fromRef} type="date" value={from} onChange={event => setFrom(event.target.value)} required /></label>
            <label>Hasta <input type="date" value={to} onChange={event => setTo(event.target.value)} required /></label>
          </div>
          <Text as="p" color="gray-dark" customSize="0.77rem">Se incluyen todas las órdenes del día inicial y final.</Text>
          {error && <Text as="p" className={styles.error} role="alert" customSize="0.76rem">{error}</Text>}
        </div>
        <footer className={styles.footer}><button type="button" className={styles.cancel} onClick={onClose}>Cancelar</button><button type="button" className={styles.apply} onClick={apply}><Icon icon="IconFilter" size={16} color="currentColor" /> Aplicar fechas</button></footer>
      </section>
    </div>
  )
}
