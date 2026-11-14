import { formatText, isGrandTotal } from './order-format'

describe('OrderPage helpers', () => {
  it('resuelve nombres vacíos sin imprimir null', () => {
    expect(formatText('  Andrea ')).toBe('Andrea')
    expect(formatText(null)).toBe('No registrado')
  })

  it('identifica el total final sin confundirlo con subtotal', () => {
    expect(isGrandTotal('TOTAL A PAGAR')).toBe(true)
    expect(isGrandTotal('Subtotal')).toBe(false)
    expect(isGrandTotal('Total productos')).toBe(false)
  })
})
