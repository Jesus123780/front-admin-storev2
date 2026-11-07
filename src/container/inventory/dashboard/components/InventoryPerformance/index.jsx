'use client'

import { useRouter } from 'next/navigation'
import {
  useStockMovements,
  useTotalAllSales,
  useTotalProductsInStock,
  useTotalProductsSolded,
  useWeeklyStockMovement
} from 'npm-pkg-hook'
import {
  Column,
  getGlobalStyle,
  Icon,
  Text
} from 'pkg-components'
import PropTypes from 'prop-types'

import { ReportGrid } from '../../../ReportGrid'
import { StockMovementsChart } from '../StockMovementsChart'
import styles from './styles.module.css'

/**
 * Formats a date part using the Spanish (Colombia) locale.
 *
 * @param {Date} date - Date to format.
 * @param {Intl.DateTimeFormatOptions} options - Formatting options.
 * @returns {string} Formatted date part.
 */
const formatDatePart = (date, options) => new Intl.DateTimeFormat('es-CO', options).format(date)

/**
 * Builds a readable date range for a seven-day inventory week.
 *
 * @param {string | number | Date} weekStart - First day of the week.
 * @returns {string} Formatted weekly range or '' for invalid dates.
 */
const getWeekRange = (weekStart) => {
  const startDate = new Date(weekStart)
  if (Number.isNaN(startDate.getTime())) {return ''}

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
  if (value === null || value === undefined || value === 'N/A') {return null}
  const parsed = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value).replace('%', '').trim())
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Inventory performance section. Preserves the original inventory metrics
 * (weekly variation, product ranking source, KPIs) and renders stock movements
 * through the shared SVG {@link StockMovementsChart}, which now reacts to the
 * dashboard period filter: the selected range is forwarded to
 * `useStockMovements` so entradas, salidas y ajustes reflect that window.
 *
 * @param {object} [props] - Component props.
 * @param {object} [props.filter] - DashboardFilterInput from the period filter.
 * @returns {JSX.Element} The inventory performance section.
 */
export const InventoryPerformance = ({ filter }) => {
  const router = useRouter()
  const [stocksMovements] = useStockMovements(filter)
  const [weeklyStockMovement] = useWeeklyStockMovement()
  const [totalProductsInStock] = useTotalProductsInStock()
  const [totalProductSold] = useTotalProductsSolded()
  const [totalAllSales] = useTotalAllSales()

  const weeklyMovements = Array.isArray(weeklyStockMovement) ? weeklyStockMovement : []
  const visibleWeeklyMovements = weeklyMovements.filter((item) => {
    return item?.weekStart !== null &&
      item?.weekStart !== undefined &&
      !Number.isNaN(new Date(item.weekStart).getTime())
  })

  const kpis = [
    {
      label: 'Valor total de ventas concluidas',
      value: totalAllSales ?? 0,
      numberformat: true,
      icon: { icon: 'IconUpTrend', color: getGlobalStyle('--color-icons-success'), size: 28 }
    },
    {
      label: 'Unidades en inventario',
      value: totalProductsInStock ?? 0,
      icon: { icon: 'IconInventory', color: getGlobalStyle('--color-icons-warning'), size: 28 },
      // Al hacer clic se abre el detalle navegable de este KPI: todos los
      // productos y complementos que se manejan por inventario y tienen stock.
      actionIcon: 'IconUpRightArrow',
      onClick: () => router.push('/products/units')
    },
    {
      label: 'Unidades despachadas',
      value: totalProductSold ?? 0,
      icon: { icon: 'IconSales', color: getGlobalStyle('--color-icons-secondary'), size: 28 }
    }
  ]

  return (
    <section aria-label='Rendimiento del inventario' className={styles.section}>
      <Column className={styles.sectionHeader} gap='xs'>
        <Text as='h2' className={styles.sectionTitle} size='xl' weight={700}>
          Rendimiento del inventario
        </Text>
        <Text as='p' className={styles.sectionSubtitle} size='md'>
          Métricas de stock, entradas y salidas de inventario
        </Text>
      </Column>

      <div className={styles.kpiGrid}>
        <ReportGrid data={kpis} />
      </div>

      <StockMovementsChart
        chartData={stocksMovements}
        className={styles.graphics}
        timezone={filter?.timezone}
        title='Entradas y Salidas de Inventario por día'
      />

      <div aria-label='Variación semanal de inventario' className={styles.weeklySection}>
        <Column className={styles.weeklyHeader} gap='xs'>
          <Text as='h3' className={styles.weeklyTitle} size='lg' weight={700}>
            Movimiento semanal
          </Text>
          <Text as='p' className={styles.weeklySubtitle} size='md'>
            Comparativa de salidas de inventario respecto a la semana anterior
          </Text>
        </Column>

        {visibleWeeklyMovements.length === 0
          ? (
            <div className={styles.emptyState}>
              <Icon color={getGlobalStyle('--color-icons-gray-light')} icon='IconInventory' size={32} />
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
                  <Column className={styles.weekCard} gap='sm' key={String(item.weekStart)}>
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
                              color={getGlobalStyle(isPositive ? '--color-icons-success' : '--color-icons-error')}
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
      </div>
    </section>
  )
}

InventoryPerformance.propTypes = {
  filter: PropTypes.object
}
