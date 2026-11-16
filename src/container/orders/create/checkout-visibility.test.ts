import { getAsideVisibility, shouldOpenRecoveryAside, resolveAsideRequest } from './checkout-visibility'

const normal = { show: true, print: false, saleSuccess: false }

describe('checkout visibility', () => {
  it('hides the lateral panel immediately after success', () => {
    expect(getAsideVisibility({ ...normal, openAside: true, saleSuccess: true })).toBe(false)
  })
  it('hides the panel during preview or when the parent is closed', () => {
    expect(getAsideVisibility({ ...normal, openAside: true, print: true })).toBe(false)
    expect(getAsideVisibility({ ...normal, openAside: true, show: false })).toBe(false)
  })
  it('does not reopen for the marker of a normal in-flight payment', () => {
    expect(shouldOpenRecoveryAside({ ...normal, pendingRecovery: true, busy: true })).toBe(false)
  })
  it('offers recovery for an unresolved attempt once processing finishes', () => {
    expect(shouldOpenRecoveryAside({ ...normal, pendingRecovery: true, busy: false })).toBe(true)
  })
  it('does not open recovery over a preview or success, even with stale marker state', () => {
    expect(shouldOpenRecoveryAside({ ...normal, pendingRecovery: true, busy: false, print: true })).toBe(false)
    expect(shouldOpenRecoveryAside({ ...normal, pendingRecovery: true, busy: false, saleSuccess: true })).toBe(false)
  })
  it('closes idempotently, preserves blocked recovery and accepts legacy click events', () => {
    expect(resolveAsideRequest(true, false, false, false)).toBe(false)
    expect(resolveAsideRequest(false, false, false, false)).toBe(false)
    expect(resolveAsideRequest(true, false, false, true)).toBe(true)
    expect(resolveAsideRequest(false, {}, false, false)).toBe(true)
    expect(resolveAsideRequest(false, undefined, true, false)).toBe(false)
  })
})
