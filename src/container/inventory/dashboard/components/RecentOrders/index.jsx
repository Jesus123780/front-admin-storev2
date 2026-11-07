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
  useEffect,
  useMemo,
  useState
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
 * Normalizes the monetary fields returned by the recent-orders query.
 * `total` is treated as the subtotal before discounts and `netTotal` as
 * the final amount charged. The fallback keeps older API responses usable.
 *
 * @param {object} row - Order returned by the API.
 * @returns {{ subtotal: number, discount: number, netTotal: number }}
 */
const getOrderAmounts = (row) => {
  const subtotalValue = Number(row?.total)
  const discountValue = Number(row?.discountAmount)
  const subtotal = Number.isFinite(subtotalValue) ? subtotalValue : 0
  const discount = Number.isFinite(discountValue) ? Math.max(0, discountValue) : 0
  const netValue = Number(row?.netTotal)
  const netTotal = row?.netTotal !== null && row?.netTotal !== undefined && Number.isFinite(netValue)
    ? netValue
    : Math.max(0, subtotal - discount)

  return { subtotal, discount, netTotal }
}

/**
 * Builds the label for the discount method. For percentage discounts,
 * `discountAmount` is the monetary value discounted, so the percentage is
 * derived from the subtotal (e.g. $9,000 / $90,000 = 10%).
 *
 * @param {object} row - Order returned by the API.
 * @param {number} subtotal - Order subtotal before discount.
 * @param {number} discount - Monetary value discounted.
 * @returns {{ type: string, percentage: string, className: string } | null}
 */
const getDiscountMeta = (row, subtotal, discount) => {
  if (discount <= 0) return null

  const discountType = String(row?.discountType ?? '').toUpperCase()

  if (discountType === 'PERCENT') {
    const percentage = subtotal > 0
      ? new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format((discount / subtotal) * 100)
      : null

    return {
      type: 'Porcentaje',
      percentage: percentage ? `${percentage}%` : '',
      className: 'discountTypePercent'
    }
  }

  if (discountType === 'AMOUNT') {
    return {
      type: 'Valor fijo',
      percentage: '',
      className: 'discountTypeAmount'
    }
  }

  return {
    type: 'Descuento',
    percentage: '',
    className: 'discountTypeAmount'
  }
}

/**
 * Recent orders panel with debounced search, status quick-filters,
 * server-side pagination, and a responsive discount breakdown.
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

  // Reset pagination whenever the period, search, or status filter changes.
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

  // The API contract does not expose a status filter yet. This quick-filter
  // therefore applies to the rows on the current server-paginated page.
  const rows = statusFilter === 'all'
    ? allRows
    : allRows.filter((row) => String(row.statusState) === statusFilter)

  const total = result?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageItems = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index + 1),
    [pageCount]
  )

  const isInitialLoading = loading && !result

  const renderRows = () => {
    if (isInitialLoading) {
      return Array.from({ length: 4 }).map((_, index) => (
        <div
          aria-busy='true'
          className={styles.rowSkeleton}
          key={`sk-${index}`}
        />
      ))
    }

    if (rows.length === 0) {
      return (
        <div className={styles.empty}>
          <Icon
            color={getGlobalStyle('--color-icons-gray-light')}
            icon='IconListBullet'
            size={28}
          />
          <Text as='p' className={styles.emptyText} size='md'>
            {debouncedSearch || statusFilter !== 'all'
              ? 'No hay pedidos que coincidan con el filtro. Prueba limpiar la búsqueda.'
              : 'No hay pedidos en el periodo seleccionado.'}
          </Text>
        </div>
      )
    }

    return rows.map((row) => {
      const meta = getOrderStatusMeta(row.statusState) ?? { tone: 'neutral', label: 'Desconocido' }
      const { subtotal, discount, netTotal } = getOrderAmounts(row)
      const discountMeta = getDiscountMeta(row, subtotal, discount)

      return (
        <div className={styles.row} key={row.orderId} role='row'>
          <span className={styles.cellCode} data-label='Pedido' role='cell'>
            <Text as='span' size='sm' weight={600}>
              {row.code}
            </Text>
          </span>

          <span className={styles.cellProduct} data-label='Producto' role='cell'>
            <Text as='span' className={styles.productName} size='md'>
              {row.productSummary || 'Producto sin nombre'}
            </Text>
            {Number(row.extraItems) > 0 && (
              <Text as='span' className={styles.extra} size='sm'>
                +{row.extraItems} {Number(row.extraItems) === 1 ? 'producto' : 'productos'}
              </Text>
            )}
          </span>

          <span className={styles.cellDate} data-label='Fecha' role='cell'>
            <Text as='span' size='sm'>
              {formatDate(row.createdAt, {
                timezone: baseFilter?.timezone,
                dateStyleOptions: { day: '2-digit', month: 'short' }
              })}
            </Text>
          </span>

          <span className={styles.cellStatus} data-label='Estado' role='cell'>
            <span className={`${styles.badge} ${styles[`badge_${meta.tone}`] || styles.badge_neutral}`}>
              {meta.label}
            </span>
          </span>

          <span className={styles.cellDiscount} data-label='Descuento' role='cell'>
            {discountMeta
              ? (
                <>
                  <span className={styles.discountMeta}>
                    <span className={`${styles.discountType} ${styles[discountMeta.className]}`}>
                      {discountMeta.type}
                    </span>
                    {discountMeta.percentage && (
                      <Text as='span' className={styles.discountPercentage} size='xs'>
                        {discountMeta.percentage}
                      </Text>
                    )}
                  </span>
                  <Text as='span' className={styles.discountAmount} size='sm' weight={600}>
                    -{formatCurrency(discount, { currency })}
                  </Text>
                </>
                )
              : (
                <Text as='span' className={styles.noDiscount} size='sm'>
                  Sin descuento
                </Text>
                )}
          </span>

          <span className={styles.cellPrice} data-label='Total final' role='cell'>
            {discount > 0 && (
              <Text as='span' className={styles.originalTotal} size='xs'>
                <span className={styles.originalLabel}>Subtotal</span>
                {formatCurrency(subtotal, { currency })}
              </Text>
            )}
            <Text as='span' className={styles.finalTotal} size='md' weight={700}>
              {formatCurrency(netTotal, { currency })}
            </Text>
          </span>
        </div>
      )
    })
  }

  return (
    <section
      aria-busy={loading}
      aria-label='Pedidos recientes'
      className={styles.panel}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <Text as='h2' className={styles.title} size='xl' weight={700}>
            Pedidos recientes
          </Text>
          <Text as='p' className={styles.subtitle} size='sm'>
            Consulta el detalle de tus últimas ventas y descuentos aplicados.
          </Text>
        </div>

        <div className={styles.controls}>
          <label className={styles.search}>
            <Icon
              color={getGlobalStyle('--color-icons-gray-light')}
              icon='IconSearch'
              size={16}
            />
            <input
              aria-label='Buscar por código de pedido'
              className={styles.searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder='Buscar pedido…'
              type='search'
              value={searchInput}
            />
          </label>

          <div aria-label='Filtrar por estado' className={styles.statusFilters} role='group'>
            {STATUS_FILTERS.map((status) => (
              <button
                aria-pressed={statusFilter === status.id}
                className={`${styles.statusChip} ${statusFilter === status.id ? styles.statusChipActive : ''}`}
                key={status.id}
                onClick={() => setStatusFilter(status.id)}
                type='button'
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && !result
        ? <WidgetError onRetry={refetch} />
        : (
          <>
            <div className={styles.table} role='table' aria-label='Listado de pedidos recientes'>
              <div className={styles.headRow} role='row'>
                <span className={styles.cellCode} role='columnheader'>Pedido</span>
                <span className={styles.cellProduct} role='columnheader'>Producto</span>
                <span className={styles.cellDate} role='columnheader'>Fecha</span>
                <span className={styles.cellStatus} role='columnheader'>Estado</span>
                <span className={styles.cellDiscount} role='columnheader'>Descuento</span>
                <span className={styles.cellPrice} role='columnheader'>Total final</span>
              </div>
              {renderRows()}
            </div>

            {pageCount > 1 && (
              <div className={styles.pagination}>
                <Pagination
                  currentPage={page}
                  handleNextPage={() => setPage((current) => Math.min(current + 1, pageCount))}
                  handleOnClick={(nextPage) => setPage(nextPage)}
                  handlePrevPage={() => setPage((current) => Math.max(current - 1, 1))}
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
