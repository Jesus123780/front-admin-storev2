import React from 'react'
import { Column, getGlobalStyle } from 'pkg-components'
import { ComponentAnalyticsContextProvider } from './context'
import { ComponentsReports } from './components'

export const Reports = () => {
  return (
    <Column style={{
      maxWidth: getGlobalStyle('--width-max-desktop'),
      margin: '0 auto',
    }}>
      <ComponentAnalyticsContextProvider>
        <ComponentsReports />
      </ComponentAnalyticsContextProvider>
    </Column>
  )
}
