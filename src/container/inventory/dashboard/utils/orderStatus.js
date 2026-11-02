/**
 * Maps persisted order status `state` (order_status_types.state) to a UI label
 * and a semantic style key. The persisted value is never modified; only the
 * display label is localized. States mirror the backend seed:
 *   0 WAITING · 1 ACCEPT · 2 PROCESSING · 3 READY · 4 CONCLUDES · 5 REJECTED
 */

/**
 * @typedef {('success'|'pending'|'processing'|'danger'|'neutral')} StatusTone
 */

const STATUS_MAP = {
  0: { label: 'En espera', tone: 'pending' },
  1: { label: 'Aceptado', tone: 'pending' },
  2: { label: 'En proceso', tone: 'processing' },
  3: { label: 'Listo', tone: 'processing' },
  4: { label: 'Concluido', tone: 'success' },
  5: { label: 'Rechazado', tone: 'danger' }
}

/**
 * Resolves the UI descriptor for a persisted order state.
 *
 * @param {number} state - Persisted `order_status_types.state`.
 * @returns {{ label: string, tone: StatusTone }} UI label and tone. Unknown
 *   states fall back to a neutral descriptor rather than inventing a status.
 */
export const getOrderStatusMeta = (state) => {
  return STATUS_MAP[state] ?? { label: 'Desconocido', tone: 'neutral' }
}
