/** Resource preparation for a mounted receipt. Deadline is recovery only, not a fixed delay. */
export async function prepareReceiptForPrint(root: HTMLElement, signal: AbortSignal, deadlineMs = 8000): Promise<'ready' | 'incomplete' | 'aborted'> {
  if (signal.aborted) return 'aborted'
  const doc = root.ownerDocument
  const images = Array.from(root.querySelectorAll('img'))
  const resources = Promise.allSettled([
    doc.fonts?.ready ?? Promise.resolve(),
    ...images.map(img => typeof img.decode === 'function' ? img.decode() : img.complete ? (img.naturalWidth ? Promise.resolve() : Promise.reject(new Error('Image unavailable'))) : new Promise<void>((resolve, reject) => {
      const clean = () => { img.removeEventListener('load', loaded); img.removeEventListener('error', failed); signal.removeEventListener('abort', aborted) }
      const loaded = () => { clean(); resolve() }
      const failed = () => { clean(); reject(new Error('Image unavailable')) }
      const aborted = () => { clean(); resolve() }
      img.addEventListener('load', loaded, { once: true }); img.addEventListener('error', failed, { once: true }); signal.addEventListener('abort', aborted, { once: true })
      if (img.complete) { if (img.naturalWidth) loaded(); else failed() }
    }))
  ]).then(results => results.some(result => result.status === 'rejected') ? 'incomplete' as const : 'ready' as const)
  let timer: ReturnType<typeof setTimeout> | undefined
  let onAbort: (() => void) | undefined
  try {
    return await Promise.race([
      resources,
      new Promise<'incomplete'>(resolve => { timer = setTimeout(() => resolve('incomplete'), deadlineMs) }),
      new Promise<'aborted'>(resolve => { onAbort = () => resolve('aborted'); signal.addEventListener('abort', onAbort, { once: true }); if (signal.aborted) onAbort() })
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
    if (onAbort) signal.removeEventListener('abort', onAbort)
  }
}
