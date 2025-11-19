// components/order-page/OrderPage/index.tsx
'use client'
import React from 'react'

import { Order } from '../types/order'
import { OrderActions } from './order-actions'
import OrderClientInfo from './order-client-info'
import OrderHeader from './order-header'
import OrderItems from './order-items'
import styles from './order-page.module.css'
import OrderPayments from './order-payments'
import OrderTotals, { PropsTotals } from './order-totals'

export type PropsOrderDetail = {
  order: Order
  totals: PropsTotals[]
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
          pCodeRef={order?.pCodeRef ?? '—'}
          status={order.statusOrder.name ?? '—'}
          createdAt={order.createdAt}
          statusOrder={order.statusOrder}
        />
        <div className={styles.content}>
          <div className={styles.left}>
            <OrderClientInfo client={order?.client} store={order?.store} />
            <OrderItems items={order?.shoppingCarts} />
          </div>
          <aside className={styles.right}>
            <OrderTotals totals={totals} />
            {order?.paymentMethod &&<OrderPayments paymentMethod={order.paymentMethod} />}
            <OrderActions handlePrint={handlePrint} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default React.memo(OrderDetail)
