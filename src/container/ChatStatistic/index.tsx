'use client'

import { memo } from 'react'
import styled from 'styled-components'
import {
  Skeleton,
  BarChat,
  HorizontalBarChart
} from 'pkg-components'
import { useChartData, useMobile } from 'npm-pkg-hook'

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
  } = useChartData({ })
  const showFilter = years?.length
  return (
    <div style={{ margin: '50px 0 0 0' }}>
      {loading ?
        <Skeleton height={300} margin={'20px 0'} />
        : !isMobile && <div title={labelTitle}>
          <ContainerSelect>
            <select onChange={e => {return setChartType(e.target.value)}} value={chartType}>
              <option value='line'>Gráfico de Líneas</option>
              <option value='bar'>Gráfico de Barras</option>
            </select>
            {!!showFilter &&
              <select onChange={e => {return handleChangeYear(e.target.value)}} value={chartTypeYear}>
                {years.map((year) => {
                  const currentYear = year == new Date().getFullYear()
                  return <option
                    defaultChecked={currentYear}
                    defaultValue={currentYear}
                    disabled={!year}
                    key={year}
                    name={year}
                    value={year}
                  >
                    {year}
                  </option>
                })}
              </select>
            }
          </ContainerSelect>
        

          <ContainChart>
            {chartType === 'bar' ? (
              <BarChat data={dataChart || []} options={options} />
            ) : (
              <HorizontalBarChart data={dataChart || []} options={options} />
            )}
          </ContainChart>
        </div>}
    </div>
  )
}
  
const ContainerSelect = styled.div`
    select {
    background-color: var(--color-base-white);
    border: 1px solid #cccccc;
    border-radius: 5px;
    font-size: 16px;
    padding: 10px;
    width: 200px;
  }
  
  select:focus {
    border-color: #333333;
    outline: none;
  }
  
  option {
    background-color: #f2f2f2;
    padding: 10px;
  }
  
  `
export const ChatStatistic = memo(ChatStatisticMemo)

const ContainChart = styled.div`
    background-color: var(--color-base-white);
    display: grid;
    grid-gap: 19px 12px;
    grid-template-columns: repeat( auto-fit,minmax(250px, 1fr) );
    margin: 10px 0;
    padding: 10px;
    position: relative;
    width: 100%;
`
