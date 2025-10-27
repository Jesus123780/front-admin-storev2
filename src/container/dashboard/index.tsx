'use client'

import React from 'react'

import { ComponentsContextProvider } from './context'
import { GridStackWrapper } from './helpers/GridStackWrapper'

export const Dashboard = () => {
  return (
    <ComponentsContextProvider>
      <GridStackWrapper />
    </ComponentsContextProvider>
  )
}
