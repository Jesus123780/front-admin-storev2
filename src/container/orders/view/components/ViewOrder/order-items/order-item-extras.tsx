'use client'

import { memo } from 'react'
import { numberFormat } from 'pkg-components'

import type { SoldExtra } from './order-item.types'
import { extraSubtotal, finiteNumber, label } from './order-item.utils'
import styles from './order-item-details.module.css'

export const OrderItemExtras = memo(function OrderItemExtras({ extras }: { extras: SoldExtra[] }) {
  if (!extras.length) return null

  return (
    <section className={styles.section} aria-label='Complementos registrados'>
      <div className={styles.heading}>
        <h4 className={styles.title}>Complementos</h4>
        <span className={styles.count}>{extras.length}</span>
      </div>
      <ul className={styles.extraList}>
        {extras.map((extra, index) => {
          const qty = finiteNumber(extra.quantity)
          const subtotal = extraSubtotal(extra)
          return (
            <li className={styles.extraRow} key={extra.exPid ?? `extra-${index}`}>
              <span className={styles.extraDescription}>
                <span className={styles.extraQuantity}>{qty ?? '—'} ×</span>
                <span className={styles.extraName}>{label(extra.extraName, 'Complemento')}</span>
              </span>
              <span className={styles.extraPrice}>
                {subtotal === null ? '—' : `${subtotal > 0 ? '+ ' : ''}${numberFormat(subtotal)}`}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
})
