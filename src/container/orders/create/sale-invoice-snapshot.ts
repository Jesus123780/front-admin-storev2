/** Build a durable checkout snapshot for the existing legacy PDF template. */
import type { generatePdfDocumentInvoice } from 'pkg-components'

type LegacyInvoiceData = Parameters<typeof generatePdfDocumentInvoice>[0]['data']
type UnknownRecord = Record<string, unknown>

type StoreFields = {
  Image?: unknown
  addressStore?: unknown
  ULocation?: unknown
  storePhone?: unknown
  uPhoNum?: unknown
  NitStore?: unknown
  storeName?: unknown
}
type ClientFields = {
  clientName?: unknown
  clientLastName?: unknown
  clientNumber?: unknown
  ccClient?: unknown
}
type InvoiceProduct = {
  pId: string
  pName: string
  ProPrice: number
  ProQuantity: number
  unitPrice: number
  free: boolean
  dataExtra: Array<{
    exPid: string
    extraName: string
    quantity: number
    newExtraPrice: number
  }>
  dataOptional: Array<{
    opExPid: string
    OptionalProName: string
    ExtProductFoodsSubOptionalAll: Array<{
      opSubExPid: string
      OptionalSubProName: string
      check: true
    }>
  }>
}
type SnapshotInput = {
  store?: StoreFields | null
  client?: ClientFields | null
  products: unknown
  total: number
  change?: unknown
  delivery?: unknown
  urlStore?: string
  submittedAt: number
}

export interface InvoiceSnapshot {
  submittedAt: number
  data: Omit<LegacyInvoiceData, 'products'> & { products: InvoiceProduct[] }
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const list = (value: unknown): UnknownRecord[] => Array.isArray(value) ? value.filter(isRecord) : []
const text = (value: unknown): string =>
  typeof value === 'string' ? value.trim() :
    typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
const numberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !/^[+-]?\d+(?:\.\d+)?$/.test(value.trim())) return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}
const requiredNumber = (value: unknown, field: string): number => {
  const numeric = numberOrNull(value)
  if (numeric === null) throw new Error(`Importe o cantidad no disponible: ${field}`)
  return numeric
}
const amountFormatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'medium',
  timeStyle: 'short'
})

/** Only fields actually consumed by pkg-components' ListPDF are copied. */
export const snapshotInvoiceProducts = (input: unknown): InvoiceProduct[] => {
  if (!Array.isArray(input) || input.length === 0 || input.some(item => !isRecord(item))) {
    throw new Error('No hay líneas de venta válidas para el documento')
  }
  return list(input).map((item, index) => {
    const free = item.free === true || item.free === 1 || item.free === '1'
    const quantity = requiredNumber(item.ProQuantity, 'ProQuantity')
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Cantidad de venta no válida')
    return {
      // The legacy PDF uses pId as React key, so qualify it by cart line.
      // This identifier is used only by the document, never by a mutation.
      pId: `${text(item.refCodePid) || text(item.pId) || 'item'}:${index}`,
      pName: text(item.pName) || 'Producto sin nombre',
      ProPrice: requiredNumber(item.ProPrice, 'ProPrice'),
      ProQuantity: quantity,
      unitPrice: free ? (numberOrNull(item.unitPrice) ?? 0) : requiredNumber(item.unitPrice, 'unitPrice'),
      free,
      dataExtra: list(item.dataExtra).flatMap((extra, i) => {
        const selected = numberOrNull(extra.quantity)
        if (selected === null || selected < 1 || !Number.isInteger(selected)) return []
        return [{
          exPid: `${text(extra.exPid) || 'extra'}:${i}`,
          extraName: text(extra.extraName) || 'Complemento',
          quantity: selected,
          newExtraPrice: requiredNumber(extra.newExtraPrice, 'newExtraPrice')
        }]
      }),
      dataOptional: list(item.dataOptional).flatMap((group, i) => {
        const selected = list(group.ExtProductFoodsSubOptionalAll)
          .filter(option => option.check === true)
          .map((option, j) => ({
            opSubExPid: text(option.opSubExPid) || `sub-${j}`,
            OptionalSubProName: text(option.OptionalSubProName) || 'Opción',
            check: true as const
          }))
        if (!selected.length) return []
        return [{
          opExPid: text(group.opExPid) || `group-${i}`,
          OptionalProName: text(group.OptionalProName),
          ExtProductFoodsSubOptionalAll: selected
        }]
      })
    }
  })
}

/** Freeze the submitted cart; this does not claim the backend has accepted it. */
export const createInvoiceSnapshot = (input: SnapshotInput): InvoiceSnapshot => {
  if (!Number.isFinite(input.total)) throw new Error('Importe de venta no válido')
  if (!Number.isFinite(input.submittedAt)) throw new Error('Fecha de envío no válida')
  const store = input.store
  const client = input.client
  const name = text(client?.clientName)
  const surname = text(client?.clientLastName)
  const fullName = !name ? surname : !surname || name.toLocaleLowerCase('es-CO').endsWith(surname.toLocaleLowerCase('es-CO')) ? name : `${name} ${surname}`
  return {
    submittedAt: input.submittedAt,
    data: {
      srcLogo: text(store?.Image) || '/images/DEFAULTBANNER.png',
      // Never substitute the customer's address for the store's address.
      addressStore: text(store?.addressStore) || text(store?.ULocation),
      storePhone: text(store?.storePhone) || text(store?.uPhoNum) || null,
      date: dateFormatter.format(input.submittedAt),
      client: { clientName: fullName || null, clientNumber: text(client?.clientNumber) || null, ccClient: text(client?.ccClient) || null },
      ref: '',
      products: snapshotInvoiceProducts(input.products),
      // The legacy template prepends '$' itself.
      total: amountFormatter.format(input.total),
      change: text(input.change),
      delivery: text(input.delivery),
      NitStore: text(store?.NitStore),
      storeName: text(store?.storeName),
      urlStore: input.urlStore
    }
  }
}

export const confirmInvoiceSnapshot = (snapshot: InvoiceSnapshot, code: string): InvoiceSnapshot => {
  const ref = code.trim()
  if (!ref) throw new Error('Referencia de venta no válida')
  return { ...snapshot, data: { ...snapshot.data, ref } }
}

/**
 * Compatibility boundary: ListPDF currently types each line as an entire UI
 * ProductFood (including onClick/render), but it only reads the fields above.
 * Keep that mismatch isolated here, not in the domain or submission flow.
 */
export const toLegacyInvoiceData = (snapshot: InvoiceSnapshot): LegacyInvoiceData => ({
  ...snapshot.data,
  products: snapshot.data.products as unknown as LegacyInvoiceData['products']
})
