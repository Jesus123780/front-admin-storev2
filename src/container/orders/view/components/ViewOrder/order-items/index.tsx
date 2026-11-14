'use client'

import React from 'react'
import type { ShoppingCart } from '../../types/order'
import OrderItemRow from './order-item-row'
import styles from './order-items.module.css'

type Props = { items?: ShoppingCart[] | null }

const OrderItems: React.FC<Props> = ({ items }) => {
  const headingId = React.useId()
  const list = items ?? []
  const totalUnits = list.reduce((count, item) => count + (Number.isFinite(Number(item.cantProducts)) ? Math.max(0, Number(item.cantProducts)) : 0), 0)
  return (
    <section className={styles.container} aria-labelledby={headingId}>
      <header className={styles.header}>
        <div>
          <h2 id={headingId} className={styles.title}>Productos</h2>
          <p className={styles.subtitle}>Detalle de artículos de la orden</p>
        </div>
        <span className={styles.counter} aria-label={`${totalUnits} unidades en ${list.length} líneas`}>
          {totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}
        </span>
      </header>
      {list.length === 0 ? (
        <div className={styles.empty} role="status">No hay productos registrados en esta orden.</div>
      ) : (
        <ul className={styles.list}>
          {list.map((item, index) => (
            <li key={item.shoppingCartId || `${item.pId}-${index}`} className={styles.listItem}>
              <OrderItemRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default React.memo(OrderItems)
