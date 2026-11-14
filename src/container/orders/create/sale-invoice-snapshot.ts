import {
 buildPersistedReceipt, rec, type ReceiptView,str 
} from './receipt/financial-receipt'
import {
 normalizeStore, receiptDate,selectClient 
} from './receipt/normalize'
import type { ReceiptClient,ReceiptStore } from './receipt/types'

export interface InvoiceSnapshot {
  reference:string
  store:ReceiptStore
  client:ReceiptClient|null
  date:{label:string;iso:string}|null
  view:ReceiptView
}
/** Build only from a fresh backend response. A submitted cart is not a confirmed invoice. */
export const createInvoiceSnapshot = (sale:unknown,reference:string,expectedStoreId:string):InvoiceSnapshot => {
  const s=rec(sale),customer=rec(s.client)
  if(!expectedStoreId||str(s.idStore)!==expectedStoreId){throw new Error('El comercio de la venta no coincide con la sesión')}
  return { reference,store:normalizeStore(s.store),client:selectClient([customer],{ cliId:customer.cliId }),date:receiptDate(str(s.createdAt)),view:buildPersistedReceipt(s,reference) }
}
