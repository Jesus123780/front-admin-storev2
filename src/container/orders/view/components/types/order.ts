import { PaymentMethod } from '../ViewOrder/order-payments'

// types/order.ts
export type Product = {
  pId: string
  pName: string
  pCode?: string
  ProPrice: number
  ProQuantity: number
  ProImage?: string
  vat?: number
  __typename?: string
}

export type ShoppingCart = {
  shoppingCartId: string
  pId: string
  priceProduct: number
  cantProducts: number
  products: Product
  createdAt?: string
  __typename?: string
}

export type Client = {
  cliId: string
  clientName: string
  clientLastName?: string
  ClientAddress?: string | null
  clientNumber?: string
  __typename?: string
  ccClient?: string | null
}

export type Store = {
  createdAt?: string
  description?: string
  emailStore?: string | null
  __typename?: string
}

export type Order = {
  change: unknown
  channel: unknown

  pCodeRef: string | null
  totalProductsPrice: number | null
  createdAt?: string | null
  store: Store
  client: Client
  shoppingCarts: ShoppingCart[]
  totals?: { name: string; value: number }[]
  discount?: number
  __typename?: string
  statusOrder: { name: string, backgroundColor: string, color: string }
  paymentMethod: PaymentMethod
}

export type ResponseSalesStore = {
  message: string
  errors: unknown
  data: Order
  __typename?: string
}
