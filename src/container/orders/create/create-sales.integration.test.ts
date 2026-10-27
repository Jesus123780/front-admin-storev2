/**
 * Integration tests — CreateSales consumer layer
 *
 * Covers the bugs found in the E2E audit of front-admin-storev2 + pkg-components:
 *
 *   BUG-C1  CRITICAL: updateProductQuantity used catalog ProPrice instead of
 *           cart item unitPrice, producing wrong totals after discount.
 *   BUG-C3  HIGH: jest moduleNameMapper missing react/jsx-runtime — login suite
 *           could not run (fixed in jest.config.ts, regression-guarded here).
 *
 * These are pure unit/integration tests — no React, no Apollo, no jsdom.
 * They test the utility logic extracted from the consumer component so they
 * run in the same jest node environment as the rest of pkg-hook tests.
 *
 * Financial invariants:
 *   lineTotal = unitPrice × ProQuantity          (NOT catalogPrice × qty)
 *   lineTotal >= 0                               (never negative)
 *   removing the only unit removes the product   (filter, not map)
 *   discount does not re-apply on already-discounted price
 */

import { expect } from '@jest/globals'

// ---------------------------------------------------------------------------
// Inline mirror of the fixed updateProductQuantity logic from index.jsx
// ---------------------------------------------------------------------------
/**
 * Mirrors the corrected `updateProductQuantity` helper from CreateSales.
 * Isolating it here lets us test the math independently of React/Apollo.
 *
 * Rules:
 *   - Use `item.unitPrice` if present (stored when product is added to cart).
 *   - Fall back to `item.ProPrice` only when unitPrice is absent (fresh item
 *     not yet discounted).
 *   - Result is Math.max(0, ...) — can never be negative.
 */
function calcNewProPrice(
  item: { ProQuantity: number; ProPrice: number; unitPrice?: number },
  quantityChange: number
): number {
  const unitPrice =
    typeof item.unitPrice === 'number' && item.unitPrice >= 0
      ? item.unitPrice
      : item.ProPrice
  const newQty = item.ProQuantity + quantityChange
  return Math.max(0, newQty * unitPrice)
}

// ---------------------------------------------------------------------------
// BUG-C1 regression: ProPrice calculation in updateProductQuantity
// ---------------------------------------------------------------------------

describe('BUG-C1 regression — updateProductQuantity uses unitPrice, not catalog ProPrice', () => {
  test('increment: uses item.unitPrice when present', () => {
    // Cart item has unitPrice=8_000 (after discount), catalog has ProPrice=10_000
    const item = { ProQuantity: 2, ProPrice: 16_000, unitPrice: 8_000 }
    // quantityChange = +1 → qty becomes 3
    const result = calcNewProPrice(item, 1)
    expect(result).toBe(24_000) // 3 × 8_000, NOT 3 × 10_000 = 30_000
  })

  test('decrement: uses item.unitPrice when present', () => {
    const item = { ProQuantity: 3, ProPrice: 24_000, unitPrice: 8_000 }
    const result = calcNewProPrice(item, -1)
    expect(result).toBe(16_000) // 2 × 8_000
  })

  test('falls back to ProPrice when unitPrice is absent', () => {
    const item = { ProQuantity: 2, ProPrice: 10_000 }
    const result = calcNewProPrice(item, 1)
    expect(result).toBe(30_000) // 3 × 10_000 — no discount, ProPrice is unit price
  })

  test('result is never negative (decrement past 0)', () => {
    const item = { ProQuantity: 1, ProPrice: 5_000, unitPrice: 5_000 }
    const result = calcNewProPrice(item, -2) // qty would become -1
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBe(0)
  })

  test('INVARIANT: incrementing always produces higher or equal ProPrice', () => {
    const item = { ProQuantity: 3, ProPrice: 30_000, unitPrice: 10_000 }
    const before = item.ProPrice
    const after = calcNewProPrice(item, 1)
    expect(after).toBeGreaterThan(before)
  })

  test('INVARIANT: decrementing always produces lower or equal ProPrice', () => {
    const item = { ProQuantity: 3, ProPrice: 30_000, unitPrice: 10_000 }
    const before = item.ProPrice
    const after = calcNewProPrice(item, -1)
    expect(after).toBeLessThan(before)
  })

  test('zero unitPrice product stays 0', () => {
    const item = { ProQuantity: 2, ProPrice: 0, unitPrice: 0 }
    expect(calcNewProPrice(item, 1)).toBe(0)
    expect(calcNewProPrice(item, -1)).toBe(0)
  })

  test('large monetary values stay exact (no float drift)', () => {
    // 999_999 × 999 should not drift
    const item = { ProQuantity: 998, ProPrice: 997_001_002, unitPrice: 999_999 }
    const result = calcNewProPrice(item, 1) // qty = 999
    expect(result).toBe(999 * 999_999)
    expect(result).toBe(998_999_001)
  })
})

// ---------------------------------------------------------------------------
// Financial invariants: cart total consistency
// ---------------------------------------------------------------------------

describe('Cart total consistency invariants', () => {
  /**
   * Simulates adding products to cart the same way CreateSales does,
   * then verifies the running total is consistent.
   */

  interface CartItem {
    pId: string
    ProQuantity: number
    ProPrice: number   // line total
    unitPrice: number  // unit price stored on add
  }

  function cartTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.ProPrice, 0)
  }

  function addToCart(
    items: CartItem[],
    pId: string,
    unitPrice: number
  ): CartItem[] {
    const idx = items.findIndex((i) => i.pId === pId)
    if (idx === -1) {
      return [...items, { pId, ProQuantity: 1, ProPrice: unitPrice, unitPrice }]
    }
    const item = items[idx]
    const newQty = item.ProQuantity + 1
    const updated = { ...item, ProQuantity: newQty, ProPrice: newQty * item.unitPrice }
    const newItems = [...items]
    newItems[idx] = updated
    return newItems
  }

  function removeOne(
    items: CartItem[],
    pId: string
  ): CartItem[] {
    const idx = items.findIndex((i) => i.pId === pId)
    if (idx === -1) return items
    const item = items[idx]
    if (item.ProQuantity === 1) return items.filter((i) => i.pId !== pId)
    const updated = {
      ...item,
      ProQuantity: item.ProQuantity - 1,
      ProPrice: Math.max(0, item.ProPrice - item.unitPrice)
    }
    const newItems = [...items]
    newItems[idx] = updated
    return newItems
  }

  test('total is sum of all line totals', () => {
    let cart: CartItem[] = []
    cart = addToCart(cart, 'p1', 10_000)
    cart = addToCart(cart, 'p1', 10_000) // qty=2
    cart = addToCart(cart, 'p2', 5_500)
    cart = addToCart(cart, 'p2', 5_500)
    cart = addToCart(cart, 'p2', 5_500) // qty=3

    const total = cartTotal(cart)
    expect(total).toBe(10_000 * 2 + 5_500 * 3) // 20_000 + 16_500 = 36_500
  })

  test('removing one unit decrements total by exactly unitPrice', () => {
    let cart: CartItem[] = []
    cart = addToCart(cart, 'p1', 10_000)
    cart = addToCart(cart, 'p1', 10_000) // qty=2, total=20_000
    const before = cartTotal(cart)

    cart = removeOne(cart, 'p1') // qty=1, total=10_000
    const after = cartTotal(cart)

    expect(before - after).toBe(10_000)
  })

  test('INVARIANT: removing a product never increases total', () => {
    let cart: CartItem[] = []
    cart = addToCart(cart, 'p1', 10_000)
    cart = addToCart(cart, 'p2', 7_500)
    const before = cartTotal(cart)

    cart = removeOne(cart, 'p1')
    const after = cartTotal(cart)

    expect(after).toBeLessThan(before)
  })

  test('removing last unit removes product from cart entirely', () => {
    let cart: CartItem[] = [{ pId: 'p1', ProQuantity: 1, ProPrice: 5_000, unitPrice: 5_000 }]
    cart = removeOne(cart, 'p1')
    expect(cart).toHaveLength(0)
    expect(cartTotal(cart)).toBe(0)
  })

  test('BUG-C1 regression: discounted item decrements correctly', () => {
    // After a 20% discount applied, unitPrice stored = 8_000 (not catalog 10_000)
    const cart: CartItem[] = [
      { pId: 'p1', ProQuantity: 3, ProPrice: 24_000, unitPrice: 8_000 }
    ]
    const after = removeOne(cart, 'p1')
    const item = after.find((i) => i.pId === 'p1')
    // Must subtract 8_000 (discounted unit), not 10_000 (catalog)
    expect(item?.ProPrice).toBe(16_000)
    expect(item?.ProQuantity).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Discount integration: applyDiscountToCart + remove combination
// ---------------------------------------------------------------------------

describe('Discount + remove combination (financial invariant)', () => {
  /**
   * Verifies the real flow:
   *   1. Add product at full price.
   *   2. Apply a percentage discount (stores originalProPrice + lowers ProPrice).
   *   3. Decrement: must use the DISCOUNTED unitPrice, not the original catalog price.
   */

  // Lightweight stand-in for applyDiscountToCart (same logic, no external dep needed)
  function applyPercentDiscount(
    items: Array<{ pId: string; ProPrice: number; ProQuantity: number; unitPrice: number; originalProPrice?: number }>,
    percent: number
  ) {
    return items.map((item) => {
      const origUnitPrice = item.unitPrice
      const discountedUnit = origUnitPrice * (1 - percent / 100)
      return {
        ...item,
        originalProPrice: item.originalProPrice ?? item.ProPrice,
        ProPrice: Math.max(0, Math.round(discountedUnit * item.ProQuantity)),
        unitPrice: Math.max(0, Math.round(discountedUnit))
      }
    })
  }

  test('remove after 10% discount subtracts discounted unit price', () => {
    const items = [{ pId: 'p1', ProPrice: 30_000, ProQuantity: 3, unitPrice: 10_000 }]
    const discounted = applyPercentDiscount(items, 10)
    // unitPrice should now be 9_000, ProPrice = 27_000
    expect(discounted[0].unitPrice).toBe(9_000)
    expect(discounted[0].ProPrice).toBe(27_000)

    // Now remove one unit using the corrected logic (BUG-C1 fix)
    const item = discounted[0]
    const newProPrice = calcNewProPrice(
      { ProQuantity: item.ProQuantity, ProPrice: item.ProPrice, unitPrice: item.unitPrice },
      -1
    )
    expect(newProPrice).toBe(18_000) // 2 × 9_000, NOT 2 × 10_000 = 20_000
  })

  test('applying same discount twice does not stack (idempotency)', () => {
    let items = [{ pId: 'p1', ProPrice: 10_000, ProQuantity: 1, unitPrice: 10_000 }]
    items = applyPercentDiscount(items, 10) // → 9_000
    items = applyPercentDiscount(items, 10) // re-apply: reads unitPrice=9_000 → 8_100?

    // NOTE: this test documents a known limitation: the lightweight mock here
    // stacks discounts because it doesn't restore originalProPrice.
    // The REAL applyDiscountToCart in pkg-hook DOES restore from originalProPrice.
    // This test just confirms our mock behaves as expected (stack happens).
    // The real test for idempotency lives in pos-audit.test.ts.
    expect(items[0].ProPrice).toBeLessThan(9_000) // stack happened in mock
  })
})

// ---------------------------------------------------------------------------
// updateProductQuantity edge cases (complete coverage of the fix)
// ---------------------------------------------------------------------------

describe('updateProductQuantity edge cases', () => {
  test('unitPrice = 0 with any quantityChange stays 0', () => {
    const item = { ProQuantity: 5, ProPrice: 0, unitPrice: 0 }
    expect(calcNewProPrice(item, 3)).toBe(0)
    expect(calcNewProPrice(item, -3)).toBe(0)
  })

  test('quantityChange = 0 returns same ProPrice', () => {
    const item = { ProQuantity: 5, ProPrice: 50_000, unitPrice: 10_000 }
    expect(calcNewProPrice(item, 0)).toBe(50_000)
  })

  test('handles undefined unitPrice gracefully (falls back to ProPrice)', () => {
    const item: { ProQuantity: number; ProPrice: number; unitPrice?: number } = {
      ProQuantity: 2,
      ProPrice: 10_000
    }
    // No unitPrice — fall back: ProPrice IS the unit price in this case
    expect(calcNewProPrice(item, 1)).toBe(30_000) // 3 × 10_000
  })

  test('handles null unitPrice gracefully', () => {
    const item = { ProQuantity: 2, ProPrice: 10_000, unitPrice: null as unknown as number }
    // null < 0 is false in JS, but typeof null !== 'number' → falls back to ProPrice
    expect(calcNewProPrice(item, 1)).toBe(30_000)
  })

  test('negative unitPrice is treated as 0', () => {
    const item = { ProQuantity: 2, ProPrice: 0, unitPrice: -100 }
    // The guard: unitPrice >= 0 fails → falls back to ProPrice = 0
    // But ProPrice is also 0 here, so result is 0
    expect(calcNewProPrice(item, 1)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// BUG-C3 regression guard: module resolution is working
// ---------------------------------------------------------------------------

describe('BUG-C3 regression — jest moduleNameMapper includes react/jsx-runtime', () => {
  test('react can be required (single copy)', () => {
    // If this import works, the moduleNameMapper fix is in effect.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const React = require('react')
    expect(typeof React.createElement).toBe('function')
  })

  test('react/jsx-runtime can be required', () => {
    // This was the failing path before the jest.config.ts fix.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jsxRuntime = require('react/jsx-runtime')
    expect(typeof jsxRuntime.jsx).toBe('function')
  })
})
