'use client'

import { useRecentOrders } from 'npm-pkg-hook'
import {
 getGlobalStyle, 
 Icon, 
 Pagination, 
 Text 
} from 'pkg-components'
import PropTypes from 'prop-types'
import {
 useEffect, useMemo, useState 
} from 'react'

import { formatCurrency, formatDate } from '../../utils/format'
import { getOrderStatusMeta } from '../../utils/orderStatus'
import { WidgetError } from '../WidgetError'
import styles from './styles.module.css'

const PAGE_SIZE = 6
const DEBOUNCE_MS = 350

const STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: '4', label: 'Concluidos' },
  { id: '2', label: 'En proceso' },
  { id: '5', label: 'Rechazados' }
]

/**
 * Recent orders table with debounced search, status quick-filters, real
 * backend pagination and semantic status badges. Dates are shown in the
 * business timezone; each row's data comes from a single efficient query.
 *
 * @param {object} props - Component props.
 * @param {object} props.baseFilter - DashboardFilterInput for the active period.
 * @param {string} [props.currency] - ISO currency code.
 * @returns {JSX.Element} The recent orders panel.
 */
export const RecentOrders = ({ baseFilter, currency }) => {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Debounce the free-text search so we don't query on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [searchInput])

  // Reset to page 1 whenever the period, search or status changes.
  useEffect(() => {
    setPage(1)
  }, [baseFilter, debouncedSearch, statusFilter])

  const filter = useMemo(
    () => ({
      ...baseFilter,
      page,
      pageSize: PAGE_SIZE,
      sortBy: 'createdAt',
      sortDirection: 'DESC',
      ...(debouncedSearch ? { search: debouncedSearch } : {})
    }),
    [baseFilter, page, debouncedSearch]
  )

  const [result, { loading, error, refetch }] = useRecentOrders(filter)

  const allRows = result?.rows ?? []
  // Status quick-filter is applied client-side over the current page because
  // the backend status filter is not part of the recent-orders contract yet;
  // period + search + pagination are server-driven.
  const rows = statusFilter === 'all'
    ? allRows
    : allRows.filter((row) => String(row.statusState) === statusFilter)

  const total = result?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageItems = useMemo(
    () => Array.from({ length: pageCount }, (_, i) => i + 1),
    [pageCount]
  )

  const isInitialLoading = loading && !result

  const renderRows = () => {
    if (isInitialLoading) {
      return Array.from({ length: 4 }).map((_, i) => (
        <div className={styles.rowSkeleton} key={`sk-${i}`} aria-busy='true' />
      ))
    }

    if (rows.length === 0) {
      return (
        <div className={styles.empty}>
          <Icon color={getGlobalStyle('--color-icons-gray-light')} icon='IconListBullet' size={28} />
          <Text as='p' className={styles.emptyText} size='md'>
            {debouncedSearch || statusFilter !== 'all'
              ? 'No hay pedidos que coincidan con el filtro. Prueba limpiar la búsqueda.'
              : 'No hay pedidos en el periodo seleccionado.'}
          </Text>
        </div>
      )
    }

    return rows.map((row) => {
      const meta = getOrderStatusMeta(row.statusState)
      return (
        <div className={styles.row} key={row.orderId}>
          <span className={styles.cellCode} data-label='Pedido'>
            <Text as='span' size='sm' weight={600}>{row.code}</Text>
          </span>
          <span className={styles.cellProduct} data-label='Producto'>
            <Text as='span' className={styles.productName} size='md'>
              {row.productSummary}
            </Text>
            {row.extraItems > 0 && (
              <Text as='span' className={styles.extra} size='sm'>
                +{row.extraItems} {row.extraItems === 1 ? 'producto' : 'productos'}
              </Text>
            )}
          </span>
          <span className={styles.cellDate} data-label='Fecha'>
            <Text as='span' size='sm'>
              {formatDate(row.createdAt, { timezone: baseFilter?.timezone, dateStyleOptions: { day: '2-digit', month: 'short' } })}
            </Text>
          </span>
          <span className={styles.cellStatus} data-label='Estado'>
            <span className={`${styles.badge} ${styles[`badge_${meta.tone}`]}`}>{meta.label}</span>
          </span>
          <span className={styles.cellPrice} data-label='Total'>
            <Text as='span' size='md' weight={700}>{formatCurrency(row.total, { currency })}</Text>
          </span>
        </div>
      )
    })
  }

  return (
    <section aria-busy={loading} aria-label='Pedidos recientes' className={styles.panel}>
      <header className={styles.header}>
        <Text as='h2' className={styles.title} size='xl' weight={700}>
          Pedidos recientes
        </Text>
        <div className={styles.controls}>
          <label className={styles.search}>
            <Icon color={getGlobalStyle('--color-icons-gray-light')} icon='IconSearch' size={16} />
            <input
              aria-label='Buscar por código de pedido'
              className={styles.searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Buscar pedido…'
              type='search'
              value={searchInput}
            />
          </label>
          <div aria-label='Filtrar por estado' className={styles.statusFilters} role='group'>
            {STATUS_FILTERS.map((f) => (
              <button
                aria-pressed={statusFilter === f.id}
                className={`${styles.statusChip} ${statusFilter === f.id ? styles.statusChipActive : ''}`}
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                type='button'
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && !result
        ? <WidgetError onRetry={refetch} />
        : (
          <>
            <div className={styles.table} role='table'>
              <div className={styles.headRow} role='row'>
                <span className={styles.cellCode}>Pedido</span>
                <span className={styles.cellProduct}>Producto</span>
                <span className={styles.cellDate}>Fecha</span>
                <span className={styles.cellStatus}>Estado</span>
                <span className={styles.cellPrice}>Total</span>
              </div>
              {renderRows()}
            </div>

            {pageCount > 1 && (
              <div className={styles.pagination}>
                <Pagination
                  currentPage={page}
                  handleNextPage={() => setPage((p) => Math.min(p + 1, pageCount))}
                  handleOnClick={(p) => setPage(p)}
                  handlePrevPage={() => setPage((p) => Math.max(p - 1, 1))}
                  isVisableButtonLeft
                  isVisableButtonRight
                  isVisableButtons
                  items={pageItems}
                  size='sm'
                />
              </div>
            )}
          </>
          )}
    </section>
  )
}

RecentOrders.propTypes = {
  baseFilter: PropTypes.object.isRequired,
  currency: PropTypes.string
}
