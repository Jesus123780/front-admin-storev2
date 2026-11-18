import type { CSSProperties } from 'react'
import { Text } from 'pkg-components'
import type { OrderStatusType } from '../../types'
import styles from './styles.module.css'

interface Props { status: OrderStatusType | undefined; fallback?: string; compact?: boolean }
export function OrderStatusBadge({ status, fallback = 'Sin estado', compact = false }: Props) {
  const style = {
    '--status-background': status?.backgroundColor ?? 'var(--color-neutral-gray-light)',
    '--status-color': status?.color ?? 'var(--color-text-gray-light)'
  } as CSSProperties
  return (
    <span className={styles.badge} data-compact={compact} style={style} title={status?.description || fallback}>
      <span className={styles.dot} aria-hidden="true" />
      <Text as="span" weight={600} customSize="0.72rem">{status?.name || fallback}</Text>
    </span>
  )
}
