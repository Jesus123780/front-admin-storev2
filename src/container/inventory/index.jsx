'use client'

import { useState } from 'react'

import {
  DashboardHeader,
  DashboardMetricGrid,
  DashboardPeriodFilter,
  InventoryPerformance,
  RecentOrders,
  SalesByCategoryChart,
  SalesTrendChart
} from './dashboard/components'
import { useDashboardFilters } from './dashboard/hooks/useDashboardFilters'
import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from './dashboard/utils/format'
import styles from './styles.module.css'
import { TopProductsList } from './TopProducts'

/**
 * Commercial + inventory dashboard orchestrator.
 *
 * Owns the single filter model and composes the dashboard widgets: header,
 * global period selector, KPI grid, sales trend, sales-by-category, top
 * products and recent orders, plus the preserved inventory performance block.
 * Each widget owns its own remote state and loading/error/empty handling, so a
 * failure in one does not take down the rest of the page.
 *
 * @param {object} [props] - Component props.
 * @param {string} [props.timezone] - Business IANA timezone.
 * @param {string} [props.currency] - ISO currency code for monetary values.
 * @returns {JSX.Element} The dashboard.
 */
export const InventoryC = ({ timezone = DEFAULT_TIMEZONE, currency = DEFAULT_CURRENCY } = {}) => {
  const {
    preset,
    referenceDate,
    customRange,
    filter,
    periodLabel,
    activeFilterCount,
    selectPreset,
    setReferenceDate,
    applyCustomRange,
    clearFilters
  } = useDashboardFilters({ timezone })

  // Remounting the data widgets via a key is a simple, reliable refresh that
  // re-runs every query without threading refetch callbacks through each one.
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((key) => key + 1)

  return (
    <div className={styles.parent}>
      <DashboardHeader
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        onRefresh={refresh}
        periodLabel={periodLabel}
      />

      <div className={styles.toolbar}>
        <DashboardPeriodFilter
          customRange={customRange}
          onApplyCustomRange={applyCustomRange}
          onChangeReferenceDate={setReferenceDate}
          onSelectPreset={selectPreset}
          periodLabel={periodLabel}
          preset={preset}
          referenceDate={referenceDate}
          timezone={timezone}
        />
      </div>

      <DashboardMetricGrid currency={currency} filter={filter} key={`kpi-${refreshKey}`} periodLabel={periodLabel} />

      <div className={styles.chartsRow}>
        <div className={styles.trend}>
          <SalesTrendChart currency={currency} filter={filter} key={`trend-${refreshKey}`} />
        </div>
        <div className={styles.donut}>
          <SalesByCategoryChart   segmentGap={2.5} currency={currency} filter={filter} key={`cat-${refreshKey}`} />
        </div>
      </div>

      <div className={styles.listsRow}>
        <div className={styles.topProducts}>
          <TopProductsList currency={currency} filter={filter} key={`top-${refreshKey}`} sortBy='revenue' />
        </div>
        <div className={styles.recentOrders}>
          <RecentOrders baseFilter={filter} currency={currency} key={`orders-${refreshKey}`} />
        </div>
      </div>

      <InventoryPerformance filter={filter} key={`inv-${refreshKey}`} />
    </div>
  )
}
