import { readFileSync } from 'fs'
import path from 'path'

import { expect, test } from '@playwright/test'

import {
  PRODUCT_FIXTURES,
  UNKNOWN_BARCODE,
  mockGraphql
} from '../fixtures/graphqlMock'

/**
 * E2E del escáner de ventas (Chromium real) ejecutando la LÓGICA REAL:
 *   - processBarcode (controlador central) vía window.__scanner.scan
 *   - decodeBarcodeFromImage (ZXing real) vía window.__scanner.scanImage
 *   - keyboard-wedge real (listener de la página)
 * El backend /graphql se intercepta con fixtures controlados (sin BD/producción).
 */

const EAN_COCA = '7701234567897'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#cart-status')).toHaveAttribute('data-ready', 'true')
})

// ─────────────────────────────────────────────────────────────────────────────
// Escenario A: producto existente
// ─────────────────────────────────────────────────────────────────────────────
test('A: escanear producto existente lo agrega al carrito con precio y total', async ({ page }) => {
  await mockGraphql(page)

  const outcome = await page.evaluate(async (code) => {
    window.__scanner.reset()
    return await window.__scanner.scan(code)
  }, EAN_COCA)

  expect(outcome.status).toBe('FOUND')

  const cart = await page.evaluate(() => window.__scanner.getCart())
  const total = await page.evaluate(() => window.__scanner.getTotal())

  expect(cart).toHaveLength(1)
  expect(cart[0].pName).toBe(PRODUCT_FIXTURES[EAN_COCA].pName)
  expect(cart[0].ProQuantity).toBe(1)
  expect(cart[0].ProPrice).toBe(PRODUCT_FIXTURES[EAN_COCA].ProPrice)
  expect(total).toBe(PRODUCT_FIXTURES[EAN_COCA].ProPrice)
})

test('A2: repetir lectura (fuera de la ventana de dedup) incrementa cantidad y total', async ({ page }) => {
  await mockGraphql(page)

  const result = await page.evaluate(async (code) => {
    window.__scanner.reset()
    const first = await window.__scanner.scan(code)
    // Espera > ventana de dedup (800ms) para que sea una nueva intención.
    await new Promise((r) => setTimeout(r, 900))
    const second = await window.__scanner.scan(code)
    return { first: first.status, second: second.status, cart: window.__scanner.getCart(), total: window.__scanner.getTotal() }
  }, EAN_COCA)

  expect(result.first).toBe('FOUND')
  expect(result.second).toBe('FOUND')
  expect(result.cart).toHaveLength(1)
  expect(result.cart[0].ProQuantity).toBe(2)
  expect(result.total).toBe(PRODUCT_FIXTURES[EAN_COCA].ProPrice * 2)
})

test('A3: doble detección inmediata (dentro de la ventana) NO duplica', async ({ page }) => {
  await mockGraphql(page)

  const result = await page.evaluate(async (code) => {
    window.__scanner.reset()
    const a = await window.__scanner.scan(code)
    const b = await window.__scanner.scan(code) // inmediato: mismo evento
    return { a: a.status, b: b.status, cart: window.__scanner.getCart() }
  }, EAN_COCA)

  expect(result.a).toBe('FOUND')
  expect(result.b).toBe('DUPLICATE_EVENT')
  expect(result.cart).toHaveLength(1)
  expect(result.cart[0].ProQuantity).toBe(1)
})

// ─────────────────────────────────────────────────────────────────────────────
// Escenario B: producto inexistente y cancelación
// ─────────────────────────────────────────────────────────────────────────────
test('B: producto inexistente devuelve NOT_FOUND y no agrega nada', async ({ page }) => {
  await mockGraphql(page)

  const outcome = await page.evaluate(async (code) => {
    window.__scanner.reset()
    const o = await window.__scanner.scan(code)
    return { status: o.status, barcode: o.barcode, cart: window.__scanner.getCart() }
  }, UNKNOWN_BARCODE)

  expect(outcome.status).toBe('NOT_FOUND')
  expect(outcome.barcode).toBe(UNKNOWN_BARCODE)
  // "Seleccionar NO": no se crea ni agrega nada.
  expect(outcome.cart).toHaveLength(0)

  // El escáner sigue disponible: una lectura válida posterior funciona.
  const next = await page.evaluate(async (code) => {
    return await window.__scanner.scan(code)
  }, EAN_COCA)
  expect(next.status).toBe('FOUND')
})

// ─────────────────────────────────────────────────────────────────────────────
// Escenario C: producto inexistente y creación -> auto-add (AC-10)
// ─────────────────────────────────────────────────────────────────────────────
test('C: tras crear el producto, al re-escanear se agrega automáticamente (AC-10)', async ({ page }) => {
  // Primero el backend no conoce el código (NOT_FOUND).
  await mockGraphql(page)
  const notFound = await page.evaluate(async (code) => {
    window.__scanner.reset()
    return await window.__scanner.scan(code)
  }, UNKNOWN_BARCODE)
  expect(notFound.status).toBe('NOT_FOUND')

  // Simula la creación: el backend ahora SÍ lo conoce (el producto se persistió).
  await page.unroute('**/graphql')
  await page.route('**/graphql', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}')
    const code = String(body?.variables?.ProBarCode ?? '')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          findProductByBarcode: {
            success: true,
            status: 'FOUND',
            message: 'ok',
            barcode: code,
            data: { pId: 'p-nuevo', pName: 'Producto creado', ProPrice: 5000, ProBarCode: code }
          }
        }
      })
    })
  })

  // Re-escaneo: debe encontrarse y agregarse automáticamente al carrito.
  const created = await page.evaluate(async (code) => {
    await new Promise((r) => setTimeout(r, 900)) // fuera de ventana de dedup
    const o = await window.__scanner.scan(code)
    return { status: o.status, cart: window.__scanner.getCart(), total: window.__scanner.getTotal() }
  }, UNKNOWN_BARCODE)

  expect(created.status).toBe('FOUND')
  expect(created.cart).toHaveLength(1)
  expect(created.cart[0].pName).toBe('Producto creado')
  expect(created.total).toBe(5000)
})

// ─────────────────────────────────────────────────────────────────────────────
// Escenario D: imagen (ZXing real, no mock)
// ─────────────────────────────────────────────────────────────────────────────
test('D: leer EAN-13 desde una imagen real (ZXing) y agregar al carrito', async ({ page }) => {
  await mockGraphql(page)

  const imgPath = path.join(__dirname, '..', 'fixtures', 'images', 'ean13-coca.png')
  const base64 = readFileSync(imgPath).toString('base64')

  const result = await page.evaluate(async ({ b64 }) => {
    window.__scanner.reset()
    // Reconstruye un File real desde base64 en el navegador.
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const file = new File([bytes], 'ean13-coca.png', { type: 'image/png' })
    const { decoded, outcome } = await window.__scanner.scanImage(file, 'linear')
    return { decoded, outcome, cart: window.__scanner.getCart() }
  }, { b64: base64 })

  expect(result.decoded.success).toBe(true)
  expect(result.decoded.code).toBe(EAN_COCA)
  expect(result.outcome.status).toBe('FOUND')
  expect(result.cart).toHaveLength(1)
})

test('D2: imagen sin código informa error recuperable y no agrega nada', async ({ page }) => {
  await mockGraphql(page)
  const imgPath = path.join(__dirname, '..', 'fixtures', 'images', 'blank.png')
  const base64 = readFileSync(imgPath).toString('base64')

  const result = await page.evaluate(async ({ b64 }) => {
    window.__scanner.reset()
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const file = new File([bytes], 'blank.png', { type: 'image/png' })
    const { decoded, outcome } = await window.__scanner.scanImage(file, 'linear')
    return { decoded, outcome, cart: window.__scanner.getCart() }
  }, { b64: base64 })

  expect(result.decoded.success).toBe(false)
  expect(result.outcome).toBeNull()
  expect(result.cart).toHaveLength(0)
})

// ─────────────────────────────────────────────────────────────────────────────
// Escenario E: lector físico (keyboard-wedge)
// ─────────────────────────────────────────────────────────────────────────────
test('E: lector físico (teclas rápidas + Enter) procesa el código', async ({ page }) => {
  await mockGraphql(page)
  await page.evaluate(() => window.__scanner.reset())

  // Enfoca el body (no un input) y "teclea" el código como un lector físico.
  await page.locator('body').click()
  await page.keyboard.type(EAN_COCA, { delay: 5 })
  await page.keyboard.press('Enter')

  // El wedge llamó a window.__scanner.scan; esperamos su resolución.
  await page.waitForFunction(() => window.__scanner.getCart().length > 0, null, { timeout: 5000 })
  const cart = await page.evaluate(() => window.__scanner.getCart())
  expect(cart).toHaveLength(1)
  expect(cart[0].ProQuantity).toBe(1)
})

test('E2: teclear dentro de un input normal NO dispara el escáner', async ({ page }) => {
  await mockGraphql(page)
  await page.evaluate(() => window.__scanner.reset())

  await page.locator('#normal-input').click()
  await page.keyboard.type(EAN_COCA, { delay: 5 })
  await page.keyboard.press('Enter')

  // Breve espera para descartar procesamiento tardío.
  await page.waitForTimeout(300)
  const cart = await page.evaluate(() => window.__scanner.getCart())
  expect(cart).toHaveLength(0)
  // El texto quedó en el input, como escritura normal.
  await expect(page.locator('#normal-input')).toHaveValue(EAN_COCA)
})

// ─────────────────────────────────────────────────────────────────────────────
// Escenario F: recuperación ante errores
// ─────────────────────────────────────────────────────────────────────────────
test('F1: código inválido devuelve INVALID y no agrega nada', async ({ page }) => {
  await mockGraphql(page)
  const outcome = await page.evaluate(async () => {
    window.__scanner.reset()
    const o = await window.__scanner.scan('   ')
    return { status: o.status, cart: window.__scanner.getCart() }
  })
  expect(outcome.status).toBe('INVALID')
  expect(outcome.cart).toHaveLength(0)
})

test('F2: error de backend devuelve ERROR y la app se recupera', async ({ page }) => {
  await mockGraphql(page, { forceServerError: true })

  const errored = await page.evaluate(async (code) => {
    window.__scanner.reset()
    const o = await window.__scanner.scan(code)
    return { status: o.status, cart: window.__scanner.getCart() }
  }, EAN_COCA)
  expect(errored.status).toBe('ERROR')
  expect(errored.cart).toHaveLength(0)

  // Recuperación: el backend vuelve a responder bien y una nueva lectura funciona.
  await page.unroute('**/graphql')
  await mockGraphql(page)
  const recovered = await page.evaluate(async (code) => {
    await new Promise((r) => setTimeout(r, 900))
    return await window.__scanner.scan(code)
  }, EAN_COCA)
  expect(recovered.status).toBe('FOUND')
})
