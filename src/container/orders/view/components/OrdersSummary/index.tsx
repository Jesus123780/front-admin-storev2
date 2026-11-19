'use client'

import { Icon, Text } from 'pkg-components'

import { OrderRecord, OrderStatusType } from '@/container/orders/types';
import { orderStatusName } from '@/container/orders/utils/orders';

import styles from './styles.module.css'

interface Props { orders: OrderRecord[]; statuses: OrderStatusType[] }
export function OrdersSummary({ orders, statuses }: Props) {
  const terminal = new Set(statuses.filter(status => ['CONCLUIDA', 'RECHAZADA'].includes(status.name.toUpperCase())).map(status => status.name))
  const pending = orders.filter(order => !terminal.has(orderStatusName(order, statuses))).length
  const concluded = orders.filter(order => orderStatusName(order, statuses).toUpperCase() === 'CONCLUIDA').length
  const cards = [
    { label: 'Órdenes encontradas', value: String(orders.length), icon: 'IconTicket', hint: 'En la búsqueda actual' },
    { label: 'Por gestionar', value: String(pending), icon: 'time', hint: 'Sin concluir ni rechazar' },
    { label: 'Concluidas', value: String(concluded), icon: 'IconSuccess', hint: 'Estado concluida' },
  ]
  return (
    <section className={styles.grid} aria-label="Resumen de órdenes">
      {cards.map(card => (
        <div key={card.label} className={styles.card}>
          <div className={styles.icon}><Icon icon={card.icon} size={19} color="currentColor" /></div>
          <div className={styles.content}>
            <Text as="p" color="gray-dark" customSize="0.72rem">{card.label}</Text>
            <Text as="strong" weight={700} customSize="1.26rem" className={styles.value}>{card.value}</Text>
            <Text as="p" color="gray-dark" customSize="0.66rem">{card.hint}</Text>
          </div>
        </div>
      ))}
    </section>
  )
}
