import type { RefObject, MutableRefObject } from 'react'

export type ReceiptDiscount = number | { type?: string | null; value?: number | null } | null
export type ReceiptPaper = 'auto' | '58mm' | '80mm' | 'a4'
export type SourceRecord = Record<string, unknown>
export type Amount = number | null

export interface PrintsMemoProps {
  data: readonly unknown[]
  dataClientes?: unknown
  values: unknown
  paymentMethod: string
  handleSubmit?: () => void | Promise<unknown>
  code: string | null
  change: unknown
  total: number
  isPrinting: boolean
  promiseResolveRef: MutableRefObject<(() => void) | null>
  discount?: ReceiptDiscount
  componentRef: RefObject<HTMLDivElement | null>
  /** Fecha real de la operación; no se infiere de la fecha del sistema. */
  saleDate?: string | number | Date | null
  /** Para un documento histórico confirmado por el backend. */
  mode?: 'preview' | 'receipt'
  /** Estado de la mutación del padre. */
  submitting?: boolean
  /** Override only when the payment system identifies the payment type. */
  paymentKind?: 'cash' | 'non-cash' | 'unknown'
  paper?: ReceiptPaper
  /** Ancho realmente imprimible, no el ancho nominal del papel. */
  printableWidthMm?: number
  thankYouMessage?: string
  /** Notificación opcional si faltaron recursos al preparar la impresión. */
  onPrintPreparationIssue?: (reason: string) => void
}

export interface ReceiptExtra {
  key: string
  name: string
  quantity: Amount
  unitPrice: Amount
  total: Amount
  originalTotal: Amount
  discountAmount: Amount
  reportedDiscountAmount: Amount
  inconsistentCourtesyPrice: boolean
}
export interface ReceiptOption {
  key: string
  name: string
  options: { key: string; name: string }[]
}
export interface ReceiptProduct {
  key: string
  name: string
  quantity: Amount
  unitPrice: Amount
  total: Amount
  free: boolean
  originalTotal: Amount
  discountAmount: Amount
  discountPercent: Amount
  reportedDiscountAmount: Amount
  sku: string
  comment: string
  extras: ReceiptExtra[]
  optionals: ReceiptOption[]
}
export interface ReceiptStore {
  name: string
  logo: string
  nit: string
  address: string
  phone: string
}
export interface ReceiptClient {
  name: string
  document: string
  phone: string
  address: string
}

export interface ReceiptFinancials {
  total: Amount
  productNet: Amount
  extraNet: Amount
  productGross: Amount
  extraGross: Amount
  appliedDiscount: Amount
  courtesy: Amount
  reportedDiscount: Amount
  reportedDiscountLabel: string | null
  netMatches: boolean
  showBreakdown: boolean
  warnings: string[]
}
export interface ReceiptPayment {
  name: string
  kind: 'cash' | 'non-cash' | 'unknown'
  change: Amount
  reportedChange: Amount
  warning: string | null
}
