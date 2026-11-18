'use client'

import {
 CopyToClipboard, Icon, Text 
} from 'pkg-components'
import type { CSSProperties } from 'react'

import { OrderRecord, OrderStatusType } from '@/container/orders/types'

import {
 clientName, formatCOP, formatOrderTime, orderAmount, orderItemsCount 
} from '../../../../utils/orders'
import { OrderStatusBadge } from '../OrderStatusBadge'
import styles from './styles.module.css'
import { OrderBoardHistory } from '../../OrderBoardHistory'

interface Props {
  order: OrderRecord
  status: OrderStatusType | undefined
  onOpen: (code: string) => void
  onPrint: (code: string) => void
  onPdf: (code: string) => void
  busyPdf?: boolean
}

export function OrderCard({ order, status, onOpen, onPrint, onPdf, busyPdf }: Props) {
  const amount = orderAmount(order)
  const quantity = orderItemsCount(order)
  const client = clientName(order)
  return (
    <article className={styles.card} style={{ '--card-accent': status?.backgroundColor ?? '#E5E5E5' } as CSSProperties}>
      <div className={styles.top}>
        <button className={styles.code} type="button" onClick={() => onOpen(order.pCodeRef)} aria-label={`Ver detalle de orden ${order.pCodeRef}`}>
          <Icon icon="IconTicket" size={16} color="currentColor" />
          <Text as="span" weight={700} customSize="0.86rem">#{order.pCodeRef}</Text>
        </button>
        <Text as="time" color="gray-dark" customSize="0.72rem" title={order.createdAt ?? ''}>{formatOrderTime(order.createdAt)}</Text>
      </div>
      <div className={styles.main}>
        <Text as="p" weight={700} customSize="1.12rem" className={styles.amount}>{formatCOP(amount)}</Text>
        <Text as="p" color="gray-dark" customSize="0.77rem" truncate>
          {client ?? (quantity !== null ? `${quantity} ${quantity === 1 ? 'producto' : 'productos'}` : 'Consultar información de la orden')}
        </Text>
        {client && quantity !== null && <Text as="p" color="gray-dark" customSize="0.72rem">{quantity} {quantity === 1 ? 'producto' : 'productos'}</Text>}
      </div>
            <div className={styles.historySlot}>
              <OrderBoardHistory
                key={order.pCodeRef}
                pCodeRef={order.pCodeRef}
                active={true}
              />
            </div>
      <div className={styles.footer}>
        <OrderStatusBadge status={status} fallback={typeof order.status === 'string' ? order.status : 'Sin estado'} compact />
        <div className={styles.actions}>
          <div className={styles.copy} onClick={event => event.stopPropagation()}>
            <CopyToClipboard text={order.pCodeRef} showText={false} label="Copiar" copiedMessage="Copiado" />
          </div>
          <button type="button" className={styles.action} onClick={() => onPrint(order.pCodeRef)} aria-label={`Imprimir orden ${order.pCodeRef}`} title="Imprimir">
            <Icon icon="IconPrint" size={17} color="currentColor" />
          </button>
          <button type="button" className={styles.action} disabled={busyPdf} onClick={() => onPdf(order.pCodeRef)} aria-label={`Descargar PDF de ${order.pCodeRef}`} title="Descargar PDF">
            <Icon icon={busyPdf ? 'IconLoading' : 'IconPdf'} size={17} color="currentColor" />
          </button>
          <button type="button" className={styles.action} onClick={() => onOpen(order.pCodeRef)} aria-label={`Abrir orden ${order.pCodeRef}`} title="Abrir detalle">
            <Icon icon="IconArrowRight" size={17} color="currentColor" />
          </button>
        </div>
      </div>
    </article>
  )
}
