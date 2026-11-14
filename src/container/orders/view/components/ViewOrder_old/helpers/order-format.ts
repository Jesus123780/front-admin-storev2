export function formatText(value?: string | null, fallback = 'No registrado'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

/** Solo una etiqueta inequívoca debe recibir énfasis de total final. */
export function isGrandTotal(label: string): boolean {
  return /^total(?:\s+(?:a pagar|general|final|de la orden|del pedido|de la venta|venta|pedido))?\s*:?$/i.test(label.trim())
}
