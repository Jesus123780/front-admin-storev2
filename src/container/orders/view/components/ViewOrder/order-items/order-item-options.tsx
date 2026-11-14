'use client'

import { memo } from 'react'

import type { SoldOptional } from './order-item.types'
import { label, visibleSubOptions } from './order-item.utils'
import styles from './order-item-details.module.css'

export const OrderItemOptions = memo(function OrderItemOptions({ options }: { options: SoldOptional[] }) {
  const groups = options.map(option => ({ option, children: visibleSubOptions(option) }))
    .filter(group => group.children.length > 0)
  if (!groups.length) return null

  return (
    <section className={styles.section} aria-label='Opciones registradas'>
      <div className={styles.heading}>
        <h4 className={styles.title}>Opciones registradas</h4>
      </div>
      {groups.map(({ option, children }, index) => (
        <div className={styles.optionGroup} key={option.opExPid ?? `option-${index}`}>
          <p className={styles.optionName}>{label(option.OptionalProName, 'Opción')}</p>
          <ul className={styles.chips}>
            {children.map((child, childIndex) => (
              <li className={styles.chip} key={child.opSubExPid ?? `sub-${childIndex}`}>
                {label(child.OptionalSubProName, 'Sin nombre')}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
})
