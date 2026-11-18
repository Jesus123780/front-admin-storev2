'use client'

import { useId, useState } from 'react'
import { useOrderBoardHistory } from 'npm-pkg-hook'
import styles from './styles.module.css'

export interface OrderBoardHistoryProps {
  pCodeRef: string
  /** Should be false when the lateral panel is not open. */
  active?: boolean
}

const formatHistoryDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota'
  }).format(date)
}

/** Lazy, accessible history timeline for the existing LateralModal. */
export function OrderBoardHistory({
  pCodeRef,
  active = true
}: OrderBoardHistoryProps) {
  const [expanded, setExpanded] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const contentId = useId()
  const history = useOrderBoardHistory({
    pCodeRef,
    enabled: active && expanded,
    pageSize: 10
  })

  const invoke = async (fn: () => Promise<unknown>): Promise<void> => {
    setActionError(null)
    try {
      await fn()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No fue posible completar la consulta.')
    }
  }

  const hasError = Boolean(history.error || actionError)

  return (
    <section className={styles.root} aria-label="Historial del tablero de esta orden">
      <button
        type="button"
        className={styles.disclosure}
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded(current => !current)}
      >
        <span className={styles.titleGroup}>
          <span className={styles.symbol} aria-hidden="true">↺</span>
          <span className={styles.titleText}>
            <strong>Historial de movimientos</strong>
            <span>Consulta los cambios de columna y quién los realizó</span>
          </span>
        </span>
        <span className={styles.chevron} aria-hidden="true">⌄</span>
      </button>

      {expanded && (
        <div id={contentId} className={styles.content}>
          <div className={styles.toolbar}>
            <span className={styles.counter} aria-live="polite">
              {history.loading && history.items.length === 0
                ? 'Consultando movimientos…'
                : `${history.totalRecords} ${history.totalRecords === 1 ? 'movimiento' : 'movimientos'}`}
            </span>
            <button
              type="button"
              className={styles.refresh}
              disabled={history.loading || history.loadingMore}
              onClick={() => { void invoke(history.refresh) }}
            >
              Actualizar
            </button>
          </div>

          {hasError && (
            <div className={styles.error} role="alert">
              <p>{actionError || history.error}</p>
              <button type="button" onClick={() => { void invoke(history.refresh) }}>Reintentar</button>
            </div>
          )}

          {history.loading && history.items.length === 0 && !hasError && (
            <p className={styles.message} role="status">Cargando historial…</p>
          )}

          {!history.loading && !hasError && history.items.length === 0 && (
            <p className={styles.message} role="status">
              Aún no hay movimientos registrados. El historial comienza con el primer cambio de columna.
            </p>
          )}

          {history.items.length > 0 && (
            <ol className={styles.timeline} aria-label="Cambios de estado en orden cronológico inverso">
              {history.items.map(item => (
                <li className={styles.entry} key={item.id}>
                  <span className={styles.dot} aria-hidden="true" />
                  <div className={styles.entryContent}>
                    <time className={styles.date} dateTime={item.createdAt}>
                      {formatHistoryDate(item.createdAt)}
                    </time>
                    <div className={styles.transition}>
                      <span className={styles.from} title={item.fromStatusId}>
                        {item.fromStatusName || 'Estado anterior no disponible'}
                      </span>
                      <span className={styles.arrow} aria-hidden="true">→</span>
                      <strong className={styles.to} title={item.toStatusId}>
                        {item.toStatusName || 'Estado actual no disponible'}
                      </strong>
                    </div>
                    <p className={styles.actor} title={item.movedBy}>
                      Movido por {item.movedByName?.trim() || `Usuario ${item.movedBy.slice(0, 8)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {history.hasMore && (
            <button
              type="button"
              className={styles.more}
              disabled={history.loadingMore}
              onClick={() => { void invoke(history.loadMore) }}
            >
              {history.loadingMore ? 'Cargando…' : 'Mostrar 10 movimientos más'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
