import type { OrderItemCart, SoldExtra, SoldOptional, SoldSubOptional } from './order-item.types'
import { moneyMinor, minorText } from '../helpers/order-format'
import { validQuantity } from '../helpers/order-financials'
export const finiteNumber = (value: unknown): number | null => { if (typeof value !== 'number' && typeof value !== 'string' || typeof value==='string'&&!value.trim()) return null; const n=Number(value);return Number.isFinite(n)?n:null }
export const isFreeFlag = (value: unknown): boolean => value===true||value===1||value==='1'||value==='true'
export const label = (value: unknown, fallback: string): string => typeof value==='string'&&value.trim()?value.trim():fallback
export const recordedExtras = (value: OrderItemCart['products']): SoldExtra[] => (value?.ExtProductFoodsAll??[]).filter((e):e is SoldExtra=>e!=null)
export const recordedOptions = (value: OrderItemCart['products']): SoldOptional[] => (value?.ExtProductFoodOptional??[]).filter((e):e is SoldOptional=>e!=null)
export const visibleSubOptions = (option: SoldOptional): SoldSubOptional[] => (option.ExtProductFoodsSubOptionalAll??[]).filter((e):e is SoldSubOptional=>e!=null&&e.check!==false)
/** Legacy fallback only: exact gross from snapshot, never global discount allocation. */
export function multiplyRecorded(price:unknown, qty:unknown):string|null {const c=moneyMinor(price),q=validQuantity(qty);return c===null||q===null?null:minorText(c*BigInt(q))}
export const extraSubtotal = (extra:SoldExtra):string|null => extra.newExtraPrice!=null ? (moneyMinor(extra.newExtraPrice)===null?null:String(extra.newExtraPrice)) : multiplyRecorded(extra.extraPrice,extra.quantity)
export const getItemAmounts = (item:OrderItemCart) => { const quantity=validQuantity(item.cantProducts),unit=item.priceProduct,original=item.products?.ProPrice,free=isFreeFlag(item.free??item.products?.free);return {quantity,unit,original,free,courtesy:free,subtotal:multiplyRecorded(unit,quantity)} }
export const resolveImage = (value:unknown):string|undefined => {if(typeof value!=='string'||!value.trim())return;const path=value.trim();if(/^https?:\/\//i.test(path))return path;if(path.startsWith('/')&&!path.startsWith('//'))return path;return `/api/images/${encodeURIComponent(path)}`}
