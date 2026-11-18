/** Visual types: intentionally decoupled from GraphQL's optional / nullable fields. */
export interface OrderStatusType {
  idStatus: string
  name: string
  description?: string | null
  color: string
  backgroundColor: string
  priority: number
  state: number
}

export interface OrderProduct {
  shoppingCartId?: string
  cantProducts?: number | null
  priceProduct?: number | null
  comments?: string | null
  products?: {
    pName?: string | null
    ProPrice?: number | null
  } | null
}

export interface OrderClient {
  clientName?: string | null
  clientLastName?: string | null
  clientNumber?: string | null
}

export interface OrderPayment {
  name?: string | null
  icon?: string | null
}

export interface OrderRefund {
  commercialStatus?: string | null
  confirmedRefundCount?: number | null
  pendingRefundCount?: number | null
  verified?: boolean | null
}

export interface OrderFinancials {
  currency?: string | null
  payableTotal?: number | null
  valid?: boolean | null
  source?: string | null
  issues?: string[] | null
  summary?: Array<{ key?: string; name?: string; value?: number; effect?: string; unit?: string }> | null
}

export interface OrderRecord {
  pCodeRef: string
  createdAt?: string | null
  updatedAt?: string | null
  status?: string | number | null
  statusOrder?: Partial<OrderStatusType> | string | null
  totalProductsPrice?: number | null
  netTotal?: number | null
  valueDelivery?: number | null
  tip?: number | null
  paymentMethod?: OrderPayment | null
  client?: OrderClient | null
  shoppingCarts?: OrderProduct[] | null
  financials?: OrderFinancials | null
  refundSummary?: OrderRefund | null
  store?: { description?: string | null } | null
  totals?: Array<{ key?: string; name?: string; value?: string; numericValue?: number }> | null
}

export interface DateRangeValue {
  fromDate: Date
  toDate: Date
}
export type OrdersLayout = 'list' | 'columns'
export type OrdersSort = 'newest' | 'oldest' | 'amount-desc' | 'amount-asc'
export type OrdersPreset = 'today' | 'yesterday' | '7days' | '30days' | 'custom'

export interface OrderDetailsState {
  open: boolean
  code: string
  loading: boolean
  error: string | null
  order: OrderRecord | null
}
