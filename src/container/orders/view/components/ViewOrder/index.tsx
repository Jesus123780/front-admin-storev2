'use client'

import React from 'react'

import type { Order } from '../types/order'
import { OrderActions } from './order-actions'
import OrderClientInfo from './order-client-info'
import { CodeDisplay } from './order-code-display'
import OrderHeader from './order-header'
import OrderItems from './order-items'
import styles from './order-page.module.css'
import OrderPayments from './order-payments'
import OrderTotals, { type PropsTotals } from './order-totals'

export type PropsOrderDetail = {
  /** Puede llegar vacío durante la petición desde GraphQL. */
  order?: Order | null
  loading?: boolean
  modalView?: boolean
  totals?: PropsTotals | null
  handlePrint?: () => void | Promise<void>
  /** Texto inicial de la nota; requiere onSaveNote para persistir. */
  note?: string
  onSaveNote?: (note: string) => Promise<void> | void
}

const OrderDetail: React.FC<PropsOrderDetail> = ({
  order,
  totals,
  loading = false,
  modalView = false,
  handlePrint,
  note = '',
  onSaveNote
}) => {
  const hasOrder = Boolean(order)
  const orderCode = order?.pCodeRef?.trim() ?? ''
  const allTotals = totals?.totals ?? order?.totals ?? []
  return (
    <div
      className={styles.container}
      data-modal={modalView ? 'true' : 'false'}
      aria-busy={loading}
    >
      <div className={styles.panel}>
        {!hasOrder ? (
          loading ? (
            <div role="status" aria-live="polite" className={styles.skeletonRoot}>
              <span className={styles.srOnly}>Cargando los detalles de la orden</span>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonGrid}>
                <div className={styles.skeletonBlock} />
                <div className={styles.skeletonBlock} />
              </div>
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              <span className={styles.emptyIcon} aria-hidden="true">▤</span>
              <h2>No hay una orden para mostrar</h2>
              <p>Selecciona una orden para consultar sus productos, pagos y detalles.</p>
            </div>
          )
        ) : (
          <>
            <OrderHeader
              pCodeRef={orderCode}
              status={order?.statusOrder?.name}
              statusOrder={order?.statusOrder}
              createdAt={order?.createdAt}
              modalView={modalView}
            />

            <div className={styles.content}>
              <div className={styles.left}>
                <OrderClientInfo
                  client={order?.client}
                  store={order?.store}
                  createdAt={order?.createdAt}
                />
                <OrderItems items={order?.shoppingCarts ?? []} />
                <CodeDisplay pCodeRef={orderCode} />
              </div>

              <aside className={styles.right} aria-label="Resumen y acciones de la orden">
                <OrderTotals
                  key={orderCode || '__no_code__'}
                  totals={allTotals}
                  note={note}
                  onSaveNote={onSaveNote}
                />
                <OrderPayments paymentMethod={order?.paymentMethod} />
                <OrderActions
                  handlePrint={handlePrint}
                  disabled={loading || !orderCode}
                />
              </aside>
            </div>
          </>
        )}
      </div>
      {loading && hasOrder && (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          Actualizando orden…
        </div>
      )}
    </div>
  )
}

export default React.memo(OrderDetail)
