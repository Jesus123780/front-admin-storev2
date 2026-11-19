
'use client'

import { Icon } from 'pkg-components'
import type { CSSProperties } from 'react'

import type {
  OrdersLayout,
  OrdersPreset,
  OrdersSort,
  OrderStatusType
} from '@/container/orders/types'

import styles from './styles.module.css'

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

const periods: Array<{
  value: Exclude<OrdersPreset, 'custom'>
  label: string
}> = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: '7days', label: '7 días' },
  { value: '30days', label: '30 días' }
]

export function OrdersToolbar({
  search,
  onSearch,
  layout,
  onLayout,
  sort,
  onSort,
  preset,
  onPreset,
  onOpenDateFilter,
  selectedStatuses,
  onStatusToggle,
  onClearStatuses,
  statuses,
  counts,
  onRefresh,
  refreshing,
  onManageStatuses
}: Props) {
  const total = Object.values(counts).reduce(
    (acc, count) => acc + count,
    0
  )

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <div
          className={styles.periods}
          role='group'
          aria-label='Rango rápido de fechas'
        >
          {periods.map(period => (
            <button
              key={period.value}
              type='button'
              className={styles.period}
              aria-pressed={preset === period.value}
              onClick={() => onPreset(period.value)}
            >
              {period.label}
            </button>
          ))}

          <button
            type='button'
            className={styles.period}
            aria-pressed={preset === 'custom'}
            onClick={onOpenDateFilter}
          >
            <Icon
              icon='IconCalendar'
              size={15}
              color='currentColor'
            />
            <span>Personalizado</span>
          </button>
        </div>

        <div className={styles.tools}>
          <div
            className={styles.search}
            role='search'
          >
            <Icon
              icon='IconSearch'
              size={18}
              color='var(--color-icons-gray)'
            />

            <input
              type='search'
              value={search}
              onChange={event => onSearch(event.target.value)}
              placeholder='Buscar código de orden'
              aria-label='Buscar por código de orden'
              autoComplete='off'
              enterKeyHint='search'
            />

            {search.length > 0 && (
              <button
                type='button'
                aria-label='Limpiar búsqueda'
                title='Limpiar búsqueda'
                onClick={() => onSearch('')}
              >
                <Icon
                  icon='IconClose'
                  size={15}
                  color='currentColor'
                />
              </button>
            )}
          </div>

          <label className={styles.sort}>
            <span className={styles.srOnly}>
              Ordenar órdenes
            </span>

            <select
              value={sort}
              onChange={event => onSort(
                event.target.value as OrdersSort
              )}
              aria-label='Ordenar órdenes'
            >
              <option value='newest'>Más recientes</option>
              <option value='oldest'>Más antiguas</option>
              <option value='amount-desc'>Mayor valor</option>
              <option value='amount-asc'>Menor valor</option>
            </select>
          </label>

          <button
            type='button'
            className={styles.toolButton}
            onClick={onRefresh}
            disabled={refreshing}
            aria-label={
              refreshing
                ? 'Actualizando órdenes'
                : 'Actualizar órdenes'
            }
            aria-busy={refreshing}
            title='Actualizar órdenes'
          >
            <span className={
              `${styles.refreshIcon} ${
                refreshing ? styles.isSpinning : ''
              }`
            }>
              <Icon
                icon='IconReload'
                size={18}
                color='currentColor'
              />
            </span>

            <span className={styles.refreshLabel}>
              {refreshing ? 'Actualizando' : 'Actualizar'}
            </span>
          </button>

          <div
            className={styles.layouts}
            role='group'
            aria-label='Modo de visualización'
          >
            <button
              type='button'
              aria-label='Vista de lista'
              title='Lista'
              aria-pressed={layout === 'list'}
              onClick={() => onLayout('list')}
            >
              <Icon
                icon='IconListBullet'
                size={19}
                color='currentColor'
              />
              <span>Lista</span>
            </button>

            <button
              type='button'
              aria-label='Vista de tablero'
              title='Tablero'
              aria-pressed={layout === 'columns'}
              onClick={() => onLayout('columns')}
            >
              <Icon
                icon='IconGrid'
                size={19}
                color='currentColor'
              />
              <span>Tablero</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.statusArea}>
        <div
          className={styles.statusFilters}
          role='group'
          aria-label='Filtrar por estado'
        >
          <button
            type='button'
            className={styles.statusChip}
            aria-pressed={selectedStatuses.length === 0}
            onClick={onClearStatuses}
          >
            Todas
            <span>{total}</span>
          </button>

          {statuses.map(status => {
            const active = selectedStatuses.includes(status.name)

            return (
              <button
                key={status.idStatus || status.name}
                type='button'
                className={styles.statusChip}
                aria-pressed={active}
                style={{
                  '--chip-bg': status.backgroundColor,
                  '--chip-foreground': status.color
                } as CSSProperties}
                onClick={() => onStatusToggle(status.name)}
                title={status.description ?? undefined}
              >
                <i
                  className={styles.chipDot}
                  aria-hidden='true'
                />

                {status.name}

                <span>{counts[status.name] ?? 0}</span>
              </button>
            )
          })}
        </div>

        <button
          type='button'
          className={styles.manage}
          onClick={onManageStatuses}
          title='Configurar estados de órdenes'
        >
          <Icon
            icon='IconConfig'
            size={18}
            color='currentColor'
          />
          <span>Estados</span>
        </button>
      </div>
    </div>
  )
}
