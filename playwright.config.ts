import { defineConfig, devices } from '@playwright/test'

/**
 * Configuración E2E del escáner de ventas.
 *
 * - Entorno AISLADO: corre contra el build de producción servido en un puerto
 *   dedicado (3100), nunca contra producción. Todas las llamadas GraphQL se
 *   interceptan con `page.route` y fixtures controlados (ver e2e/fixtures),
 *   así las pruebas NO tocan ninguna base de datos real y son repetibles.
 * - Los escenarios A–F viven en `e2e/scanner/`.
 *
 * Requisitos para ejecutar:
 *   1) npm run next:build        (compila el front)
 *   2) npx playwright install chromium   (si no están los navegadores)
 *   3) npx playwright test -c playwright.config.ts
 */
const PORT = Number(process.env.E2E_PORT ?? 3100)

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // Permiso de cámara concedido por defecto; los tests que prueban "denegado"
    // lo revocan explícitamente.
    permissions: ['camera']
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    // Harness aislado: bundlea la lógica REAL de escaneo (processBarcode +
    // decodeBarcodeFromImage con ZXing) y la sirve en un puerto dedicado. El
    // backend /graphql se intercepta con fixtures en cada spec. No toca
    // Next/Electron/Postgres ni datos de producción.
    command: `node e2e/harness/serve.js`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
})
