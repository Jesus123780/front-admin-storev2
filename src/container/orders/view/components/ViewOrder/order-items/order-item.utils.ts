import type { OrderItemCart, SoldExtra, SoldOptional, SoldSubOptional } from './order-item.types'

export const finiteNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export const isFreeFlag = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || value === 'true'

export const label = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

export const extraSubtotal = (extra: SoldExtra): number | null => {
  const persisted = finiteNumber(extra.newExtraPrice)
  if (persisted !== null) return persisted
  const unit = finiteNumber(extra.extraPrice)
  const quantity = finiteNumber(extra.quantity)
  return unit !== null && quantity !== null ? finiteNumber(unit * quantity) : null
}

export const recordedExtras = (value: OrderItemCart['products']): SoldExtra[] =>
  (value?.ExtProductFoodsAll ?? []).filter((extra): extra is SoldExtra => extra != null)

export const recordedOptions = (value: OrderItemCart['products']): SoldOptional[] =>
  (value?.ExtProductFoodOptional ?? []).filter((option): option is SoldOptional => option != null)

// The current GET_ONE_SALE does not return check. Do not infer selection from state.
export const visibleSubOptions = (option: SoldOptional): SoldSubOptional[] =>
  (option.ExtProductFoodsSubOptionalAll ?? []).filter((sub): sub is SoldSubOptional => sub != null && sub.check !== false)

export const getItemAmounts = (item: OrderItemCart) => {
  const quantity = finiteNumber(item.cantProducts)
  const unit = finiteNumber(item.priceProduct)
  const original = finiteNumber(item.products?.ProPrice)
  const extras = recordedExtras(item.products)
  const subtotals = extras.map(extraSubtotal)
  const extraTotal = subtotals.some(value => value === null)
    ? null
    : subtotals.reduce<number>((total, value) => total + (value ?? 0), 0)
  const base = quantity !== null && quantity >= 0 && unit !== null
    ? finiteNumber(unit * quantity)
    : null
  const subtotal = base !== null && extraTotal !== null ? finiteNumber(base + extraTotal) : null
  const free = isFreeFlag(item.free ?? item.products?.free) && unit === 0
  return { quantity, unit, original, extraTotal, subtotal, free,
    courtesy: free && original !== null && original > 0 }
}

export const resolveImage = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const path = value.trim()
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('/') && !path.startsWith('//')) return path
  return `/api/images/${encodeURIComponent(path)}`
}
