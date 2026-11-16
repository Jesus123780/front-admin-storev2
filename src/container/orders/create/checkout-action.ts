type Target = 'payment' | 'cash-session' | 'delivery' | 'cash-received' | 'confirmation' | 'recovery'
export interface CheckoutActionHint { target: Target; label: string; message: string }
interface CheckoutActionState {
  busy: boolean; pendingRecovery: boolean; recoveryMessage?: string | null
  hasItems: boolean; canSubmit: boolean; cashKnown: boolean; cashBlocker?: string | null
  methodIssue?: string | null; paymentKind?: 'cash' | 'non-cash' | 'unknown'
  deliveryReady: boolean; deliveryIssue?: string | null; amountIssue?: string | null
  cartValid: boolean; amountsValid: boolean; total: number; received: number | null; missing: number
  confirmationReady: boolean; confirmed: boolean; message: string
}
/** Resolve the next navigational action; never authorize a payment. */
export function resolveCheckoutAction(s: CheckoutActionState): CheckoutActionHint | undefined {
  const action = (target: Target, label: string, message: string): CheckoutActionHint => ({ target, label, message })
  if (s.busy) return undefined
  if (s.pendingRecovery) return action('recovery', 'Revisar cobro pendiente', s.recoveryMessage || 'Verifica el cobro original.')
  if (!s.hasItems || s.canSubmit) return undefined
  if (!s.cashKnown || s.cashBlocker) return action('cash-session', 'Revisar caja del turno', s.cashBlocker || 'Consultando caja…')
  if (s.methodIssue || s.paymentKind === 'unknown') return action('payment', 'Revisar medio de pago', s.methodIssue || 'Selecciona un medio de pago.')
  if (!s.deliveryReady) return action('delivery', 'Configurar entrega', s.deliveryIssue || 'Completa los datos de entrega.')
  if (s.amountIssue || !s.cartValid || !s.amountsValid) return undefined
  if (s.paymentKind === 'cash' && s.total > 0 && (s.received === null || s.missing > 0)) return action('cash-received', 'Revisar efectivo recibido', s.message)
  if (s.confirmationReady && !s.confirmed) return action('confirmation', s.total === 0 ? 'Ir a confirmar venta sin cobro' : 'Ir a confirmar el pago', s.message)
  if (s.paymentKind === 'cash' && s.total > 0 && !s.confirmationReady && !s.confirmed) return action('cash-received', 'Revisar efectivo recibido', s.message)
  return undefined
}
