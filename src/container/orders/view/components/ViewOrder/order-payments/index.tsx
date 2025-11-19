// components/order-payments/index.tsx
'use client'
import React, { useState } from 'react'

import styles from './order-payments.module.css'

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Credit card' }
]

const OrderPayments: React.FC = () => {
  const [selected, setSelected] = useState<string>('cash')

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Select a payment method</h4>
      <div className={styles.methods}>
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className={`${styles.method} ${selected === m.id ? styles.active : ''}`}
            aria-pressed={selected === m.id}
          >
            {m.label}
            {selected === m.id && <span className={styles.check}>✓</span>}
          </button>
        ))}
      </div>

      <div className={styles.bottom}>
        <button className={styles.primary}>Complete payment</button>
      </div>
    </div>
  )
}

export default React.memo(OrderPayments)
