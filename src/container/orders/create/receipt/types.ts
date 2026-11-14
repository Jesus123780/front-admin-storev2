import type { RefObject, MutableRefObject } from 'react'
import type { PreviewInput, ReceiptView } from './financial-receipt'
export type { ReceiptPayment, ReceiptFinancials, ReceiptProduct, ReceiptExtra, ReceiptOption, Amount } from './financial-receipt'

export type ReceiptDiscount = number | { type?: string | null; value?: number | null } | null
export type ReceiptPaper = 'auto' | '58mm' | '80mm' | 'a4'
export type SourceRecord = Record<string, unknown>


export interface PrintsMemoProps {
  data: readonly unknown[]
  previewInput?: PreviewInput
  persistedView?: ReceiptView
  persistedStore?: ReceiptStore
  persistedClient?: ReceiptClient | null
  checkoutBlocked?: boolean
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

