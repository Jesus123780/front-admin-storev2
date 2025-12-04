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
  loading: boolean
  modalView: boolean
  totals: PropsTotals
  handlePrint: () => void
}

const OrderDetail: React.FC<PropsOrderDetail> = ({
  order,
  totals,
  loading,
  modalView = false,
  handlePrint
}) => {
  return (
    <div
      className={styles.container}
      data-modal={modalView}
      style={modalView
        ? { height: '100%', overflowY: 'auto' }
        : {}
      }
    >
      {loading && <div className={styles.loadingOverlay}>Cargando...</div>}
      <div className={styles.panel}>
        <OrderHeader
          pCodeRef={String(order?.pCodeRef ?? '—')}
          status={String(order?.statusOrder?.name ?? '—')}
          createdAt={order?.createdAt ?? null}
          statusOrder={order?.statusOrder ?? {}}
          modalView={modalView}
        />
        <div className={styles.content} style={
          modalView ? { 
            flexDirection: 'column',
            overflowY: 'auto',
            height: 'calc(100% - 160px)'
          } : {
          
        }}>
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
            <OrderTotals totals={totals?.totals} />
            {order?.paymentMethod !== null && <OrderPayments paymentMethod={order?.paymentMethod} />}
            <OrderActions handlePrint={handlePrint} />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default React.memo(OrderDetail)
