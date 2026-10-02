'use client'

import { useEffect, useState } from 'react'

/**
 * Automatic modal stacking without hand-tuned z-index values.
 *
 * Problem: CreateSales renders several sibling AwesomeModal instances that can
 * be visible at the same time (product list, sub-items, delivery cost, invoice
 * preview, success summary). Assigning a fixed z-index per modal was fragile:
 * the numbers had to be kept in sync by hand, modals overlapped incorrectly and
 * it was not maintainable.
 *
 * Solution: a tiny LIFO stack manager. A modal registers itself when it opens
 * and unregisters when it closes. Its z-index is derived from its position in
 * the stack, so the most recently opened modal always sits on top — regardless
 * of DOM order and without any magic numbers spread across the codebase.
 *
 * Usage:
 *   const zIndex = useModalLayer(show)
 *   <AwesomeModal show={show} zIndex={zIndex} ... />
 */

/** Base layer: at the design-system modal level (--z-index-modal: 1000000000)
 *  and safely below the toast layer (--z-index-toast: 2000000000). All values
 *  stay well inside the 32-bit integer range browsers use to clamp z-index. */
const BASE_LAYER = 1000000000

/** Step between consecutive stacked modals. Kept small; the stack depth in a
 *  sale flow is a handful of modals at most. */
const LAYER_STEP = 10

/**
 * Ordered list of currently open modal tokens. Position in this array (not a
 * magic constant) determines the stacking order: last opened, top-most.
 */
let openStack: symbol[] = []

/** Subscribers notified whenever the stack changes so each hook recomputes. */
const listeners = new Set<() => void>()

const notify = (): void => {
  listeners.forEach((listener) => { return listener() })
}

const pushLayer = (token: symbol): void => {
  if (!openStack.includes(token)) {
    openStack.push(token)
    notify()
  }
}

const removeLayer = (token: symbol): void => {
  const next = openStack.filter((item) => { return item !== token })
  if (next.length !== openStack.length) {
    openStack = next
    notify()
  }
}

const layerOf = (token: symbol): number | undefined => {
  const index = openStack.indexOf(token)
  return index === -1 ? undefined : BASE_LAYER + index * LAYER_STEP
}

/**
 * Registers a modal in the global stack while it is open and returns the
 * z-index it should use. Returns `undefined` when the modal is closed so the
 * caller can omit z-index entirely.
 *
 * @param isOpen - Whether the modal is currently visible.
 * @returns The computed z-index while open, otherwise `undefined`.
 */
export const useModalLayer = (isOpen: boolean): number | undefined => {
  const [token] = useState<symbol>(() => { return Symbol('modal-layer') })
  const [, forceRender] = useState<number>(0)

  useEffect(() => {
    const listener = (): void => { return forceRender((tick) => { return tick + 1 }) }
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  useEffect(() => {
    if (isOpen) {
      pushLayer(token)
    } else {
      removeLayer(token)
    }
    return () => { removeLayer(token) }
  }, [isOpen, token])

  return layerOf(token)
}
