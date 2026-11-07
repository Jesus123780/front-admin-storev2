/* eslint-disable */
/**
 * Genera imágenes fixture REALES para los E2E (no mocks): un PNG con un EAN-13
 * válido y un PNG sin ningún código. Usa jsbarcode+sharp (vía jsdom) y se
 * ejecuta una sola vez antes de los specs.
 */
const fs = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')
const JsBarcode = require('jsbarcode')
const sharp = require('sharp')

const OUT = path.join(__dirname, 'images')
fs.mkdirSync(OUT, { recursive: true })

async function makeEan13(value) {
  const dom = new JSDOM('<!DOCTYPE html><body></body>')
  const document = dom.window.document
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, value, {
    format: 'EAN13',
    width: 3,
    height: 140,
    margin: 20,
    displayValue: false,
    background: '#ffffff',
    lineColor: '#000000',
    xmlDocument: document
  })
  let svgString = new dom.window.XMLSerializer().serializeToString(svg)
  svgString = svgString.replace(/<svg([^>]*)>/, (_m, attrs) => {
    const cleaned = attrs.replace(/\s*xmlns(:xlink)?="[^"]*"/g, '')
    return `<svg xmlns="http://www.w3.org/2000/svg"${cleaned}>`
  })
  return sharp(Buffer.from(svgString)).png().toBuffer()
}

async function main() {
  // EAN-13 válido presente en los fixtures de GraphQL (Coca-Cola).
  const ean = await makeEan13('7701234567897')
  fs.writeFileSync(path.join(OUT, 'ean13-coca.png'), ean)

  // Imagen en blanco (sin código).
  const blank = await sharp({
    create: { width: 300, height: 150, channels: 3, background: '#ffffff' }
  })
    .png()
    .toBuffer()
  fs.writeFileSync(path.join(OUT, 'blank.png'), blank)

  // eslint-disable-next-line no-console
  console.log('[e2e] fixtures de imagen generados en', OUT)
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
