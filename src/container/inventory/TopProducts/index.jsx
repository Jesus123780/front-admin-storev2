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
import React from 'react'

import styles from './styles.module.css'

const RANK_COLORS = [
  getGlobalStyle('--color-campaigns-yellow'),
  getGlobalStyle('--color-neutral-gray-silver'),
  getGlobalStyle('--color-campaigns-orange')
]

const TABLE_TITLES = [
  { name: 'Producto', key: 'productName', justify: 'flex-start', width: '70%' },
  { name: 'Ventas', key: 'totalMovements', justify: 'flex-end', width: '30%' }
]

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

  return (
    <section
      aria-label='Productos más vendidos'
      className={`${styles.wrapper} ${className}`}
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
        ? (
          <div className={styles.stateBox} role='alert'>
            <Icon
              color={getGlobalStyle('--color-icons-error')}
              icon='IconInventory'
              size={32}
            />
            <Text as='p' className={styles.stateText} size='md'>
              No pudimos cargar el ranking. Intenta nuevamente más tarde.
            </Text>
          </div>
          )
        : (
          <Table
            data={products}
            header={false}
            loading={loading}
            renderBody={(data, titles) => {
              if (!data?.length) {
                return [(
                  <div className={styles.stateBox} key='empty'>
                    <Icon
                      color={getGlobalStyle('--color-icons-gray-light')}
                      icon='IconSales'
                      size={32}
                    />
                    <Text as='p' className={styles.stateText} size='md'>
                      Aún no hay ventas registradas para generar un ranking.
                    </Text>
                  </div>
                )]
              }

              return data.map((product, index) => {
                const {
                  idProduct,
                  productName,
                  totalMovements
                } = product || {}

                const rank = index + 1
                const rankColor = RANK_COLORS[index] ?? getGlobalStyle('--color-neutral-gray')
                const isTopThree = index < 3

                return (
                  <Section
                    columnWidth={titles}
                    key={idProduct ?? `product-${index}`}
                    odd={index % 2 === 1}
                    padding={getGlobalStyle('--spacing-md')}
                  >
                    <Row alignItems='center' gap='md'>
                      <span
                        aria-hidden='true'
                        className={styles.rankBadge}
                        style={{
                          backgroundColor: isTopThree ? rankColor : getGlobalStyle('--color-neutral-gray-light'),
                          color: isTopThree ? getGlobalStyle('--color-text-black') : getGlobalStyle('--color-text-gray-light')
                        }}
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

                    <Column alignItems='flex-end' gap='xs'>
                      <Text as='span' className={styles.salesValue} size='lg' weight={700}>
                        {numberFormat(totalMovements ?? 0, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                          style: 'decimal'
                        })}
                      </Text>
                      <Text as='span' className={styles.salesLabel} size='sm'>
                        unidades
                      </Text>
                    </Column>
                  </Section>
                )
              })
            }}
            titles={TABLE_TITLES}
          />
          )}
    </section>
  )
}

TopProductsList.propTypes = {
  className: PropTypes.string
}
