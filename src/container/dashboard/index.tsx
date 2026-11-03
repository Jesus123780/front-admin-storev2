'use client'

import React from 'react'

import { ComponentsContextProvider } from './context'
import { GridStackWrapper } from './helpers/GridStackWrapper'
import { SessionRefreshDebug } from './helpers/SessionRefreshDebug'

export const Dashboard = () => {
  return (
    <ComponentsContextProvider>
      {/* Panel de pruebas de refresh de sesión. Solo en desarrollo. */}
      {process.env.NODE_ENV === 'development' && <SessionRefreshDebug />}
      <GridStackWrapper />
    </ComponentsContextProvider>
  )
}
