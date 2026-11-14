/** Formatting only. Never quantize a settled value or parse localized monetary text. */
export function decimalParts(value: unknown): { whole: string; fraction: string } | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  if (typeof value === 'number' && !Number.isFinite(value)) return null
  const raw = String(value).trim()
  if (raw.length > 100) return null
  const match = /^(\d+)(?:\.(\d+))?$/.exec(raw)
  if (!match) return null
  return { whole: match[1].replace(/^0+(?=\d)/, ''), fraction: match[2] ?? '' }
}
export function moneyMinor(value: unknown): bigint | null {
  const d = decimalParts(value)
  if (!d || /[1-9]/.test(d.fraction.slice(2))) return null
  return BigInt(d.whole) * BigInt(100) + BigInt(d.fraction.slice(0, 2).padEnd(2, '0'))
}
export function minorText(value: bigint): string {
  const raw = value.toString().padStart(3, '0')
  return `${raw.slice(0, -2)}.${raw.slice(-2)}`
}
export function formatCOP(value: unknown, currency = 'COP'): string {
  const cents = moneyMinor(value)
  if (cents === null) return '—'
  const d = decimalParts(minorText(cents))!
  return `${currency === 'COP' ? '$' : currency} ${d.whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${d.fraction}`
}
export function formatPercent(value: unknown): string {
  const d = decimalParts(value)
  if (!d) return '—'
  const fraction = d.fraction.replace(/0+$/, '')
  return `${d.whole}${fraction ? ',' + fraction : ''} %`
}
export function formatText(value?: string | null, fallback = 'No registrado'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}
export function isGrandTotal(label: string): boolean {
  return /^total(?:\s+(?:a pagar|general|final|de la orden|del pedido|de la venta|venta|pedido))?\s*:?$/i.test(label.trim())
}
export function parseOrderDate(value?: string | null): Date | null {
  if (!value?.trim()) return null
  const iso = value.trim().replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T').replace(/ ([+-]\d{2})(\d{2})$/, '$1:$2').replace(/ ([+-]\d{2}:\d{2})$/, '$1')
  // Do not invent the time zone when the API omitted it.
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso)) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}
export function formatOrderDate(value?: string | null): string {
  const date = parseOrderDate(value)
  return date ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(date) : formatText(value, 'No registrada')
}
