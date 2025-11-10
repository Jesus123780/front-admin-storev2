'use client'
import {
  CardOrderView,
  CounterAnimation,
  getGlobalStyle,
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
  if (statusTypes?.length === 0) { return null }
  return (
    <div
      className={styles.container}
      style={{
        backgroundColor: getGlobalStyle('--color-base-white'),
        gridTemplateColumns: `repeat(${statusTypes?.length ?? 1}, 1fr)`
      }}
    >
      {statusTypes?.map((statusType) => {
        const status = statusType.name ?? ''
        const list = orders[status] ?? []

        return (
          <div key={status} className={styles.column}>
            <Row>
              <Text
                color='gray-dark'
                as='h2'
                align='start'
              >
                {status}
              </Text>
              <Text
                color='gray-dark'
                as='span'
                align='start'
              >
                <CounterAnimation
                  number={Number(list.length ?? 0)}
                  size='1rem'
                  numberformat={false}
                />
              </Text>
            </Row>

            {list.length === 0 ? (
              <Text as='p' color='gray'>
                Sin órdenes
              </Text>
            ) : (
              <div className={styles.ordersList}>
                {list.map((order) => (
                  <div key={order.pCodeRef} className={styles.cardWrapper}>
                    <CardOrderView
                      logo=''
                      amount={numberFormat(order.totalProductsPrice ?? 0)}
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
