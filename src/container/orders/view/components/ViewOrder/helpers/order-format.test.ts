import { formatCOP, formatOrderDate, formatText, isGrandTotal } from './order-format'

describe('OrderPage helpers', () => {
  it('muestra moneda COP y respeta el cero', () => {
    expect(formatCOP(0)).toContain('0')
    expect(formatCOP(12450)).toContain('12.450')
    expect(formatCOP(Number.NaN)).toBe('—')
  })

  it('resuelve nombres vacíos sin imprimir null', () => {
    expect(formatText('  Andrea ')).toBe('Andrea')
    expect(formatText(null)).toBe('No registrado')
  })

  it('identifica el total final sin confundirlo con subtotal', () => {
    expect(isGrandTotal('TOTAL A PAGAR')).toBe(true)
    expect(isGrandTotal('Subtotal')).toBe(false)
    expect(isGrandTotal('Total productos')).toBe(false)
  })

  it('admite fechas vacías y fechas ISO', () => {
    expect(formatOrderDate(null)).toBe('No registrada')
    expect(formatOrderDate('2026-11-13T12:00:00Z')).toContain('2026')
  })
})
