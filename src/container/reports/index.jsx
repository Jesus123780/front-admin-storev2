import { Column } from 'pkg-components'
import React from 'react'
import { ChatStatistic } from '../ChatStatistic'
// import { LastedStatistic } from 'container/dashboard/LastedStatistic'
// import { SalesWeek } from 'container/dashboard/SalesWeek'
// import { ChatStatistic } from 'container/ChatStatistic'
// import { Container } from './styled'
// import { AboutUs } from '../dashboard/AboutUs'
// import { ChartAllSales } from '../ChartSales'

export const Reports = () => {
  console.log('Reports')
  return (
    <Column>
      <ChatStatistic />
      {/* <SalesWeek /> */}
      {/* <ChartAllSales /> */}
      {/* <LastedStatistic /> */}
      {/* <AboutUs /> */}
    </Column>
  )
}
