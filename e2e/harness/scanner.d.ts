/** Tipos del API que el harness E2E expone en `window.__scanner`. */
interface ScannerHarnessOutcome {
  status: 'FOUND' | 'NOT_FOUND' | 'INVALID' | 'ERROR' | 'DUPLICATE_EVENT'
  barcode: string
  product: unknown | null
  message: string
}

interface ScannerHarnessCartItem {
  pId: string
  pName: string
  ProPrice: number
  ProQuantity: number
}

interface ScannerHarnessApi {
  scan: (rawCode: string | number) => Promise<ScannerHarnessOutcome>
  scanImage: (
    file: File,
    mode?: 'linear' | 'qr'
  ) => Promise<{ decoded: { success: boolean; code: string | null; format: string | null; message: string }; outcome: ScannerHarnessOutcome | null }>
  getCart: () => ScannerHarnessCartItem[]
  getTotal: () => number
  reset: () => void
}

interface Window {
  __scanner: ScannerHarnessApi
  __wedgeLast?: Promise<ScannerHarnessOutcome>
}
