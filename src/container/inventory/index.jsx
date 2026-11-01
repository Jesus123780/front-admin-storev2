'use client'
'use client'

import {
  useStockMovements,
  useTotalAllSales,
  useTotalProductsInStock,
  useTotalProductsSold as useTotalSalesSold,
  useTotalProductsSolded,
  useWeeklyStockMovement
} from 'npm-pkg-hook'
import {
  Column,
  getGlobalStyle,
  Icon,
  numberFormat,
  StockMovementsChart,
  Text
} from 'pkg-components'
import { useEffect, useState } from 'react'

import { ReportGrid } from './ReportGrid'
import styles from './styles.module.css'
import { TopProductsList } from './TopProducts'

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

  const weeklyMovements = Array.isArray(weeklyStockMovement)
    ? weeklyStockMovement
    : []

  const visibleWeeklyMovements = weeklyMovements.filter((item) => {
    return item?.weekStart !== null && item?.weekStart !== undefined
  })

  const data = [
    {
      label: 'Valor total de ventas',
      value: totalAllSales ?? 0,
      numberformat: true,
      icon: {
        icon: 'IconUpTrend',
        color: getGlobalStyle('--color-icons-success'),
        size: 28
      },
      className: styles.div1
    },
    {
      label: 'Total ventas concluidas',
      value: numberFormat(totalSales ?? 0, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        style: 'decimal'
      }),
      icon: {
        icon: 'IconUpTrend',
        color: getGlobalStyle('--color-icons-success'),
        size: 28
      },
      className: styles.div2
    },
    {
      label: 'Productos en inventario',
      value: totalProductsInStock ?? 0,
      icon: {
        icon: 'IconInventory',
        color: getGlobalStyle('--color-icons-warning'),
        size: 28
      },
      className: styles.div3
    },
    {
      label: 'Productos vendidos',
      value: totalProductSold ?? 0,
      icon: {
        icon: 'IconSales',
        color: getGlobalStyle('--color-icons-secondary'),
        size: 28
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
      <section aria-label='Variación semanal de inventario' className={styles.muvements_weks}>
        <Column className={styles.weeklyHeader} gap='xs'>
          <Text as='h2' className={styles.weeklyTitle} size='xl' weight={700}>
            Movimiento semanal
          </Text>
          <Text as='p' className={styles.weeklySubtitle} size='md'>
            Comparativa de variación respecto a la semana anterior
          </Text>
        </Column>

        {visibleWeeklyMovements.length === 0
          ? (
            <div className={styles.emptyState}>
              <Icon
                color={getGlobalStyle('--color-icons-gray-light')}
                icon='IconInventory'
                size={32}
              />
              <Text as='p' className={styles.emptyStateText} size='md'>
                Aún no hay movimientos semanales para mostrar.
              </Text>
            </div>
            )
          : (
            <div className={styles.weeklyGrid}>
              {visibleWeeklyMovements.map((item, index) => {
                const percentage = item.percentageChange
                const isNA = percentage === 'N/A'
                const numericPercentage = parseFloat(percentage)
                const isPositive = !isNA && numericPercentage > 0

                const weekStartDate = new Date(item.weekStart)
                const weekEndDate = new Date(weekStartDate)
                weekEndDate.setDate(weekStartDate.getDate() + 6)

                const formatDay = (date) => { return date.toLocaleDateString('es-ES', { day: '2-digit' }) }
                const formatMonth = (date) => { return date.toLocaleDateString('es-ES', { month: 'long' }) }
                const weekRange = weekStartDate.getMonth() === weekEndDate.getMonth()
                  ? `${formatDay(weekStartDate)} al ${formatDay(weekEndDate)} ${formatMonth(weekEndDate)}`
                  : `${formatDay(weekStartDate)} ${formatMonth(weekStartDate)} al ${formatDay(weekEndDate)} ${formatMonth(weekEndDate)}`

                return (
                  <Column className={styles.card} gap='sm' key={index}>
                    <Text as='p' className={styles.weekRange} size='sm' weight={600}>
                      {weekRange}
                    </Text>
                    {isNA
                      ? (
                        <Text as='p' className={styles.percentageNa} size='md' weight={600}>
                          Sin datos
                        </Text>
                        )
                      : (
                        <Text
                          as='p'
                          className={`${styles.percentageRow} ${isPositive ? styles.percentagePositive : styles.percentageNegative}`}
                          size='lg'
                          weight={700}
                        >
                          <Icon
                            color={isPositive
                              ? getGlobalStyle('--color-icons-success')
                              : getGlobalStyle('--color-icons-error')}
                            icon={isPositive ? 'IconUpRightArrow' : 'IconDownRightArrow'}
                            size={20}
                          />
                          {isPositive
                            ? `Subió ${numericPercentage}%`
                            : `Bajó ${Math.abs(numericPercentage)}%`}
                        </Text>
                        )}
                  </Column>
                )
              })}
            </div>
            )}
      </section>

      <TopProductsList className={styles.top} />
    </div>
  )
}
