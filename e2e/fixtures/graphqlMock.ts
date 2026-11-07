import type { Page, Route } from '@playwright/test'

/**
 * Catálogo de productos de prueba (fixtures controlados). NO son datos de
 * producción. La clave es el código de barras.
 */
export const PRODUCT_FIXTURES: Record<string, { pId: string; pName: string; ProPrice: number }> = {
  '7701234567897': { pId: 'p-coca', pName: 'Coca-Cola 400ml', ProPrice: 3500 },
  '7709999999992': { pId: 'p-agua', pName: 'Agua 600ml', ProPrice: 2000 }
}

/** Código válido pero inexistente en el catálogo (para el flujo de creación). */
export const UNKNOWN_BARCODE = '7705555555552'

export interface MockOptions {
  /** Forzar un error de servidor en la consulta por barcode. */
  forceServerError?: boolean
}

/**
 * Intercepta el endpoint GraphQL y responde con los fixtures. Diferencia:
 *  - findProductByBarcode: FOUND / NOT_FOUND / INVALID / ERROR según el código.
 * Así los specs ejercitan el camino de red real sin backend ni BD.
 */
export const mockGraphql = async (page: Page, options: MockOptions = {}): Promise<void> => {
  await page.route('**/graphql', async (route: Route) => {
    if (options.forceServerError) {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"errors":[{"message":"boom"}]}' })
      return
    }

    const request = route.request()
    let body: any = {}
    try {
      body = JSON.parse(request.postData() || '{}')
    } catch {
      body = {}
    }

    const code = String(body?.variables?.ProBarCode ?? '').trim()

    // Validación de formato mínima (el backend real valida en profundidad).
    const isNumericLike = /^[0-9A-Za-z\-.$/+%\s]+$/.test(code)
    if (!code || !isNumericLike || code.length < 6) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            findProductByBarcode: {
              success: false,
              status: 'INVALID',
              message: 'Formato inválido.',
              barcode: code,
              data: null
            }
          }
        })
      })
      return
    }

    const product = PRODUCT_FIXTURES[code]
    const payload = product
      ? {
          success: true,
          status: 'FOUND',
          message: 'Producto encontrado.',
          barcode: code,
          data: { pId: product.pId, pName: product.pName, ProPrice: product.ProPrice, ProBarCode: code }
        }
      : {
          success: false,
          status: 'NOT_FOUND',
          message: 'No se encontró un producto con ese código.',
          barcode: code,
          data: null
        }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { findProductByBarcode: payload } })
    })
  })
}
