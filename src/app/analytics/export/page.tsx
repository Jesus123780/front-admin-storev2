'use client'

import {
  Column,
  Divider,
  getGlobalStyle,
  Text
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
      <Text as='h2' size='3xl' weight='semibold'>
        Exportar reportes
      </Text>
      <Text as='p' size='md'>
        Selecciona el tipo de reporte que deseas descargar.
      </Text>
      <Divider marginTop={getGlobalStyle('--spacing-xl')} />
      <ReportDownloadsPanel />
    </Column>
  )
}

export default AnalyticsExport
