import React from 'react'
import { Column, getGlobalStyle } from 'pkg-components'
import { ChatStatistic } from '../ChatStatistic'
import { ReportDownloadsPanel } from '../ReportDownloadsPanel'

export const Reports = () => {
  return (
    <Column style={{
      maxWidth: getGlobalStyle('--width-max-desktop'),
      margin: '0 auto',
    }}>
      <ReportDownloadsPanel />
      <ChatStatistic />
    </Column>
  )
}
