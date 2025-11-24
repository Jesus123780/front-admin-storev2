'use client'

import {
 Icon, Row, Text 
} from 'pkg-components'
import React from 'react'

import styles from './order-payments.module.css'

export interface PaymentMethod {
  name: string
  icon: string
}

const OrderPayments: React.FC<{ paymentMethod?: PaymentMethod }> = ({
  paymentMethod = {
    name: '—',
    icon: ''
  }
}: { paymentMethod?: PaymentMethod }) => {

  return (
    <div className={styles.container}>
      <Row gap='md' alignItems='center'>
        <Icon icon={paymentMethod?.icon} size={30} />
        <Text>
          {paymentMethod?.name}
        </Text>
      </Row>
    </div>
  )
}

export default React.memo(OrderPayments)
