import { Column, getGlobalStyle } from 'pkg-components'
import React from 'react'

import { ComponentsReports } from './components'
import { ComponentAnalyticsContextProvider } from './context'

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
