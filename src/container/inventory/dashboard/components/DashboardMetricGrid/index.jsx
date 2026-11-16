'use client'
import { useDashboardSummary } from 'npm-pkg-hook'
import PropTypes from 'prop-types'
import { getComparisonLabel, getCurrencySymbol } from '../../utils/format'
import { DashboardMetricCard } from '../DashboardMetricCard'
import { WidgetError } from '../WidgetError'
import styles from './styles.module.css'

export const DashboardMetricGrid = ({ filter, currency, periodLabel }) => {
  const [summary, { loading, error, refetch }] = useDashboardSummary(filter)
  const comparison = getComparisonLabel(filter?.preset)
  if (error && !summary) return <div className={styles.grid}><div className={styles.errorSpan}><WidgetError onRetry={refetch}/></div></div>
  const common = { loading: loading && !summary }
  return (
    <div className={styles.grid}>
      <DashboardMetricCard {...common} comparisonLabel={comparison} currencySymbol={getCurrencySymbol(currency)} featured iconName='IconDollar' isCurrency label={periodLabel ? `Ingresos totales - ${periodLabel}` : 'Ingresos totales'} metric={summary?.revenue} sparkline={summary?.revenueSparkline ?? []} value={summary?.revenue?.value}/>
      <DashboardMetricCard {...common} comparisonLabel={comparison} iconName='IconShopping' iconTone='blue' label='Total de pedidos' metric={summary?.orders} sparkline={summary?.ordersSparkline ?? []} value={summary?.orders?.value}/>
      <DashboardMetricCard {...common} iconName='IconInventory' iconTone='purple' label='Productos' metric={summary?.products} subtitle='Catálogo activo' value={summary?.products?.value}/>
      <DashboardMetricCard {...common} iconName='IconUser' iconTone='rose' label='Clientes activos' metric={summary?.activeCustomers} subtitle='Clientes activos registrados' value={summary?.activeCustomers?.value}/>
    </div>
  )
}
DashboardMetricGrid.propTypes = { filter: PropTypes.object.isRequired, currency: PropTypes.string, periodLabel: PropTypes.string }
