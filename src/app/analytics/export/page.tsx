'use client'

import {
  Column,
  getGlobalStyle
} from 'pkg-components'
import React from 'react'

import { ReportDownloadsPanel } from '@/container/reports/components/ReportDownloadsPanel'

const AnalyticsExport = () => {
  return (
    <Column
      style={{
        maxWidth: getGlobalStyle('--width-max-desktop'),
        margin: '0 auto',
        padding: getGlobalStyle('--spacing-md')
      }}
    >
      <ReportDownloadsPanel />
    </Column>
  )
}

export default AnalyticsExport
