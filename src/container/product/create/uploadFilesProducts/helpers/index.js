/**
 * Generates a random barcode number with a specified length.
 * @param {number} length - The length of the barcode (default: 12 for EAN-13).
 * @returns {string} A generated barcode number.
 */
export function generateBarcode(length = 12) {
  let barcode = ''
  for (let i = 0; i < length; i++) {
    barcode += Math.floor(Math.random() * 10) // Generate random digit (0-9)
  }
  return barcode
}

export const excelData = [
  {
    NOMBRE: 'COCA-COLA',
    PRECIO_AL_PUBLICO: 1500.67,
    VALOR_DE_COMPRA: 1000.11,
    CANTIDAD: 5,
    DESCRIPCION: 'descripción del producto',
    DESCUENTO: 10,
    CATEGORIA: 'BEBIDAS',
    CODIGO_DE_BARRAS: '345669764567',
    ['IMPUESTO (%)']: 9
  },
  {
    NOMBRE: 'COCA-COLA',
    PRECIO_AL_PUBLICO: 1500.99,
    VALOR_DE_COMPRA: 1000.60,
    CANTIDAD: 5,
    DESCRIPCION: 'descripción del producto',
    DESCUENTO: 10,
    CATEGORIA: 'BEBIDAS',
    CODIGO_DE_BARRAS: '345669764567',
    ['IMPUESTO (%)']: 9
  },
  {
    NOMBRE: 'COCA-COLA',
    PRECIO_AL_PUBLICO: 1500.00,
    VALOR_DE_COMPRA: 1000.00,
    CANTIDAD: 5,
    DESCRIPCION: 'descripción del producto',
    DESCUENTO: 10,
    CATEGORIA: 'BEBIDAS',
    CODIGO_DE_BARRAS: '345669764567',
    ['IMPUESTO (%)']: 9
  },
  {
    NOMBRE: 'COCA-COLA',
    PRECIO_AL_PUBLICO: 1500.00,
    VALOR_DE_COMPRA: 1000.00,
    CANTIDAD: 5,
    DESCRIPCION: 'descripción del producto',
    DESCUENTO: 10,
    CATEGORIA: 'BEBIDAS',
    CODIGO_DE_BARRAS: '345669764567',
    ['IMPUESTO (%)']: 9
  },
  {
    NOMBRE: 'COCA-COLA',
    PRECIO_AL_PUBLICO: 1500.10,
    VALOR_DE_COMPRA: 1000.01,
    CANTIDAD: 5,
    DESCRIPCION: 'descripción del producto',
    DESCUENTO: 10,
    CATEGORIA: 'BEBIDAS',
    CODIGO_DE_BARRAS: '345669764567',
    ['IMPUESTO (%)']: 9
  }
]