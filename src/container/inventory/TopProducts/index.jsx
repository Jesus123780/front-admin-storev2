'use client'

import Image from 'next/image'
import { useTopProducts, useTopProductsMovements } from 'npm-pkg-hook'
import {
  Column,
  getGlobalStyle,
  Icon,
  numberFormat,
  Row,
  Section,
  Table,
  Text
} from 'pkg-components'
import PropTypes from 'prop-types'

import { formatCurrency } from '../dashboard/utils/format'
import styles from './styles.module.css'

const RANK_CLASSES = [
  styles.rankFirst,
  styles.rankSecond,
  styles.rankThird
]

const NUMBER_FORMAT_OPTIONS = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  style: 'decimal'
}

const FALLBACK_IMAGE = '/images/DEFAULTBANNER.png'

/**
 * Builds the table column definitions depending on whether revenue data is
 * available (sales mode) or only movement counts (inventory fallback).
 *
 * @param {boolean} salesMode - Whether sales (units + revenue) is shown.
 * @returns {Array<object>} Column descriptors for the Table component.
 */
const getTitles = (salesMode) => (
  salesMode
    ? [
        { name: 'Producto', key: 'productName', justify: 'flex-start', width: '60%' },
        { name: 'Ingresos', key: 'revenue', justify: 'flex-end', width: '40%' }
      ]
    : [
        { name: 'Producto', key: 'productName', justify: 'flex-start', width: '70%' },
        { name: 'Ventas', key: 'totalMovements', justify: 'flex-end', width: '30%' }
      ]
)

/**
 * Best-selling products widget.
 *
 * When a `filter` is supplied it uses real completed-sales data (units sold and
 * revenue) via `useTopProducts`. Without a filter it preserves the original
 * inventory behavior, ranking by outgoing stock movements via
 * `useTopProductsMovements`, so existing usages keep working unchanged.
 *
 * @param {object} props - Component props.
 * @param {string} [props.className] - Optional wrapper class.
 * @param {object} [props.filter] - DashboardFilterInput. Enables sales mode.
 * @param {('units'|'revenue')} [props.sortBy] - Ranking criterion in sales mode.
 * @param {string} [props.currency] - ISO currency code for revenue display.
 * @returns {JSX.Element} The top products ranking.
 */
export const TopProductsList = ({ className = '', filter = null, sortBy = 'units', currency }) => {
  const salesMode = Boolean(filter)

  // Hooks must be called unconditionally; only the active result is consumed.
  const salesFilter = salesMode ? { ...filter, sortBy } : {}
  const [salesData, salesState] = useTopProducts(salesMode ? salesFilter : {})
  const [movementsData, movementsState] = useTopProductsMovements()

  const loading = salesMode ? salesState.loading : movementsState.loading
  const error = salesMode ? salesState.error : movementsState.error
  const rawProducts = salesMode ? salesData : movementsData
  const products = Array.isArray(rawProducts) ? rawProducts : []
  const titles = getTitles(salesMode)

  const renderEmptyState = () => (
    <div className={styles.stateBox}>
      <Icon color={getGlobalStyle('--color-icons-gray-light')} icon='IconSales' size={32} />
      <Text as='p' className={styles.stateText} size='md'>
        Aún no hay ventas registradas para generar un ranking.
      </Text>
    </div>
  )

  const renderErrorState = () => (
    <div className={styles.stateBox} role='alert'>
      <Icon color={getGlobalStyle('--color-icons-error')} icon='IconError' size={32} />
      <Text as='p' className={styles.stateText} size='md'>
        No pudimos cargar el ranking. Intenta nuevamente más tarde.
      </Text>
    </div>
  )

  /**
   * Renders the product rows or an empty state.
   *
   * @param {Array<object>} data - Rows supplied by the Table component.
   * @param {Array<object>} columnTitles - Column defs from the Table component.
   * @returns {JSX.Element[]} Rendered rows.
   */
  const renderProducts = (data, columnTitles) => {
    if (!Array.isArray(data) || data.length === 0) {
      return [<div key='empty'>{renderEmptyState()}</div>]
    }

    return data.map((product, index) => {
      const {
        idProduct,
        productName,
        totalMovements,
        unitsSold,
        revenue,
        image
      } = product || {}

      const rank = index + 1
      const rankClass = RANK_CLASSES[index] ?? styles.rankDefault

      const units = Number(salesMode ? unitsSold : totalMovements)
      const safeUnits = Number.isFinite(units) ? units : 0
      const formattedUnits = numberFormat(safeUnits, NUMBER_FORMAT_OPTIONS)
      const primaryValue = salesMode
        ? formatCurrency(revenue ?? 0, { currency })
        : formattedUnits
      const imageSrc = typeof image === 'string' && image.trim() !== '' ? image : FALLBACK_IMAGE

      return (
        <Section
          columnWidth={columnTitles}
          key={idProduct ?? `product-${index}`}
          odd={index % 2 === 1}
          padding={getGlobalStyle('--spacing-md')}
        >
          <Row alignItems='center' className={styles.productCell} gap='md'>
            <span aria-label={`Posición ${rank}`} className={`${styles.rankBadge} ${rankClass}`}>
              {rank}
            </span>

            <span className={styles.thumb}>
              <Image
                alt={productName ? `Imagen de ${productName}` : 'Imagen del producto'}
                className={styles.thumbImg}
                height={44}
                onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE }}
                src={imageSrc}
                unoptimized={imageSrc !== FALLBACK_IMAGE}
                width={44}
              />
            </span>

            <Text as='span' className={styles.productName} lineClamp={2} size='md' weight={600}>
              {productName || 'Producto sin nombre'}
            </Text>
          </Row>

          <Column alignItems='flex-end' className={styles.salesCell} gap='xs'>
            <Text as='span' className={styles.salesValue} size='lg' weight={700}>
              {primaryValue}
            </Text>
            <Text as='span' className={styles.salesLabel} size='sm'>
              {salesMode ? `${formattedUnits} uds vendidas` : 'unidades'}
            </Text>
          </Column>
        </Section>
      )
    })
  }

  return (
    <section
      aria-busy={loading}
      aria-label='Productos más vendidos'
      className={`${styles.wrapper} ${className}`.trim()}
    >
      <Column className={styles.header} gap='xs'>
        <Text as='h2' className={styles.title} size='xl' weight={700}>
          Productos destacados
        </Text>
        <Text as='p' className={styles.subtitle} size='md'>
          {salesMode
            ? (sortBy === 'revenue' ? 'Ranking por ingresos generados' : 'Ranking por unidades vendidas')
            : 'Ranking por unidades despachadas (salidas de inventario)'}
        </Text>
      </Column>

      {error
        ? renderErrorState()
        : (
          <div className={styles.tableContainer}>
            <Table
              data={products}
              header={false}
              loading={loading}
              renderBody={renderProducts}
              titles={titles}
            />
          </div>
          )}
    </section>
  )
}

TopProductsList.propTypes = {
  className: PropTypes.string,
  filter: PropTypes.object,
  sortBy: PropTypes.oneOf(['units', 'revenue']),
  currency: PropTypes.string
}
