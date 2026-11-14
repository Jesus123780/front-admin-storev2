import type { Product, ShoppingCart, SoldExtra, SoldOptional, SoldSubOptional } from '../../types/order'
export type { SoldExtra, SoldOptional, SoldSubOptional }
export type NumericValue = number | string | null | undefined
export type FreeFlag = boolean | number | string | null
export type OrderItemProduct = Omit<Product, 'free' | 'ProPrice'> & { free?: FreeFlag; ProPrice?: NumericValue }
export type OrderItemCart = Omit<ShoppingCart, 'products' | 'free' | 'priceProduct' | 'cantProducts' | 'comments'> & { products?: OrderItemProduct | null; free?: FreeFlag; priceProduct?: NumericValue; cantProducts?: NumericValue; comments?: string | null }
