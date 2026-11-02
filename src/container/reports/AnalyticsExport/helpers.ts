import type { ReportJobStatus } from './reports.types'

/**
 * Visual metadata for each report job status, consumed by the shared
 * `StatusBadge` component (statusOrder shape: name/color/backgroundColor).
 */
export interface StatusVisual {
  name: string
  color: string
  backgroundColor: string
}

/**
 * Maps a report job status to its badge visual.
 *
 * @param status - Job status.
 * @returns The badge visual metadata.
 */
export const statusVisual = (status: ReportJobStatus): StatusVisual => {
  switch (status) {
    case 'PENDING':
      return { name: 'En cola', color: '#b45309', backgroundColor: '#fef3c7' }
    case 'PROCESSING':
      return { name: 'Procesando', color: '#1d4ed8', backgroundColor: '#dbeafe' }
    case 'COMPLETED':
      return { name: 'Completado', color: '#15803d', backgroundColor: '#dcfce7' }
    case 'FAILED':
      return { name: 'Fallido', color: '#b91c1c', backgroundColor: '#fee2e2' }
    case 'CANCELLED':
      return { name: 'Cancelado', color: '#6b7280', backgroundColor: '#f3f4f6' }
    case 'EXPIRED':
      return { name: 'Expirado', color: '#6b7280', backgroundColor: '#f3f4f6' }
    default:
      return { name: String(status), color: '#6b7280', backgroundColor: '#f3f4f6' }
  }
}

/**
 * Formats a Date into a `YYYY-MM-DD` calendar string in local time, for the
 * export request payload.
 *
 * @param date - The date to format.
 * @returns The `YYYY-MM-DD` string.
 */
export const toYMD = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Formats an ISO datetime string into a short local date-time for display.
 *
 * @param iso - ISO string or null.
 * @returns A short, human-readable date-time, or an em dash when missing.
 */
export const formatDateTime = (iso?: string | null): string => {
  if (!iso) {return '—'}
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {return '—'}
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formats a duration in milliseconds into a compact human string.
 *
 * @param ms - Duration in milliseconds or null.
 * @returns A compact duration (e.g. `3s`, `1m 20s`), or an em dash.
 */
export const formatDuration = (ms?: number | null): string => {
  if (!ms || ms <= 0) {return '—'}
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) {return `${totalSeconds}s`}
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}
