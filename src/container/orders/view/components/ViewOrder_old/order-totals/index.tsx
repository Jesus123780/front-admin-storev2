'use client'
import { Row, Text } from 'pkg-components'
import React from 'react'

import styles from './order-totals.module.css'

export type Total = {
  name: string
  value: number
}

export type PropsTotals = {
  totals: Total[]
}


const OrderTotals: React.FC<PropsTotals> = ({ totals }) => {
  return (
    <div className={styles.container}>
      <Text size='xl' weight='bold'>
        Totales
      </Text>
      <div className={styles.totals}>
        {totals.map((total) => (
          <Row key={total.name} className={styles.totalRow} justifyContent='space-between'>
            <Text size='md'>
              {total.name}
            </Text>
            <Text size='md'>
              {total.value}
            </Text>
          </Row>
        ))}
      </div>

      <div className={styles.note}>
        <label className={styles.label}>
          Añadir nota al pedido
        </label>
        <textarea
          className={styles.textarea}
          placeholder="Escribe un mensaje..."
          maxLength={240}
        />
      </div>
    </div>
  )
}

export default React.memo(OrderTotals)
