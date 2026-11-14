// components/order-items/index.tsx
'use client'
import React from 'react'

import type { ShoppingCart } from '../../types/order'
import OrderItemRow from './order-item-row'
import styles from './order-items.module.css'

type Props = {
  items: ShoppingCart[]
}

const OrderItems: React.FC<Props> = ({ items = [] }) => {
  // Group by product name categories if needed. For this mock, products already have names like Treatment, Component used, Medicine
  const grouped = items?.reduce<Record<string, ShoppingCart[]>>((acc, cur) => {
    const key = cur.products.pName || 'Others'
    acc[key] = acc[key] || []
    acc[key].push(cur)
    return acc
  }, {})

  return (
    <section className={styles.container}>
      <h3 className={styles.title}>
        Productos
      </h3>
      {Object.entries(grouped).map(([group, list]) => (
        <div key={group} className={styles.group}>
          <div className={styles.groupTitle}>{group} ({list.length})</div>
          <div className={styles.groupList}>
            {list.map((it) => <OrderItemRow key={it.shoppingCartId} item={it} />)}
          </div>
        </div>
      ))}
    </section>
  )
}

export default React.memo(OrderItems)
