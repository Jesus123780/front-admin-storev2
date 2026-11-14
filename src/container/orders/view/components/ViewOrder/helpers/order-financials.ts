import type {
 OrderTotalRow, SaleCalculatedExtra, SaleCalculatedLine, SaleFinancials, SummaryEffect, TotalUnit 
} from '../../types/order'
import {
 decimalParts,formatCOP, formatPercent, moneyMinor 
} from './order-format'
export interface DisplayRow { key: string; label: string; text: string; effect: SummaryEffect; unit: TotalUnit }
const normalizeLabel = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9%]/g, '')
const legacyKeys: Record<string,string> = { subtotal:'subtotal', extras:'totalExtras', impuestos:'totalVat', descuentos:'totalDiscounts', total:'grandTotal', descuentoglobal:'globalDiscountValue', 'descuentoaplicado%':'globalDiscountPercent', descuentoaplicado:'globalDiscountPercent', totalcondescuento:'grandTotalAfterGlobalDiscount', totalapagar:'payableTotal' }
const discountKeys = new Set(['discountAmount','globalDiscountValue','totalDiscounts'])
const finalKeys = new Set(['payableTotal','grandTotalAfterGlobalDiscount'])
export const isVerified = (f?: SaleFinancials | null): boolean => f?.source === 'persisted' && f.valid === true && f.breakdownVerified === true
export function rowValue(row: OrderTotalRow): unknown { return row.exactValue ?? row.numericValue ?? row.value }
function makeRow(row: OrderTotalRow, key: string, effect: SummaryEffect, currency: string, label = row.name.replace(/:\s*$/, '')): DisplayRow {
  const unit = row.unit ?? (key === 'globalDiscountPercent' || key === 'discountPercent' ? 'PERCENT' : 'MONEY')
  const v = rowValue(row)
  let text = unit === 'PERCENT' ? formatPercent(v) : formatCOP(v, currency)
  if (effect === 'SUBTRACT' && unit === 'MONEY' && (moneyMinor(v) ?? BigInt(0)) > BigInt(0) && text !== '—') {text = `− ${text}`}
  return { key, label, text, unit, effect }
}
export function getSummary(f?: SaleFinancials | null, legacy?: (OrderTotalRow | null)[] | null) {
  const currency = f?.currency || 'COP'
  if (f) {
    const trusted = isVerified(f)
    const summary = (f.summary ?? []).filter((row): row is NonNullable<typeof row> => Boolean(row))
    const allowedUnverified = new Set(['gross','discountAmount','netTotal','delivery','tip','payableTotal'])
    const netEqualsPayable = moneyMinor(f.exact?.netTotal ?? f.netTotal) !== null && moneyMinor(f.exact?.netTotal ?? f.netTotal) === moneyMinor(f.exact?.payableTotal ?? f.payableTotal)
    const rows = summary.filter(r => trusted || allowedUnverified.has(r.key)).filter(r => r.key !== 'payableTotal' && !(netEqualsPayable && r.key === 'netTotal'))
      .map(r => makeRow(r,r.key,r.effect,currency))
    // Never infer from legacy rows when a structured financial response exists.
    const final = formatCOP(f.exact?.payableTotal ?? f.payableTotal,currency)
    return { rows, final, finalLabel: f.source === 'persisted' ? 'Total de la venta' : 'Total de referencia', mode: trusted ? 'verified' as const : 'review' as const }
  }
  const source = (legacy ?? []).filter((r): r is OrderTotalRow => Boolean(r))
  const keyed = source.map(r => ({ r,key:r.key || legacyKeys[normalizeLabel(r.name)] || '' }))
  const final = keyed.find(x => x.key === 'payableTotal') ?? keyed.find(x => x.key === 'grandTotalAfterGlobalDiscount') ?? keyed.find(x => x.key === 'grandTotal')
  const rows = keyed.filter(x => x !== final).map(({ r,key },index) => makeRow(r,key || `legacy-${index}`,discountKeys.has(key) ? 'SUBTRACT' : key==='totalExtras' || key==='globalDiscountPercent' ? 'INFO' : key==='subtotal'||key==='grandTotal'?'TOTAL':'ADD',currency,key==='subtotal'?'Subtotal (incluye extras)':key==='totalExtras'?'Complementos (incluidos)':undefined))
  return { rows, final:final ? makeRow(final.r,final.key,'TOTAL',currency).text : '—', finalLabel:'Total informado', mode:'legacy' as const }
}
/** Join only by sale-line ID. Duplicate/missing identities are not guessable. */
export function indexUnique<T extends {id:string}>(items?: readonly (T | null)[] | null): Map<string,T> {
  const map=new Map<string,T>(), duplicates=new Set<string>()
  for(const item of items??[]) { if(!item?.id || duplicates.has(item.id)) {continue;} if(map.has(item.id)){map.delete(item.id);duplicates.add(item.id)}else {map.set(item.id,item)} }
  return map
}
export const getVerifiedLines = (f?: SaleFinancials | null): Map<string,SaleCalculatedLine> => isVerified(f) ? indexUnique(f?.calculated?.lines) : new Map()
export const getLineExtras = (line?: SaleCalculatedLine): Map<string,SaleCalculatedExtra> => indexUnique(line?.extras)
export function isCashPayment(name?: string | null): boolean { return /^(efectivo|cash|pago en efectivo|dinero en efectivo)$/.test((name??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ')) }
export function isPositiveMoney(value: unknown): boolean { return (moneyMinor(value)??BigInt(0))>BigInt(0) }
export function validQuantity(value: unknown): number | null {const d=decimalParts(value); if(!d||/[1-9]/.test(d.fraction)){return null;} const n=Number(d.whole);return Number.isSafeInteger(n)&&n>=0?n:null}
