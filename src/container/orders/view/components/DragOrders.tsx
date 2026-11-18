'use client'

import { Icon, Text } from 'pkg-components'
import { type CSSProperties,useState } from 'react'

import type { OrderRecord, OrderStatusType } from '../../types'
import { orderStatusName } from '../../utils/orders'
import styles from './styles.module.css'
import { OrderCard } from './ViewOrder/OrderCard'

export interface DragOrdersProps {
  orders: OrderRecord[]
  statusTypes: OrderStatusType[]
  onOpen: (code: string) => void
  onPrint: (code: string) => void
  onPdf: (code: string) => void
  downloadingCode?: string | null
}

/** Kanban is read-only until a real, authorized change-status mutation exists. */
function BoardColumn({ status, group, onOpen, onPrint, onPdf, downloadingCode }: { status: OrderStatusType; group: OrderRecord[]; onOpen: DragOrdersProps['onOpen']; onPrint: DragOrdersProps['onPrint']; onPdf: DragOrdersProps['onPdf']; downloadingCode?: string | null }) {
  const [limit, setLimit] = useState(24)
  return <section className={styles.column} aria-label={`${status.name}: ${group.length} órdenes`} style={{ '--status-color': status.color, '--status-background': status.backgroundColor } as CSSProperties}>
    <header className={styles.header}>
      <span className={styles.statusIndicator} aria-hidden="true" />
      <div className={styles.heading}>
        <Text as="h2" customSize="0.76rem" weight={700} className={styles.name}>{status.name}</Text>
        {status.description && <Text as="p" color="gray-dark" customSize="0.68rem" lineClamp={1} title={status.description}>{status.description}</Text>}
      </div>
      <span className={styles.count} aria-label={`${group.length} órdenes`}>{group.length}</span>
    </header>
    <div className={styles.list}>
      {group.length ? group.slice(0, limit).map(order => <OrderCard key={order.pCodeRef} order={order} status={status} onOpen={onOpen} onPrint={onPrint} onPdf={onPdf} busyPdf={downloadingCode === order.pCodeRef} />) :
        <div className={styles.empty}><Icon icon="IconBoxes" size={24} color="var(--color-icons-gray-light)" /><Text as="p" color="gray-dark" customSize="0.77rem">Sin órdenes en este estado</Text></div>}
      {group.length > limit && <button type="button" className={styles.more} onClick={() => setLimit(previous => previous + 24)}>Mostrar 24 más ({group.length - limit} restantes)</button>}
    </div>
  </section>
}

export function DragOrders({ orders, statusTypes, onOpen, onPrint, onPdf, downloadingCode }: DragOrdersProps) {
  return (
    <div className={styles.board} role="region" aria-label="Tablero de órdenes por estado" tabIndex={0}>
      <div className={styles.columns}>
        {statusTypes.map(status => {
          const group = orders.filter(order => orderStatusName(order, statusTypes) === status.name)
          return <BoardColumn key={status.idStatus || status.name} status={status} group={group} onOpen={onOpen} onPrint={onPrint} onPdf={onPdf} downloadingCode={downloadingCode} />
        })}
        {orders.some(order => !statusTypes.some(status => status.name === orderStatusName(order, statusTypes))) && (
          <section className={styles.column} aria-label="Órdenes sin estado configurado">
            <header className={styles.header}><Text as="h2" weight={700}>SIN CLASIFICAR</Text></header>
            <div className={styles.list}>
              {orders.filter(order => !statusTypes.some(status => status.name === orderStatusName(order, statusTypes)))
                .map(order => <OrderCard key={order.pCodeRef} order={order} status={undefined} onOpen={onOpen} onPrint={onPrint} onPdf={onPdf} busyPdf={downloadingCode === order.pCodeRef} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
