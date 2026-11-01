'use client'

import Image from 'next/image'
import { useTopProductsMovements } from 'npm-pkg-hook'
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

import styles from './styles.module.css'

const RANK_CLASSES = [
  styles.rankFirst,
  styles.rankSecond,
  styles.rankThird
]

const TABLE_TITLES = [
  { name: 'Producto', key: 'productName', justify: 'flex-start', width: '70%' },
  { name: 'Ventas', key: 'totalMovements', justify: 'flex-end', width: '30%' }
]

const NUMBER_FORMAT_OPTIONS = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  style: 'decimal'
}

/**
 * Displays the ranking of best-selling products based on stock OUT movements.
 *
 * @param {object} props - Component props.
 * @param {string} [props.className] - Optional wrapper class for layout control.
 * @returns {JSX.Element} The top products ranking.
 */
export const TopProductsList = ({ className = '' }) => {
  const [topProducts, { loading, error }] = useTopProductsMovements()
  const products = Array.isArray(topProducts) ? topProducts : []

  const renderEmptyState = () => {
    return (
      <div className={styles.stateBox}>
        <Icon
          color={getGlobalStyle('--color-icons-gray-light')}
          icon='IconSales'
          size={32}
        />
        <Text as='p' className={styles.stateText} size='md'>
          Aún no hay ventas registradas para generar un ranking.
        </Text>
      </div>
    )
  }

  const renderErrorState = () => {
    return (
      <div className={styles.stateBox} role='alert'>
        <Icon
          color={getGlobalStyle('--color-icons-error')}
          icon='IconError'
          size={32}
        />
        <Text as='p' className={styles.stateText} size='md'>
          No pudimos cargar el ranking. Intenta nuevamente más tarde.
        </Text>
      </div>
    )
  }

  /**
   * Renders the table rows or the empty state when no products are available.
   *
   * @param {Array<object>} data - Product rows supplied by the Table component.
   * @param {Array<object>} titles - Column definitions supplied by the Table component.
   * @returns {JSX.Element[]} Rendered product rows.
   */
  const renderProducts = (data, titles) => {
    if (!Array.isArray(data) || data.length === 0) {
      return [<div key='empty'>{renderEmptyState()}</div>]
    }

    return data.map((product, index) => {
      const {
        idProduct,
        productName,
        totalMovements
      } = product || {}

      const rank = index + 1
      const rankClass = RANK_CLASSES[index] ?? styles.rankDefault
      const numericMovements = Number(totalMovements)
      const formattedMovements = numberFormat(
        Number.isFinite(numericMovements) ? numericMovements : 0,
        NUMBER_FORMAT_OPTIONS
      )

      return (
        <Section
          columnWidth={titles}
          key={idProduct ?? `product-${index}`}
          odd={index % 2 === 1}
          padding={getGlobalStyle('--spacing-md')}
        >
          <Row alignItems='center' className={styles.productCell} gap='md'>
            <span
              aria-label={`Posición ${rank}`}
              className={`${styles.rankBadge} ${rankClass}`}
            >
              {rank}
            </span>

            <span className={styles.thumb}>
              <Image
                alt={productName ? `Imagen de ${productName}` : 'Imagen del producto'}
                className={styles.thumbImg}
                height={44}
                src='/images/DEFAULTBANNER.png'
                width={44}
              />
            </span>

            <Text
              as='span'
              className={styles.productName}
              lineClamp={2}
              size='md'
              weight={600}
            >
              {productName || 'Producto sin nombre'}
            </Text>
          </Row>

          <Column alignItems='flex-end' className={styles.salesCell} gap='xs'>
            <Text as='span' className={styles.salesValue} size='lg' weight={700}>
              {formattedMovements}
            </Text>
            <Text as='span' className={styles.salesLabel} size='sm'>
              unidades
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
          Productos más vendidos
        </Text>
        <Text as='p' className={styles.subtitle} size='md'>
          Ranking por unidades despachadas (salidas de inventario)
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
              titles={TABLE_TITLES}
            />
          </div>
          )}
    </section>
  )
}

TopProductsList.propTypes = {
  className: PropTypes.string
}
