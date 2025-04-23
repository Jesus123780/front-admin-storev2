'use client'

import {
  useStockMovements,
  useWeeklyStockMovement,
  useTotalProductsSold as useTotalSalesSold,
  useTotalProductsSolded,
  useTotalProductsInStock,
  useTotalAllSales
} from 'npm-pkg-hook'
import { Column, getGlobalStyle, Icon, numberFormat, Row, StockMovementsChart, Text } from 'pkg-components'
import { ReportGrid } from './ReportGrid'
import styles from './styles.module.css'
import { useEffect, useState } from 'react'

export const InventoryC = () => {
  const [stocksMovements] = useStockMovements()
  const [weeklyStockMovement] = useWeeklyStockMovement()
  const [totalSales] = useTotalSalesSold()
  const [totalProductsInStock] = useTotalProductsInStock()
  const [totalProductSold] = useTotalProductsSolded()
  const [totalAllSales] = useTotalAllSales()
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth)
      const handleResize = () => { return setScreenWidth(window.innerWidth) }
      window.addEventListener('resize', handleResize)
      return () => { return window.removeEventListener('resize', handleResize) }
    }
  }, [])

  const data = [
    {
      label: 'Valor total de ventas',
      value: numberFormat(totalAllSales) ?? 0,
      icon: {
        icon: 'IconUpTrend',
        color: getGlobalStyle('--color-icons-success'),
        size: 40
      },
      className: styles.div1
    },
    {
      label: 'Total ventas concluidas',
      value: numberFormat(totalSales, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        style: 'decimal'
      }),
      icon: {
        icon: 'IconUpTrend',
        color: getGlobalStyle('--color-icons-success'),
        size: 40
      },
      className: styles.div2
    },
    {
      label: 'Productos en inventario',
      value: totalProductsInStock,
      icon: {
        icon: 'IconInventory',
        color: getGlobalStyle('--color-icons-warning'),
        size: 40
      },
      className: styles.div3
    },
    {
      label: 'Productos vendidos',
      value: totalProductSold,
      icon: {
        icon: 'IconSales',
        color: getGlobalStyle('--color-icons-primary'),
        size: 40
      },
      className: styles.div4
    }
  ]

  return (
    <div className={styles.parent}>
      <ReportGrid data={data} />
      <StockMovementsChart
        chartData={stocksMovements}
        className={styles.graphics}
        title='Entradas y Salidas de Inventario por día'
        width={screenWidth}
      />
      <div className={styles.muvements_weks}>
        <Row>
          {weeklyStockMovement.map((item, index) => {
            const percentage = item.percentageChange
            const isPositive = parseFloat(percentage) > 0
            const isNA = percentage === 'N/A'
            const isNotDate = item.weekStart === null
            if (isNotDate) return null

            const weekStartDate = new Date(item.weekStart)
            const weekEndDate = new Date(weekStartDate)
            weekEndDate.setDate(weekStartDate.getDate() + 6)

            const formatDate = (date) => { return date.toLocaleDateString('es-ES', { day: '2-digit' }) }
            const weekRange = weekStartDate.getMonth() === weekEndDate.getMonth()
              ? `${formatDate(weekStartDate)} al ${formatDate(weekEndDate)} ${weekEndDate.toLocaleDateString('es-ES', { month: 'long' })}`
              : `${formatDate(weekStartDate)} ${weekStartDate.toLocaleDateString('es-ES', { month: 'long' })} al ${formatDate(weekEndDate)} ${weekEndDate.toLocaleDateString('es-ES', { month: 'long' })}`

            return (
              <Column className={styles.card} key={index}>
                <p>{weekRange}</p>
                <p>
                  {isNA ? (
                    <Text className={styles.percentageNa}>Sin datos</Text>
                  ) : isPositive ? (
                    <Text className={styles.percentagePositive} size='lg'>
                      <Icon
                        color={getGlobalStyle('--color-icons-success')}
                        icon='IconUpRightArrow'
                        size={20}
                      />{' '}
                      Subió {percentage}%
                    </Text>
                  ) : (
                    <Text className={styles.percentageNegative} size='lg'>
                      <Icon
                        color={getGlobalStyle('--color-icons-error')}
                        icon='IconDownRightArrow'
                        size={20}
                      />{' '}
                      Bajó {Math.abs(percentage)}%
                    </Text>
                  )}
                </p>
              </Column>
            )
          })}
        </Row>

      </div>
    </div>
  )
}