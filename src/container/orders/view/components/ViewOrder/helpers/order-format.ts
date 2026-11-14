/** Utilidades puras compartidas por OrderPage. No requieren React. */
const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota'
})

export function formatCOP(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return currencyFormatter.format(value)
}

export function formatOrderDate(value?: string | null): string {
  if (!value?.trim()) return 'No registrada'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return dateFormatter.format(parsed)
}

export function formatText(value?: string | null, fallback = 'No registrado'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

/** Solo una etiqueta inequívoca debe recibir énfasis de total final. */
export function isGrandTotal(label: string): boolean {
  return /^total(?:\s+(?:a pagar|general|final|de la orden|del pedido|de la venta|venta|pedido))?\s*:?$/i.test(label.trim())
}
