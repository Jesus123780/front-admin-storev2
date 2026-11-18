'use client'

import type { CSSProperties } from 'react'
import { Icon } from 'pkg-components'
import styles from './styles.module.css'
import { OrdersLayout, OrdersPreset, OrdersSort, OrderStatusType } from '@/container/orders/types'

interface Props {
  search: string
  onSearch: (value: string) => void
  layout: OrdersLayout
  onLayout: (value: OrdersLayout) => void
  sort: OrdersSort
  onSort: (value: OrdersSort) => void
  preset: OrdersPreset
  onPreset: (value: Exclude<OrdersPreset, 'custom'>) => void
  onOpenDateFilter: () => void
  selectedStatuses: string[]
  onStatusToggle: (name: string) => void
  onClearStatuses: () => void
  statuses: OrderStatusType[]
  counts: Record<string, number>
  onRefresh: () => void
  refreshing: boolean
  onManageStatuses: () => void
}

const periods: Array<{ value: Exclude<OrdersPreset, 'custom'>; label: string }> = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: '7days', label: '7 días' },
  { value: '30days', label: '30 días' }
]

export function OrdersToolbar({ search, onSearch, layout, onLayout, sort, onSort, preset, onPreset,
  onOpenDateFilter, selectedStatuses, onStatusToggle, onClearStatuses, statuses, counts, onRefresh,
  refreshing, onManageStatuses }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <div className={styles.periods} role="group" aria-label="Rango rápido de fechas">
          {periods.map(item => (
            <button key={item.value} className={styles.period} type="button" aria-pressed={preset === item.value} onClick={() => onPreset(item.value)}>{item.label}</button>
          ))}
          <button type="button" className={styles.period} aria-pressed={preset === 'custom'} onClick={onOpenDateFilter}>
            <Icon icon="IconCalendar" size={15} color="currentColor" /><span>Personalizado</span>
          </button>
        </div>
        <div className={styles.tools}>
          <label className={styles.search}>
            <Icon icon="IconSearch" size={18} color="var(--color-icons-gray)" />
            <input type="search" value={search} onChange={event => onSearch(event.target.value)} placeholder="Buscar código, cliente o pago" aria-label="Buscar órdenes" autoComplete="off" />
            {search && <button type="button" aria-label="Limpiar búsqueda" title="Limpiar" onClick={() => onSearch('')}><Icon icon="IconClose" size={15} color="currentColor" /></button>}
          </label>
          <label className={styles.sort}>
            <span className={styles.srOnly}>Ordenar órdenes</span>
            <select value={sort} onChange={event => onSort(event.target.value as OrdersSort)} aria-label="Ordenar órdenes">
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguas</option>
              <option value="amount-desc">Mayor valor</option>
              <option value="amount-asc">Menor valor</option>
            </select>
          </label>
          <button type="button" className={styles.toolButton} onClick={onRefresh} disabled={refreshing} title="Actualizar órdenes" aria-label="Actualizar órdenes">
            <Icon icon="IconReload" size={18} color="currentColor" />
            <span className={styles.refreshLabel}>{refreshing ? 'Actualizando' : 'Actualizar'}</span>
          </button>
          <div className={styles.layouts} role="group" aria-label="Modo de visualización">
            <button type="button" aria-label="Vista de lista" title="Lista" aria-pressed={layout === 'list'} onClick={() => onLayout('list')}><Icon icon="IconListBullet" size={19} color="currentColor" /><span>Lista</span></button>
            <button type="button" aria-label="Vista de tablero" title="Columnas" aria-pressed={layout === 'columns'} onClick={() => onLayout('columns')}><Icon icon="IconGrid" size={19} color="currentColor" /><span>Tablero</span></button>
          </div>
        </div>
      </div>
      <div className={styles.statusArea}>
        <div className={styles.statusFilters} role="group" aria-label="Filtrar por estado">
          <button type="button" className={styles.statusChip} aria-pressed={!selectedStatuses.length} onClick={onClearStatuses}>Todas <span>{Object.values(counts).reduce((a, b) => a + b, 0)}</span></button>
          {statuses.map(status => (
            <button
              key={status.idStatus || status.name}
              type="button"
              className={styles.statusChip}
              aria-pressed={selectedStatuses.includes(status.name)}
              style={{ '--chip-bg': status.backgroundColor, '--chip-foreground': status.color } as CSSProperties}
              onClick={() => onStatusToggle(status.name)}
              title={status.description ?? undefined}
            >
              <i className={styles.chipDot} aria-hidden="true" />{status.name}
              <span>{counts[status.name] ?? 0}</span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.manage} onClick={onManageStatuses} title="Configurar estados de órdenes">
          <Icon icon="IconConfig" size={18} color="currentColor" /> <span>Estados</span>
        </button>
      </div>
    </div>
  )
}
