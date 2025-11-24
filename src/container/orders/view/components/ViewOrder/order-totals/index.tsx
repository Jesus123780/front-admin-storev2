'use client'
import {
 numberFormat, Row, Text 
} from 'pkg-components'
import React from 'react'

import styles from './order-totals.module.css'

export type Total = {
  name: string
  value: number
}

export type PropsTotals = {
  totals: Total[]
}

const formatLabel = (key: string) => {
  const labels: Record<string, string> = {
    subtotal: 'Subtotal',
    totalExtras: 'Extras',
    totalVat: 'IVA',
    totalDiscounts: 'Descuentos',
    grandTotal: 'Total',
    globalDiscountValue: 'Descuento Global ($)',
    globalDiscountPercent: 'Descuento Global (%)',
    grandTotalAfterGlobalDiscount: 'Total con descuento',
  }

  return labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
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
            <Text size='md'>{formatLabel(total.name)}</Text>
            <Text size='md'>{numberFormat(total.value)}</Text>
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
