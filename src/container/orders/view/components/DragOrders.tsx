'use client'
import {
 CardOrderView,
 numberFormat,
 Row, 
 Text 
} from 'pkg-components'
import React from 'react'

import { type OrderGroup, OrderStatusType } from '../../types'
import styles from './styles.module.css'

interface IDragOrders {
  orders: Record<string, OrderGroup[]>
  statusTypes: OrderStatusType[]
}

export const DragOrders: React.FC<IDragOrders> = ({
  orders = {},
  statusTypes = []
}) => {
  return (
    <div
    className={styles.container}
    style={{
      gridTemplateColumns: `repeat(${statusTypes.length ?? 1}, 1fr)`
    }}
    >
      {statusTypes.map((statusType) => {
        const status = statusType.name
        const list = orders[status] ?? []

        return (
          <div key={status} className={styles.column}>
            <Row>
              <Text color='gray-dark' as='h2' className={styles.statusTitle}>
                {status}
              </Text>
              <Text>({list.length})</Text>
            </Row>

            {list.length === 0 ? (
              <p className={styles.emptyText}>Sin órdenes</p>
            ) : (
              <div className={styles.ordersList}>
                {list.map((order) => (
                  <div key={order.pCodeRef} className={styles.cardWrapper}>
                    <CardOrderView
                      logo=''
                      amount={numberFormat(order.totalProductsPrice)}
                      date={
                        order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : ''
                      }
                      title={`Orden #${order.pCodeRef}`}
                      {...order}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
