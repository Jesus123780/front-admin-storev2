'use client'

import React from 'react'
import { Addons } from '../Addons'
import { ChatStatistic } from '../ChatStatistic'
import { Main } from '../main'
import { ComponentsContextProvider } from './context'
import { GridStackWrapper } from './helpers/GridStackWrapper'

export const Dashboard = () => {
  return (
    <ComponentsContextProvider>
      <GridStackWrapper />
        <Main />
        {/* <Addons />
        <ChatStatistic /> */}
    </ComponentsContextProvider>
  )
}
