'use client'

import { memo, ChangeEvent } from 'react'
import {
  Skeleton,
  BarChat,
  HorizontalBarChart
} from 'pkg-components'
import { useChartData, useMobile } from 'npm-pkg-hook'
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
    chartType
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

            <div className={styles.containChart}>
              {chartType === 'bar' ? (
                <BarChat data={dataChart || []} options={options} />
              ) : (
                <HorizontalBarChart data={dataChart || []} options={options} />
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