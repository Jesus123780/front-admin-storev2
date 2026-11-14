import type { Product, ShoppingCart } from '../../types/order'

export type NumericValue = number | string | null | undefined
export type FreeFlag = boolean | number | string | null

export interface SoldExtra {
  exPid?: string | null
  extraName?: string | null
  extraPrice?: NumericValue
  quantity?: NumericValue
  newExtraPrice?: NumericValue
}

export interface SoldSubOptional {
  opSubExPid?: string | null
  OptionalSubProName?: string | null
  check?: boolean | null
  state?: number | null
}

export interface SoldOptional {
  opExPid?: string | null
  OptionalProName?: string | null
  ExtProductFoodsSubOptionalAll?: Array<SoldSubOptional | null> | null
}

export type OrderItemProduct = Omit<Product, 'free' | 'ProPrice'> & {
  free?: FreeFlag
  ProPrice?: NumericValue
  ExtProductFoodsAll?: Array<SoldExtra | null> | null
  ExtProductFoodOptional?: Array<SoldOptional | null> | null
}

export type OrderItemCart = Omit<ShoppingCart, 'products' | 'free' | 'priceProduct' | 'cantProducts' | 'comments'> & {
  products?: OrderItemProduct | null
  free?: FreeFlag
  priceProduct?: NumericValue
  cantProducts?: NumericValue
  comments?: string | null
}
