import { list, record } from './normalize'
import type { ReceiptFinancials, ReceiptPayment, ReceiptProduct, ReceiptStore, ReceiptClient } from './types'

/** Allowlisted diagnostic data: no entire customer/store objects, internal IDs,
 * paths, credentials, arbitrary comments, DOM elements or function references. */
const scalar = (value: unknown): string | number | boolean | null => {
  if (typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value)
  return null
}
const pick = (value: unknown, fields: readonly string[]) => {
  const input = record(value)
  return Object.fromEntries(fields.map(key => [key, scalar(input[key])]))
}
export function debugCart(source: unknown) {
  return list(source).map((raw, index) => {
    const item = record(raw)
    return {
      line: index + 1,
      ...pick(item, ['pName', 'unitPrice', 'ProPrice', 'ProQuantity', 'oldQuantity', 'free', 'originalProPrice', 'ProDescuento', 'discountAmount', 'discountPercent', 'manageStock', 'stock', 'editing']),
      hasImage: Boolean(item.ProImage), hasDescription: Boolean(item.ProDescription), hasTag: Boolean(item.getOneTags),
      dataExtra: list(item.dataExtra).map(extra => pick(extra, ['extraName', 'extraPrice', 'quantity', 'newExtraPrice', 'originalNewExtraPrice', 'discountAmount', 'discountPercent', 'manageStock', 'stock', 'exState', 'state'])),
      dataOptional: list(item.dataOptional).map(rawGroup => {
        const group = record(rawGroup)
        return {...pick(group, ['OptionalProName', 'numbersOptionalOnly', 'required', 'state']), ExtProductFoodsSubOptionalAll: list(group.ExtProductFoodsSubOptionalAll).map(sub => pick(sub, ['OptionalSubProName', 'check', 'state']))}
      })
    }
  })
}
export function debugItems(items: readonly ReceiptProduct[]) {
  return items.map(({key, comment, sku, extras, optionals, ...item}, index) => ({
    line: index + 1, ...item, hasComment: Boolean(comment), hasSku: Boolean(sku),
    extras: extras.map(({key, ...extra}) => extra),
    optionals: optionals.map(({key, options, name}) => ({name, options: options.map(({name}) => ({name}))}))
  }))
}
export function debugIdentity(store: ReceiptStore, client: ReceiptClient | null) {
  return { store: { hasName: Boolean(store.name), hasLogo: Boolean(store.logo), hasNit: Boolean(store.nit), hasAddress: Boolean(store.address), hasPhone: Boolean(store.phone) }, client: { selected: Boolean(client), hasName: Boolean(client?.name), hasDocument: Boolean(client?.document), hasPhone: Boolean(client?.phone), hasAddress: Boolean(client?.address) } }
}
export function downloadReceiptDebug(payload: { cart: unknown; items: readonly ReceiptProduct[]; financials: ReceiptFinancials; payment: ReceiptPayment; store: ReceiptStore; client: ReceiptClient | null; configuration: Record<string, unknown>; state: Record<string, unknown> }) {
  const json = JSON.stringify({ metadata: { component: 'PrintsMemo', version: '4.0.0', generatedAt: new Date().toISOString() }, raw: debugCart(payload.cart), normalized: debugItems(payload.items), financial: payload.financials, payment: payload.payment, identity: debugIdentity(payload.store, payload.client), configuration: payload.configuration, state: payload.state }, null, 2)
  const url = URL.createObjectURL(new Blob([json], {type: 'application/json;charset=utf-8'}))
  const link = document.createElement('a')
  link.href = url
  link.download = 'RECEIPT_DEBUG.json'
  document.body.appendChild(link)
  try { link.click() } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
}
