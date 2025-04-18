'use client'

import React from 'react'
import { Addons } from '../Addons'
import { ChatStatistic } from '../ChatStatistic'
import { Main } from '../main'

export const Dashboard = () => {
  return (
    <div>
        <Main />
        <Addons />
        <ChatStatistic />
    </div>
  )
}
