import { getOrderStatusMeta } from './orderStatus'

describe('getOrderStatusMeta', () => {
  it('maps completed (4) to a success tone', () => {
    expect(getOrderStatusMeta(4)).toEqual({ label: 'Concluido', tone: 'success' })
  })
  it('maps rejected (5) to a danger tone', () => {
    expect(getOrderStatusMeta(5)).toEqual({ label: 'Rechazado', tone: 'danger' })
  })
  it('maps processing (2) to a processing tone', () => {
    expect(getOrderStatusMeta(2).tone).toBe('processing')
  })
  it('does not paint every state as success', () => {
    const tones = [0, 1, 2, 3, 4, 5].map((s) => getOrderStatusMeta(s).tone)
    const successCount = tones.filter((t) => t === 'success').length
    expect(successCount).toBe(1)
  })
  it('falls back to a neutral unknown descriptor for unknown states', () => {
    expect(getOrderStatusMeta(99)).toEqual({ label: 'Desconocido', tone: 'neutral' })
  })
})
