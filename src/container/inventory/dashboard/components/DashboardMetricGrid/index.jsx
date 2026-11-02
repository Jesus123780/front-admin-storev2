'use client'

import { useDashboardSummary } from 'npm-pkg-hook'
import PropTypes from 'prop-types'

import { getComparisonLabel, getCurrencySymbol } from '../../utils/format'
import { DashboardMetricCard } from '../DashboardMetricCard'
import { WidgetError } from '../WidgetError'
import styles from './styles.module.css'

/**
 * Top KPI row: revenue (featured), orders, products and active customers.
 * Each card shows its value, previous-period comparison and a sparkline.
 *
 * @param {object} props - Component props.
 * @param {object} props.filter - DashboardFilterInput for the active period.
 * @param {string} [props.currency] - ISO currency code for monetary KPIs.
 * @returns {JSX.Element} The KPI grid.
 */
export const DashboardMetricGrid = ({ filter, currency }) => {
  const [summary, { loading, error, refetch }] = useDashboardSummary(filter)
  const comparison = getComparisonLabel(filter?.preset)
  const currencySymbol = getCurrencySymbol(currency)
  const isInitialLoading = loading && !summary

  if (error && !summary) {
    return (
      <div className={styles.grid}>
        <div className={styles.errorSpan}>
          <WidgetError onRetry={refetch} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      <DashboardMetricCard
        comparisonLabel={comparison}
        currencySymbol={currencySymbol}
        featured
        iconName='IconDollar'
        isCurrency
        label='Ingresos totales'
        loading={isInitialLoading}
        metric={summary?.revenue}
        sparkline={summary?.revenueSparkline ?? []}
        value={summary?.revenue?.value ?? 0}
      />
      <DashboardMetricCard
        comparisonLabel={comparison}
        iconName='IconShopping'
        label='Total de pedidos'
        loading={isInitialLoading}
        metric={summary?.orders}
        sparkline={summary?.ordersSparkline ?? []}
        value={summary?.orders?.value ?? 0}
      />
      <DashboardMetricCard
        iconName='IconInventory'
        label='Productos'
        loading={isInitialLoading}
        metric={summary?.products}
        subtitle='Catálogo activo'
        value={summary?.products?.value ?? 0}
      />
      <DashboardMetricCard
        iconName='IconUser'
        label='Clientes activos'
        loading={isInitialLoading}
        metric={summary?.activeCustomers}
        subtitle='Clientes activos registrados'
        value={summary?.activeCustomers?.value ?? 0}
      />
    </div>
  )
}

DashboardMetricGrid.propTypes = {
  filter: PropTypes.object.isRequired,
  currency: PropTypes.string
}
