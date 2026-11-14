'use client'

import { memo } from 'react'
import { numberFormat } from 'pkg-components'

import type { OrderItemCart } from './order-item.types'
import { getItemAmounts, recordedExtras, recordedOptions, visibleSubOptions } from './order-item.utils'
import { OrderItemExtras } from './order-item-extras'
import { OrderItemOptions } from './order-item-options'
import styles from './order-item-details.module.css'

export const OrderItemDetails = memo(function OrderItemDetails({ item }: { item: OrderItemCart }) {
  const extras = recordedExtras(item.products)
  const options = recordedOptions(item.products)
  const hasOptions = options.some(option => visibleSubOptions(option).length > 0)
  const comments = item.comments?.trim()
  const { subtotal } = getItemAmounts(item)

  if (!extras.length && !hasOptions && !comments) return null

  return (
    <div className={styles.details}>
      <OrderItemExtras extras={extras} />
      <OrderItemOptions options={options} />
      {comments && (
        <section className={styles.section} aria-label='Nota del artículo'>
          <h4 className={styles.title}>Nota del artículo</h4>
          <p className={styles.comment}>{comments}</p>
        </section>
      )}
      {extras.length > 0 && (
        <div className={styles.subtotal}>
          <span>Subtotal del artículo</span>
          <strong>{subtotal === null ? '—' : numberFormat(subtotal)}</strong>
        </div>
      )}
    </div>
  )
})
