/**
 * Punto de entrada del harness E2E del escáner.
 *
 * Re-exporta y orquesta la LÓGICA DE NEGOCIO REAL del escaneo para ejecutarla
 * en un navegador Chromium (vía Playwright), sin depender del stack completo
 * (Next/Electron/Postgres/auth). Expone en `window.__scanner` una API que los
 * specs invocan para simular las fuentes (cámara/USB/manual/imagen), mientras
 * el "backend" se intercepta con fixtures controlados (page.route).
 *
 * Esto es E2E de navegador real con el código real de:
 *   - processBarcode (controlador central: normaliza, deduplica, consulta, carrito)
 *   - decodeBarcodeFromImage (lectura de imagen con ZXing)
 */
import { decodeBarcodeFromImage } from '../../../pkg-components/stories/organisms/BarcodeScanner/helpers/decodeBarcodeFromImage'
import {
  type DedupRef,
  type FindProductByBarcodeResult,
  processBarcode,
  type ProcessBarcodeOutcome
} from '../../../pkg-hook/src/hooks/useSales/helpers/processBarcode.utils'
import { normalizeBarcode } from '../../../pkg-hook/src/hooks/useSales/helpers/resolveProductByBarcode.utils'

interface CartItem {
  pId: string
  pName: string
  ProPrice: number
  ProQuantity: number
}

// Carrito en memoria que replica la semántica de useSales.handleAddProduct:
// si el producto ya está, incrementa cantidad; si no, lo agrega con cantidad 1.
const cart: CartItem[] = []
const dedupRef: { current: DedupRef } = { current: { code: '', at: 0 } }

const addProductToCart = (product: any): void => {
  const pId = String(product?.pId)
  const existing = cart.find((it) => it.pId === pId)
  if (existing) {
    existing.ProQuantity += 1
  } else {
    cart.push({
      pId,
      pName: product?.pName ?? '',
      ProPrice: Number(product?.ProPrice) || 0,
      ProQuantity: 1
    })
  }
}

/**
 * Consulta el "backend" real por red (fetch a /graphql). Playwright intercepta
 * esa ruta con fixtures, así que esto ejercita el camino de red de verdad.
 */
const findByBarcode = async (code: string): Promise<FindProductByBarcodeResult> => {
  try {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'query findProductByBarcode($ProBarCode:String!){ findProductByBarcode(ProBarCode:$ProBarCode){ success status message barcode data { pId pName ProPrice ProBarCode } } }',
        variables: { ProBarCode: code }
      })
    })
    if (!res.ok) {
      return { success: false, status: 'ERROR', message: `HTTP ${res.status}`, barcode: code, data: null }
    }
    const json = await res.json()
    const result = json?.data?.findProductByBarcode
    if (!result) {
      return { success: false, status: 'ERROR', message: 'sin datos', barcode: code, data: null }
    }
    return result as FindProductByBarcodeResult
  } catch (e) {
    return {
      success: false,
      status: 'ERROR',
      message: e instanceof Error ? e.message : 'network error',
      barcode: code,
      data: null
    }
  }
}

/** Procesa un código por el controlador central real. */
const scan = async (rawCode: string | number): Promise<ProcessBarcodeOutcome> => {
  return await processBarcode({
    rawBarcode: rawCode,
    normalize: normalizeBarcode,
    findByBarcode,
    addProductToCart,
    dedupRef
  })
}

/** Decodifica una imagen (File) con ZXing real y procesa el código resultante. */
const scanImage = async (file: File, mode: 'linear' | 'qr' = 'linear') => {
  const decoded = await decodeBarcodeFromImage(file, mode)
  if (!decoded.success || !decoded.code) {
    return { decoded, outcome: null }
  }
  const outcome = await scan(decoded.code)
  return { decoded, outcome }
}

const api = {
  scan,
  scanImage,
  getCart: () => cart.map((it) => ({ ...it })),
  getTotal: () => cart.reduce((acc, it) => acc + it.ProPrice * it.ProQuantity, 0),
  reset: () => {
    cart.length = 0
    dedupRef.current = { code: '', at: 0 }
  }
}

;(window as any).__scanner = api
