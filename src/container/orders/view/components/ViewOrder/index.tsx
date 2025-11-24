// components/order-page/OrderPage/index.tsx
'use client'
import React from 'react'

import { Order } from '../types/order'
import { OrderActions } from './order-actions'
import OrderClientInfo from './order-client-info'
import { CodeDisplay } from './order-code-display'
import OrderHeader from './order-header'
import OrderItems from './order-items'
import styles from './order-page.module.css'
import OrderPayments from './order-payments'
import OrderTotals, { PropsTotals } from './order-totals'

export type PropsOrderDetail = {
  order: Order
  totals: PropsTotals
  handlePrint: () => void
}

const OrderDetail: React.FC<PropsOrderDetail> = ({
  order,
  totals,
  handlePrint
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <OrderHeader
          pCodeRef={String(order?.pCodeRef ?? '—')}
          status={String(order.statusOrder?.name ?? '—')}
          createdAt={order.createdAt ?? null}
          statusOrder={order.statusOrder ?? {}}
        />
        <div className={styles.content}>
          <div className={styles.left}>
            <OrderClientInfo
              client={order?.client}
              store={order?.store}
              createdAt={String(order?.createdAt)}
            />
            <OrderItems items={order?.shoppingCarts} />
            <CodeDisplay pCodeRef={order?.pCodeRef} />
          </div>
          <aside className={styles.right}>
            <OrderTotals totals={totals.totals} />
            {order?.paymentMethod !== null && <OrderPayments paymentMethod={order.paymentMethod} />}
            <OrderActions handlePrint={handlePrint} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default React.memo(OrderDetail)
