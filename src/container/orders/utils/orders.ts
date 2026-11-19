import type {
  DateRangeValue,
  OrderRecord,
  OrdersPreset,
  OrdersSort,
  OrderStatusType
} from '../types'

/** Display-only fallback; server statusTypes wins whenever it is available. */
export const FALLBACK_ORDER_STATUSES: OrderStatusType[] = [
  {
      idStatus: '0', name: 'ESPERA', priority: 0, state: 0, color: '#282828', backgroundColor: '#E0E0E0', description: 'Pendiente de aceptación',
      createdAt: '',
      updatedAt: ''
  },
  {
      idStatus: '1', name: 'ACEPTADA', priority: 1, state: 1, color: '#3F3F3F', backgroundColor: '#FFF4C2', description: 'Aceptada por el comercio',
      createdAt: '',
      updatedAt: ''
  },
  {
      idStatus: '2', name: 'EN PROCESO', priority: 2, state: 2, color: '#FFFFFF', backgroundColor: '#F29E4C', description: 'En preparación',
      createdAt: '',
      updatedAt: ''
  },
  {
      idStatus: '3', name: 'LISTOS', priority: 3, state: 3, color: '#FFFFFF', backgroundColor: '#D8A635', description: 'Lista para entregar',
      createdAt: '',
      updatedAt: ''
  },
  {
      idStatus: '4', name: 'CONCLUIDA', priority: 4, state: 4, color: '#1F7A39', backgroundColor: '#CFF8DA', description: 'Venta concluida',
      createdAt: '',
      updatedAt: ''
  },
  {
      idStatus: '5', name: 'RECHAZADA', priority: 5, state: 5, color: '#A43535', backgroundColor: '#F9D5D5', description: 'Orden rechazada',
      createdAt: '',
      updatedAt: ''
  }
]

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0
})
const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
})
const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit', minute: '2-digit', hour12: true
})

export function formatCOP(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? moneyFormatter.format(value) : '—'
}

/** Backend sends `2026-11-18 06:56:23.341 -0500`; normalize for Safari. */
export function parseOrderDate(value?: string | null): Date | null {
  if (!value) {return null}
  const normalized = value.trim().replace(
    /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s*([+-]\d{2})(\d{2})$/,
    '$1T$2$3:$4'
  )
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatOrderDate(value?: string | null): string {
  const date = parseOrderDate(value)
  return date ? dateFormatter.format(date) : 'Fecha no disponible'
}

export function formatOrderTime(value?: string | null): string {
  const date = parseOrderDate(value)
  return date ? timeFormatter.format(date) : '—'
}

export function orderAmount(order: OrderRecord): number | null {
  const preferred = order.financials?.payableTotal
  if (typeof preferred === 'number' && Number.isFinite(preferred)) {return preferred}
  const fallback = order.totalProductsPrice ?? order.netTotal
  return typeof fallback === 'number' && Number.isFinite(fallback) ? fallback : null
}

export function clientName(order: OrderRecord): string | null {
  const first = order.client?.clientName?.trim() || ''
  const last = order.client?.clientLastName?.trim() || ''
  if (!first) {return last || null}
  if (!last || first.toLocaleLowerCase().endsWith(last.toLocaleLowerCase())) {return first}
  return `${first} ${last}`
}

export function orderItemsCount(order: OrderRecord): number | null {
  if (!Array.isArray(order.shoppingCarts)) {return null}
  return order.shoppingCarts.reduce((total, item) => total + (Number(item.cantProducts) || 0), 0)
}

export function orderStatusName(order: OrderRecord, statuses: OrderStatusType[]): string {
  const nested = typeof order.statusOrder === 'string'
    ? order.statusOrder
    : order.statusOrder?.name
  const direct = typeof order.status === 'string' ? order.status : undefined
  const numeric = typeof order.status === 'number' ? order.status : undefined
  const name = (nested ?? direct ?? '').trim()
  if (name) {
    const match = statuses.find(status => status.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    return match?.name ?? name
  }
  if (typeof numeric === 'number') {return statuses.find(status => status.state === numeric)?.name ?? 'SIN ESTADO'}
  return 'SIN ESTADO'
}

export function sortStatusTypes(statuses: OrderStatusType[]): OrderStatusType[] {
  return [...statuses].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, 'es'))
}

export function normalizeStatusTypes(input: unknown): OrderStatusType[] {
  if (!Array.isArray(input)) {return FALLBACK_ORDER_STATUSES}
  const normalized = input.filter((s): s is OrderStatusType => {
    if (!s || typeof s !== 'object') {return false}
    const record = s as Record<string, unknown>
    return typeof record.name === 'string' && typeof record.state === 'number'
  }).map(s => ({
    ...s,
    idStatus: String(s.idStatus ?? s.state),
    color: s.color || '#282828',
    backgroundColor: s.backgroundColor || '#F5F5F5',
    priority: Number.isFinite(s.priority) ? s.priority : s.state
  }))
  return normalized.length ? sortStatusTypes(normalized) : FALLBACK_ORDER_STATUSES
}

export function extractOrders(payload: unknown): OrderRecord[] | null {
  if (!payload || typeof payload !== 'object') {return null}
  const record = payload as Record<string, unknown>
  const data = record.data && typeof record.data === 'object' ? record.data as Record<string, unknown> : record
  const list = data.getAllSalesStore
  if (!Array.isArray(list)) {return null}
  return list.filter((order): order is OrderRecord => Boolean(order && typeof order === 'object' && typeof order.pCodeRef === 'string'))
}

export function extractSale(payload: unknown): { order: OrderRecord | null; error?: string } {
  if (!payload || typeof payload !== 'object') {return { order: null, error: 'No se recibió información de la orden.' }}
  const response = payload as Record<string, unknown>
  if (response.error) {return { order: null, error: 'No fue posible consultar la orden.' }}
  const body = response.data && typeof response.data === 'object' ? response.data as Record<string, unknown> : response
  const result = body.getOneSalesStore
  if (!result || typeof result !== 'object') {return { order: null, error: 'La respuesta de la orden no es válida.' }}
  const sale = result as Record<string, unknown>
  if (sale.success === false) {return { order: null, error: typeof sale.message === 'string' ? sale.message : 'No fue posible consultar la orden.' }}
  const order = sale.data
  if (!order || typeof order !== 'object' || typeof (order as OrderRecord).pCodeRef !== 'string') {
    return { order: null, error: 'No encontramos información para esta orden.' }
  }
  return { order: order as OrderRecord }
}

export function applyOrderFilters(
  orders: OrderRecord[], statuses: OrderStatusType[], search: string,
  selectedStatuses: string[], sort: OrdersSort
): OrderRecord[] {
  const query = search.trim().toLocaleLowerCase('es')
  return orders.filter(order => {
    if (selectedStatuses.length && !selectedStatuses.includes(orderStatusName(order, statuses))) {return false}
    if (!query) {return true}
    return [order.pCodeRef, clientName(order), order.paymentMethod?.name, order.store?.description]
      .some(value => value?.toLocaleLowerCase('es').includes(query))
  }).sort((a, b) => {
    if (sort === 'amount-asc' || sort === 'amount-desc') {
      const delta = (orderAmount(a) ?? -1) - (orderAmount(b) ?? -1)
      return sort === 'amount-asc' ? delta : -delta
    }
    const delta = (parseOrderDate(a.createdAt)?.getTime() ?? 0) - (parseOrderDate(b.createdAt)?.getTime() ?? 0)
    return sort === 'oldest' ? delta : -delta
  })
}


const DAY_MS = 86_400_000
const COLOMBIA_UTC_OFFSET_MS = 5 * 60 * 60 * 1000

const colombiaFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

function colombiaDateParts(date: Date) {
  const parts = colombiaFormatter.formatToParts(date)

  const get = (type: string): number =>
    Number(parts.find(part => part.type === type)?.value)

  return {
    year: get('year'),
    month: get('month'),
    day: get('day')
  }
}

function colombiaDayBoundary(
  year: number,
  month: number,
  day: number,
  end = false
): Date {
  const start = Date.UTC(
    year,
    month - 1,
    day,
    0, 0, 0, 0
  ) + COLOMBIA_UTC_OFFSET_MS

  return new Date(end ? start + DAY_MS - 1 : start)
}

export function presetRange(
  preset: Exclude<OrdersPreset, 'custom'>,
  now = new Date()
): DateRangeValue {
  const { year, month, day } = colombiaDateParts(now)

  const todayStart = colombiaDayBoundary(
    year,
    month,
    day
  )

  const days = preset === '7days'
    ? 7
    : preset === '30days'
      ? 30
      : 1

  if (preset === 'yesterday') {
    const yesterdayStart = new Date(
      todayStart.getTime() - DAY_MS
    )

    return {
      fromDate: yesterdayStart,
      toDate: new Date(todayStart.getTime() - 1)
    }
  }

  return {
    fromDate: new Date(
      todayStart.getTime() - (days - 1) * DAY_MS
    ),
    toDate: new Date(
      todayStart.getTime() + DAY_MS - 1
    )
  }
}

export function localDateInput(date: Date): string {
  const { year, month, day } = colombiaDateParts(date)

  return [
    year,
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0')
  ].join('-')
}

export function fromDateInput(
  value: string,
  end: boolean
): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(NaN)
  }

  const [year, month, day] = value.split('-').map(Number)

  const result = colombiaDayBoundary(
    year,
    month,
    day,
    end
  )

  if (localDateInput(result) !== value) {
    return new Date(NaN)
  }

  return result
}
