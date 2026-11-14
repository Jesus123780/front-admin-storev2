'use client'

import { CopyToClipboard, Icon } from 'pkg-components'
import React from 'react'

import styles from './order-header.module.css'

export type OrderStatus = {
  name?: string | null
  color?: string | null
  backgroundColor?: string | null
}

type Props = {
  pCodeRef: string
  modalView?: boolean
  status?: string | null
  createdAt?: string | null
  statusOrder?: OrderStatus | null
}

const OrderHeader: React.FC<Props> = ({
  pCodeRef,
  status,
  createdAt,
  statusOrder
}) => {
  const safeCode = pCodeRef.trim()
  const label = status?.trim() || 'Estado desconocido'
  // El backend define los colores del estado. Variables del theme como fallback.
  const badgeStyle: React.CSSProperties = {
    backgroundColor: statusOrder?.backgroundColor || 'var(--color-background-gray-light, #f5f5f5)',
    color: statusOrder?.color || 'var(--color-text-black, #282828)'
  }
  const validCreatedAt = createdAt && !Number.isNaN(new Date(createdAt).getTime())

  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <p className={styles.eyebrow}>Detalle de la compra</p>
        <div className={styles.heading}>
          <h1 className={styles.title}>Orden</h1>
          {safeCode ? (
            <div className={styles.code}>
              <span className={styles.codeText}>#{safeCode}</span>
              <CopyToClipboard
                text={safeCode}
                label="Copiar código"
                showText={false}
                copiedMessage="Copiado"
                errorMessage="Error al copiar"
              />
            </div>
          ) : <span className={styles.codeUnavailable}>Sin código</span>}
        </div>
      </div>
      <div className={styles.meta}>
        <span className={styles.badge} style={badgeStyle}>{label}</span>
        {createdAt && (
          <div className={styles.date}>
            <span aria-hidden="true"><Icon icon="IconSimpleCalendar" size={17} /></span>
            <time dateTime={validCreatedAt ? new Date(createdAt).toISOString() : undefined}>
              {createdAt}
            </time>
          </div>
        )}
      </div>
    </header>
  )
}

export default React.memo(OrderHeader)
