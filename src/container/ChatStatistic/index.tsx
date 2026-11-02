'use client'

import {
 numberFormat, 
 useChartData, 
 useMobile 
} from 'npm-pkg-hook'
import {
  BarChat,
  HorizontalBarChart,
  Skeleton
} from 'pkg-components'
import { ChangeEvent,memo } from 'react'

import styles from './styles.module.css'

export const ChatStatisticMemo = () => {
  const { isMobile } = useMobile()
  const {
    loading,
    dataChart,
    chartTypeYear,
    labelTitle,
    years,
    options,
    setChartType,
    handleChangeYear,
    chartType,
    trendColor,
    summary
  } = useChartData({})
  const showFilter = years?.length > 0

  const onChartTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setChartType(e.target.value)
  }

  const onYearChange = (e: ChangeEvent<HTMLSelectElement>) => {
    handleChangeYear(e.target.value)
  }

  return (
    <div style={{ margin: '50px 0 0 0' }}>
      {loading ? (
        <Skeleton height={300} margin={'20px 0'} />
      ) : (
        !isMobile && (
          <div title={labelTitle}>
            <div className={styles.containerSelect}>
              <select onChange={onChartTypeChange} value={chartType}>
                <option value="line">Gráfico de Líneas</option>
                <option value="bar">Gráfico de Barras</option>
              </select>
              {showFilter && (
                <select onChange={onYearChange} value={chartTypeYear}>
                  {years.map((year: number) => {
                    const currentYear = year === new Date().getFullYear()
                    return (
                      <option
                        key={year}
                        value={year}
                        disabled={!year}
                        defaultChecked={currentYear}
                      >
                        {year}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            {summary && (
              <div className={styles.summary}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Total vendido</span>
                  <span className={styles.summaryValue}>
                    {numberFormat(summary.totalSales)}
                  </span>
                </div>

                {summary.bestMonth && (
                  <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Mejor mes</span>
                    <span className={styles.summaryValue}>
                      {summary.bestMonth.label} · {numberFormat(summary.bestMonth.value)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className={styles.containChart}>
              {chartType === 'bar' ? (
                <BarChat data={dataChart || []} options={options} color={trendColor} />
              ) : (
                <HorizontalBarChart data={dataChart || []} options={options} color={trendColor} />
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}

export const ChatStatistic = memo(ChatStatisticMemo)

ChatStatistic.displayName = 'ChatStatistic'