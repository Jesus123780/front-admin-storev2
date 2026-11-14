'use client'

import { memo } from 'react'

import type { OrderItemCart } from './order-item.types'
import { finiteNumber } from './order-item.utils'
import OrderItemRow from './order-item-row'
import styles from './order-items.module.css'

const OrderItems = memo(function OrderItems({ items }: { items?: Array<OrderItemCart | null> | null }) {
  const rows = (items ?? []).filter((item): item is OrderItemCart => item != null)
  const counts = rows.map(item => finiteNumber(item.cantProducts))
  const total = counts.some(value => value === null) ? null : counts.reduce<number>((sum, value) => sum + (value ?? 0), 0)
  return (
    <section className={styles.container} aria-label='Productos de la orden'>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title}>Productos</h2>
          <p className={styles.subtitle}>Detalle de artículos de la orden</p>
        </div>
        <span className={styles.counter}>{total === null ? `${rows.length} artículos` : `${total} ${total === 1 ? 'unidad' : 'unidades'}`}</span>
      </header>
      {rows.length ? (
        <ul className={styles.list}>
          {rows.map(item => <li className={styles.listItem} key={item.shoppingCartId}><OrderItemRow item={item} /></li>)}
        </ul>
      ) : <p className={styles.empty}>No hay productos registrados en esta orden.</p>}
    </section>
  )
})

export default OrderItems
