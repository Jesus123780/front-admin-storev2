/* eslint-disable */
/**
 * Servidor del harness E2E:
 *  1. Bundlea la lógica real (scannerEntry.ts -> scanner.bundle.js) con esbuild
 *     para el navegador.
 *  2. Sirve el directorio harness en un puerto aislado.
 *
 * No toca producción ni base de datos: el "backend" /graphql lo intercepta
 * Playwright con fixtures.
 */
const esbuild = require('esbuild')
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = Number(process.env.E2E_PORT || 3100)
const DIR = __dirname

async function build() {
  await esbuild.build({
    entryPoints: [path.join(DIR, 'scannerEntry.ts')],
    bundle: true,
    outfile: path.join(DIR, 'scanner.bundle.js'),
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    logLevel: 'error',
    // ZXing y deps son puro JS de navegador; sharp/qrcode NO se incluyen (solo
    // se usan en tests de node, no en el harness de navegador).
    define: { 'process.env.NODE_ENV': '"production"' }
  })
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
}

build()
  .then(() => {
    const server = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0]
      const file = urlPath === '/' ? '/index.html' : urlPath
      const full = path.join(DIR, file)
      if (!full.startsWith(DIR) || !fs.existsSync(full)) {
        res.statusCode = 404
        res.end('not found')
        return
      }
      res.setHeader('content-type', MIME[path.extname(full)] || 'application/octet-stream')
      fs.createReadStream(full).pipe(res)
    })
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[e2e-harness] listening on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[e2e-harness] build failed', err)
    process.exit(1)
  })
