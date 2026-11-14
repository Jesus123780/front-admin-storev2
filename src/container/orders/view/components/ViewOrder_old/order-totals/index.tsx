'use client'

import { numberFormat, RippleButton } from 'pkg-components'
import React, {
 useEffect, useId, useState 
} from 'react'

import { isGrandTotal } from '../helpers/order-format'
import styles from './order-totals.module.css'

export type Total = { name: string; value: number }
export type PropsTotals = { totals: Total[] }

type Props = {
  totals?: Total[] | null
  note?: string
  /** Integración opcional: debe lanzar un error si el backend no guarda. */
  onSaveNote?: (note: string) => void | Promise<void>
}

const OrderTotals: React.FC<Props> = ({ totals = [], note = '', onSaveNote }) => {
  const [draft, setDraft] = useState(note)
  const [savedNote, setSavedNote] = useState(note)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)
  const noteId = useId()
  const headingId = useId()

  // Sincroniza valores nuevos que lleguen desde GraphQL o desde el padre.
  useEffect(() => {
    setDraft(note)
    setSavedNote(note)
    setFeedback(null)
  }, [note])

  const rows = totals ?? []
  const dirty = draft !== savedNote

  async function saveNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!onSaveNote || !dirty || saving) {return}
    setSaving(true)
    setFeedback(null)
    try {
      await onSaveNote(draft)
      setSavedNote(draft)
      setFeedback('saved')
    } catch {
      setFeedback('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={styles.container} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.title}>Resumen de pago</h2>
      {rows.length ? (
        <dl className={styles.totals}>
          {rows.map((row, index) => {
            const isTotal = isGrandTotal(row.name)
            return (
              <div className={`${styles.totalRow} ${isTotal ? styles.grandTotal : ''}`} key={`${row.name}-${index}`}>
                <dt className={styles.totalLabel}>{row.name}</dt>
                <dd className={styles.totalValue}>{numberFormat(row.value)}</dd>
              </div>
            )
          })}
        </dl>
      ) : (
        <p className={styles.empty}>Los importes aún no están disponibles.</p>
      )}

      <form className={styles.note} onSubmit={(event) => { void saveNote(event) }}>
        <div className={styles.noteHeading}>
          <label htmlFor={noteId} className={styles.noteTitle}>Nota del pedido</label>
          <span className={styles.counter}>{draft.length}/240</span>
        </div>
        <textarea
          id={noteId}
          className={styles.textarea}
          placeholder="Agrega una indicación o comentario..."
          maxLength={240}
          value={draft}
          disabled={saving}
          onChange={(event) => {
            setDraft(event.target.value)
            setFeedback(null)
          }}
          aria-describedby={`${noteId}-hint`}
        />
        {onSaveNote ? (
          <>
            <p id={`${noteId}-hint`} className={styles.hint}>Los cambios se guardarán al seleccionar Guardar nota.</p>
            <RippleButton
              type="submit"
              fullWidth
              bgColor="var(--color-secondary-blue, #0062ff)"
              color="#fff"
              radius="10px"
              padding="11px 14px"
              disabled={!dirty || saving}
              loading={saving}
              loadingLabel="Guardando nota"
            >Guardar nota</RippleButton>
            {feedback === 'saved' && <p className={styles.success} role="status">Nota guardada correctamente.</p>}
            {feedback === 'error' && <p className={styles.error} role="alert">No se pudo guardar la nota. Vuelve a intentarlo.</p>}
          </>
        ) : (
          <p id={`${noteId}-hint`} className={styles.hint}>Borrador local: esta nota no se guarda automáticamente.</p>
        )}
      </form>
    </section>
  )
}

export default React.memo(OrderTotals)
