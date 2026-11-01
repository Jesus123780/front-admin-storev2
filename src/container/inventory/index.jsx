'use client'

import {
  useStockMovements,
  useTotalAllSales,
  useTotalProductsInStock,
  useTotalProductsSolded,
  useTotalSales,
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

const NUMBER_FORMAT_OPTIONS = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  style: 'decimal'
}

/**
 * Formats a date using the Spanish (Colombia) locale.
 *
 * @param {Date} date - Date to format.
 * @param {Intl.DateTimeFormatOptions} options - Formatting options.
 * @returns {string} Formatted date part.
 */
const formatDatePart = (date, options) => {
  return new Intl.DateTimeFormat('es-CO', options).format(date)
}

/**
 * Builds a readable date range for a seven-day inventory week.
 *
 * @param {string | number | Date} weekStart - First day of the week.
 * @returns {string} Formatted weekly range or an empty string for invalid dates.
 */
const getWeekRange = (weekStart) => {
  const startDate = new Date(weekStart)

  if (Number.isNaN(startDate.getTime())) return ''

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)

  const startDay = formatDatePart(startDate, { day: '2-digit' })
  const endDay = formatDatePart(endDate, { day: '2-digit' })
  const startMonth = formatDatePart(startDate, { month: 'long' })
  const endMonth = formatDatePart(endDate, { month: 'long' })

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDay} al ${endDay} ${endMonth}`
  }

  return `${startDay} ${startMonth} al ${endDay} ${endMonth}`
}

/**
 * Normalizes an API percentage value into a finite number.
 *
 * @param {string | number | null | undefined} value - Raw percentage value.
 * @returns {number | null} Parsed percentage or null when unavailable.
 */
const parsePercentage = (value) => {
  if (value === null || value === undefined || value === 'N/A') return null

  const parsedValue = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value).replace('%', '').trim())

  return Number.isFinite(parsedValue) ? parsedValue : null
}

/**
 * Inventory dashboard with sales KPIs, stock movement charts and product ranking.
 *
 * @returns {JSX.Element} Inventory dashboard.
 */
export const InventoryC = () => {
  const [stocksMovements] = useStockMovements()
  const [weeklyStockMovement] = useWeeklyStockMovement()
  const [totalSales] = useTotalSales()
  const [totalProductsInStock] = useTotalProductsInStock()
  const [totalProductSold] = useTotalProductsSolded()
  const [totalAllSales] = useTotalAllSales()
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    const updateScreenWidth = () => setScreenWidth(window.innerWidth)

    updateScreenWidth()
    window.addEventListener('resize', updateScreenWidth, { passive: true })

    return () => window.removeEventListener('resize', updateScreenWidth)
  }, [])

  const weeklyMovements = Array.isArray(weeklyStockMovement)
    ? weeklyStockMovement
    : []

  const visibleWeeklyMovements = weeklyMovements.filter((item) => {
    return item?.weekStart !== null &&
      item?.weekStart !== undefined &&
      !Number.isNaN(new Date(item.weekStart).getTime())
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
      value: numberFormat(totalSales ?? 0, NUMBER_FORMAT_OPTIONS),
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

      <section
        aria-label='Variación semanal de inventario'
        className={styles.weeklySection}
      >
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
              {visibleWeeklyMovements.map((item) => {
                const percentage = parsePercentage(item.percentageChange)
                const isPositive = percentage !== null && percentage > 0
                const isNegative = percentage !== null && percentage < 0
                const isNeutral = percentage === 0
                const weekRange = getWeekRange(item.weekStart)

                return (
                  <Column
                    className={styles.weekCard}
                    gap='sm'
                    key={String(item.weekStart)}
                  >
                    <Text as='p' className={styles.weekRange} size='sm' weight={600}>
                      {weekRange}
                    </Text>

                    {percentage === null
                      ? (
                        <Text as='p' className={styles.percentageNa} size='md' weight={600}>
                          Sin datos
                        </Text>
                        )
                      : (
                        <div
                          aria-label={
                            isPositive
                              ? `Subió ${percentage}%`
                              : isNegative
                                ? `Bajó ${Math.abs(percentage)}%`
                                : 'Sin variación'
                          }
                          className={`${styles.percentageRow} ${
                            isPositive
                              ? styles.percentagePositive
                              : isNegative
                                ? styles.percentageNegative
                                : styles.percentageNeutral
                          }`}
                        >
                          {!isNeutral && (
                            <Icon
                              color={getGlobalStyle(
                                isPositive
                                  ? '--color-icons-success'
                                  : '--color-icons-error'
                              )}
                              icon={isPositive ? 'IconUpRightArrow' : 'IconDownRightArrow'}
                              size={20}
                            />
                          )}
                          <Text as='span' size='lg' weight={700}>
                            {isPositive
                              ? `Subió ${percentage}%`
                              : isNegative
                                ? `Bajó ${Math.abs(percentage)}%`
                                : 'Sin variación'}
                          </Text>
                        </div>
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
