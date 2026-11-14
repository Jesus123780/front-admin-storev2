import type { Amount, ReceiptClient, ReceiptDiscount, ReceiptExtra, ReceiptOption, ReceiptProduct, ReceiptStore, SourceRecord, ReceiptFinancials, ReceiptPayment } from './types'

export const record = (value: unknown): SourceRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as SourceRecord : {}

export const list = (value: unknown): readonly unknown[] => Array.isArray(value) ? value : []
export const text = (value: unknown): string => typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
export const firstText = (...values: unknown[]): string => values.map(text).find(Boolean) ?? ''

/** GraphQL values are canonical numbers / decimal strings, never locale strings. */
export const amount = (value: unknown): Amount => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

/** `values.change` is formatted by the POS input in es-CO. */
export const cashAmount = (value: unknown): Amount => {
  if (typeof value !== 'string') return amount(value)
  const clean = value.trim()
  if (/^[+-]?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(clean)) return amount(clean.replace(/\./g, '').replace(',', '.'))
  if (/^[+-]?\d+(?:,\d+)?$/.test(clean)) return amount(clean.replace(',', '.'))
  return amount(clean)
}

const positiveQuantity = (value: unknown): Amount => {
  const number = amount(value)
  return number !== null && Number.isInteger(number) && number > 0 ? number : null
}

export const isFree = (value: unknown): boolean => value === true || value === 1 || value === '1'
const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const formatMoney = (value: Amount): string => value === null ? '—' : money.format(value)
export const formatQuantity = (value: Amount): string => value === null ? '—' : String(value)

const safeLogo = (value: unknown): string => {
  const src = text(value)
  if (!src || /[\u0000-\u001f\\]/.test(src)) return ''
  if (/^https?:\/\//i.test(src)) return src
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(src)) return src
  if (/^[a-z][a-z\d+.-]*:/i.test(src) || src.startsWith('//')) return ''
  return src
}

export const normalizeStore = (value: unknown): ReceiptStore => {
  const store = record(value)
  return {
    name: firstText(store.storeName, store.description) || 'Comercio',
    logo: safeLogo(store.Image),
    nit: text(store.NitStore),
    address: firstText(store.addressStore, store.ULocation),
    phone: firstText(store.storePhone, store.uPhoNum)
  }
}

/** getClients can return an array or a paginated { data: [...] } envelope. */
export const selectClient = (source: unknown, values: unknown): ReceiptClient | null => {
  const id = text(record(values).cliId)
  if (!id) return null
  const candidates = Array.isArray(source) ? source : list(record(source).data)
  const found = candidates.find(candidate => text(record(candidate).cliId) === id)
  if (!found) return null
  const client = record(found)
  const firstName = text(client.clientName)
  const lastName = text(client.clientLastName)
  const fullName = lastName && !firstName.toLocaleLowerCase().endsWith(lastName.toLocaleLowerCase()) ? [firstName, lastName].filter(Boolean).join(' ') : firstName || lastName
  const result = { name: fullName, document: text(client.ccClient), phone: text(client.clientNumber), address: text(client.ClientAddress) }
  return Object.values(result).some(Boolean) ? result : null
}

export const normalizeOptionals = (source: unknown): ReceiptOption[] => list(source).flatMap((raw, groupIndex) => {
  const group = record(raw)
  const selected = list(group.ExtProductFoodsSubOptionalAll).filter(raw => record(raw).check === true)
  const options = selected.flatMap((raw, index) => {
    const sub = record(raw)
    const name = text(sub.OptionalSubProName)
    return [{ key: `${firstText(sub.opSubExPid, sub.exCode)}:${index}`, name: name || 'Opción sin nombre' }]
  })
  return options.length ? [{ key: `${firstText(group.opExPid, group.code)}:${groupIndex}`, name: text(group.OptionalProName) || 'Opciones', options }] : []
})

export const normalizeExtras = (source: unknown, parentCourtesy = false): ReceiptExtra[] => list(source).flatMap((raw, index) => {
  const extra = record(raw)
  const quantity = positiveQuantity(extra.quantity)
  if (quantity === null) return [] // not selected / invalid
  // newExtraPrice is the entire extra line; do not multiply it again.
  // No fallback from a malformed or absent effective line price.
  const total = amount(extra.newExtraPrice)
  const unitPrice = amount(extra.extraPrice)
  const originalTotal = parentCourtesy && unitPrice !== null ? Math.round(unitPrice * quantity * 100) / 100 : lineOriginal(extra.originalNewExtraPrice, unitPrice, quantity, total, extra.discountAmount)
  // A legacy courtesy bug zeroed paid extras without any independent discount.
  // Keep the received net (never invent revenue in the receipt), but do not
  // label this as a verified commercial discount or strike the amount.
  const inconsistentCourtesyPrice = parentCourtesy && originalTotal !== null && total !== null && !same(originalTotal, total)
  return [{ key: `${text(extra.exPid)}:${index}`, name: text(extra.extraName) || 'Complemento', quantity, unitPrice, total, originalTotal, discountAmount: inconsistentCourtesyPrice ? null : reduction(originalTotal, total), reportedDiscountAmount: amount(extra.discountAmount), inconsistentCourtesyPrice }]
})

/** Cart contract: ProPrice = line total, unitPrice = stored base unit price. */
export const normalizeProducts = (source: unknown): ReceiptProduct[] => list(source).map((raw, index) => {
  const item = record(raw)
  const quantity = positiveQuantity(item.ProQuantity)
  const unitPrice = amount(item.unitPrice)
  const total = amount(item.ProPrice)
  // Courtesy metadata reports a commercial discount of 0. It must not
  // hide the real original price (zero + 0 is not the courtesy value).
  const courtesyBase = isFree(item.free) && total === 0 && unitPrice !== null && quantity !== null && unitPrice >= 0 ? addAmounts([Math.round(unitPrice * quantity * 100) / 100]) : null
  const originalTotal = courtesyBase ?? lineOriginal(item.originalProPrice, unitPrice, quantity, total, item.discountAmount)
  const percent = amount(item.discountPercent)
  return {
    key: `${firstText(item.shoppingCartId, item.refCodePid, item.pId)}:${index}`,
    name: text(item.pName) || 'Producto sin nombre',
    quantity,
    unitPrice,
    total,
    originalTotal,
    discountAmount: reduction(originalTotal, total),
    reportedDiscountAmount: amount(item.discountAmount),
    discountPercent: percent !== null && percent >= 0 && percent <= 100 ? percent : null,
    sku: text(item.pCode),
    free: isFree(item.free),
    comment: firstText(item.comment, item.comments),
    extras: normalizeExtras(item.dataExtra, isFree(item.free)),
    optionals: normalizeOptionals(item.dataOptional)
  }
})

/** Numeric discount from useSales is an amount already reflected in the cart. */
export const discountLabel = (discount: ReceiptDiscount | undefined): string | null => {
  if (typeof discount === 'number') return Number.isFinite(discount) && discount > 0 ? formatMoney(discount) : null
  const value = amount(discount?.value)
  if (value === null || value <= 0) return null
  if (discount?.type === 'PERCENT' && value <= 100) return `${value}%`
  if (discount?.type === 'AMOUNT') return formatMoney(value)
  return null
}

export const receiptDate = (value: string | number | Date | null | undefined): { label: string; iso: string } | null => {
  if (value == null || value === '') return null
  // Backend timestamps such as 2026-11-14 02:32:10.377 -0500.
  const normalized = typeof value === 'string' ? value.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s*([+-]\d{2})(\d{2})$/, '$1T$2$3:$4') : value
  const date = normalized instanceof Date ? normalized : new Date(normalized)
  if (!Number.isFinite(date.getTime())) return null
  return { label: new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(date), iso: date.toISOString() }
}

export const hasIncompleteAmounts = (items: readonly ReceiptProduct[], total: Amount): boolean =>
  total === null || items.some(item => item.total === null || item.quantity === null || item.unitPrice === null || item.extras.some(extra => extra.total === null || extra.unitPrice === null || extra.quantity === null))

/** For the separate PDF generator: preserve original fields and confirmed selections. */
export const selectedCartForExport = (source: unknown): SourceRecord[] => list(source).map(raw => {
  const product = record(raw)
  return {
    ...product,
    dataExtra: list(product.dataExtra).filter(raw => positiveQuantity(record(raw).quantity) !== null),
    dataOptional: list(product.dataOptional).flatMap(raw => {
      const group = record(raw)
      const selected = list(group.ExtProductFoodsSubOptionalAll).filter(raw => record(raw).check === true)
      return selected.length ? [{ ...group, ExtProductFoodsSubOptionalAll: selected }] : []
    })
  }
})

/** Work in integer cents for comparison and addition; never mutate the provided total. */
function cents(value: Amount): number | null {
  if (value === null || !Number.isFinite(value)) return null
  const scaled = Math.round(value * 100)
  return Number.isSafeInteger(scaled) && Math.abs(value * 100 - scaled) < 0.0001 ? scaled : null
}
function addAmounts(values: readonly Amount[]): Amount {
  let sum = 0
  for (const value of values) {
    const part = cents(value)
    if (part === null || !Number.isSafeInteger(sum + part)) return null
    sum += part
  }
  return sum / 100
}
function same(a: Amount, b: Amount): boolean {
  const first = cents(a)
  return first !== null && first === cents(b)
}
function reduction(original: Amount, final: Amount): Amount {
  if (original === null || final === null || original < final || final < 0) return null
  return addAmounts([original, -final])
}
function lineOriginal(explicit: unknown, unit: Amount, quantity: Amount, final: Amount, explicitDiscount: unknown): Amount {
  const original = amount(explicit)
  if (original !== null && original >= 0) return original
  const statedDiscount = amount(explicitDiscount)
  if (statedDiscount !== null && statedDiscount >= 0 && final !== null) return addAmounts([final, statedDiscount])
  // Unit price is the base price in this POS. A matching net confirms an undiscounted line.
  const base = unit !== null && quantity !== null ? unit * quantity : null
  return same(base, final) ? final : null
}
function reportedDiscountAmount(discount: ReceiptDiscount | undefined): Amount {
  if (typeof discount === 'number') return amount(discount)
  return discount?.type === 'AMOUNT' ? amount(discount.value) : null
}
export function summarizeReceipt(items: readonly ReceiptProduct[], total: Amount, discount?: ReceiptDiscount): ReceiptFinancials {
  const extras = items.flatMap(item => item.extras)
  const productNet = addAmounts(items.map(item => item.total))
  const extraNet = addAmounts(extras.map(extra => extra.total))
  const productGross = addAmounts(items.map(item => item.originalTotal))
  const extraGross = addAmounts(extras.map(extra => extra.originalTotal))
  const paidProducts = items.filter(item => !(item.free && item.total === 0))
  const courtesy = addAmounts(items.filter(item => item.free && item.total === 0).map(item => item.discountAmount))
  const appliedDiscount = addAmounts([...paidProducts.map(item => item.discountAmount), ...extras.map(extra => extra.discountAmount)])
  const reportedDiscount = reportedDiscountAmount(discount)
  const netMatches = same(addAmounts([productNet, extraNet]), total)
  const showBreakdown = netMatches && productGross !== null && extraGross !== null && appliedDiscount !== null && courtesy !== null && same(addAmounts([productGross, extraGross, -appliedDiscount, -courtesy]), total)
  const warnings: string[] = []
  if (!netMatches) warnings.push('El total informado no coincide con las líneas y complementos disponibles. Verifica los importes antes de confirmar.')
  if (reportedDiscount !== null && appliedDiscount !== null && !same(reportedDiscount, appliedDiscount)) warnings.push('El descuento informado no coincide con los descuentos identificados en las líneas.')
  // POS discountAmount on a product is the allocated discount of the entire
  // line (main + extras); compare with that scope, not just the main price.
  if (items.filter(item => !item.free).some(item => item.reportedDiscountAmount !== null && !same(item.reportedDiscountAmount, addAmounts([item.discountAmount, ...item.extras.map(extra => extra.discountAmount)]))) || extras.some(extra => extra.reportedDiscountAmount !== null && extra.discountAmount !== null && !same(extra.reportedDiscountAmount, extra.discountAmount))) warnings.push('Existe un descuento de línea informado que no coincide con su precio original y final.')
  if (extras.some(extra => extra.inconsistentCourtesyPrice)) warnings.push('Hay complementos con precio propio alterado por una cortesía. Corrige el carrito antes de confirmar; no se modifican importes desde el comprobante.')
  if (items.some(item => item.free && item.total !== null && item.total !== 0)) warnings.push('Existe una línea marcada como cortesía con un importe distinto de cero.')
  return { total, productNet, extraNet, productGross, extraGross, appliedDiscount, courtesy, reportedDiscount, reportedDiscountLabel: discountLabel(discount), netMatches, showBreakdown, warnings }
}
export function normalizePayment(method: unknown, rawChange: unknown, override?: ReceiptPayment['kind']): ReceiptPayment {
  const name = text(method)
  const label = name.toLocaleLowerCase('es-CO').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const kind = override ?? (/^(efectivo|cash)$/.test(label) ? 'cash' : /^(mastercard|master card|visa|tarjeta(?: de (?:debito|credito))?|debito|credito|transferencia|nequi|daviplata|pse|american express|amex)$/.test(label) ? 'non-cash' : 'unknown')
  const reportedChange = cashAmount(rawChange)
  const change = kind === 'cash' && reportedChange !== null && reportedChange >= 0 ? reportedChange : null
  const warning = reportedChange !== null && reportedChange !== 0 && change === null ? (reportedChange < 0 && kind === 'cash' ? 'El cambio informado es negativo; verifica el importe.' : 'Hay un cambio informado que no corresponde a un pago en efectivo confirmado. Revisa el campo Cambio del POS.') : null
  return { name, kind, change, reportedChange, warning }
}
