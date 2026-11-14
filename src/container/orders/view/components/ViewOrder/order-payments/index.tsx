'use client'

import React from 'react'
import { Icon } from 'pkg-components'
import styles from './order-payments.module.css'

export interface PaymentMethod {
  name: string
  icon?: string
}

type Props = { paymentMethod?: PaymentMethod | null }

const ALLOWED_PAYMENT_ICONS = new Set([
  'IconWallet',
  'IconVisa',
  'IconMasterCard',
  'IconVisaSimple',
  'IconMasterCardSimple',
  'IconTransfer',
  'IconDollar'
])

const OrderPayments: React.FC<Props> = ({ paymentMethod }) => {
  const headingId = React.useId()
  const name = paymentMethod?.name?.trim() || 'No registrado'
  const icon = paymentMethod?.icon && ALLOWED_PAYMENT_ICONS.has(paymentMethod.icon)
    ? paymentMethod.icon
    : 'IconWallet'

  return (
    <section className={styles.container} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.title}>Método de pago</h2>
      <div className={styles.method}>
        <span className={styles.icon} aria-hidden="true"><Icon icon={icon} size={24} /></span>
        <div className={styles.info}>
          <span className={styles.methodLabel}>Medio utilizado</span>
          <strong className={styles.name}>{name}</strong>
        </div>
      </div>
    </section>
  )
}

export default React.memo(OrderPayments)
