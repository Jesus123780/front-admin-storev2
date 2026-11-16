/** Presentation-only checkout visibility. No payment or storage mutation. */
export interface AsideVisibility {
  openAside: boolean
  show: boolean
  print: boolean
  saleSuccess: boolean
}
export function getAsideVisibility(state: AsideVisibility): boolean {
  return state.show && state.openAside && !state.print && !state.saleSuccess
}
export function shouldOpenRecoveryAside(state: Omit<AsideVisibility, 'openAside'> & { pendingRecovery: boolean; busy: boolean }): boolean {
  return state.pendingRecovery && state.show && !state.print && !state.saleSuccess && !state.busy
}
export function resolveAsideRequest(previous: boolean, requested: unknown, blocked: boolean, closeLocked: boolean): boolean {
  if (blocked) {return false}
  const next = typeof requested === 'boolean' ? requested : !previous
  if (!next && previous && closeLocked) {return previous}
  return next
}
