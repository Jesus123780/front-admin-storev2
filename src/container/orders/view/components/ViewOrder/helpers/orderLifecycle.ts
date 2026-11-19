import { OrderRecord, OrderStatusType } from "@/container/orders/types"

/** Domain interpretation: 4/5 are reserved FINANCIAL states in the current backend. */
export const isFinancialStatus = (status: OrderStatusType): boolean =>
  Number(status.state) === 4 || Number(status.state) === 5

export const operationalStatusTypes = (statuses: OrderStatusType[]): OrderStatusType[] =>
  statuses.filter(status => !isFinancialStatus(status))

/** Board status MUST NOT silently fall back to financial status. */
export function getOperationalStatus(order: OrderRecord, statuses: OrderStatusType[]): OrderStatusType | undefined {
  const id = order.boardStatusId == null ? '' : String(order.boardStatusId)
  return id ? operationalStatusTypes(statuses).find(item => String(item.idStatus) === id) : undefined
}

export type FinancialPresentation = {
  label: string
  tone: 'success' | 'danger' | 'neutral'
  tooltip: string
}

/** Never infer a completed payment from a Kanban label, a card color, or an order total. */
export function getFinancialPresentation(order: OrderRecord, statuses: OrderStatusType[]): FinancialPresentation {
  const id = order.idStatus == null ? '' : String(order.idStatus)
  const state = statuses.find(item => String(item.idStatus) === id)
  if (state?.state === 4) return {
    label: 'Venta concluida', tone: 'success',
    tooltip: 'Estado de la venta, independiente de la preparación. No confirma por sí solo la liquidación externa del pago.'
  }
  if (state?.state === 5) return {
    label: 'Venta rechazada', tone: 'danger',
    tooltip: 'Estado de la venta. No se cambia arrastrando una tarjeta.'
  }
  return {
    label: 'Estado de venta no disponible', tone: 'neutral',
    tooltip: 'El listado debe incluir idStatus para identificar el estado financiero; no se deduce del Kanban.'
  }
}

/** For legacy sales boardStatusId can be null. Backend move expects the persisted financial idStatus as source. */
export function getExpectedMoveStatusId(order: OrderRecord): string | null {
  const id = order.boardStatusId ?? order.idStatus
  return id == null || String(id).trim() === '' ? null : String(id)
}
