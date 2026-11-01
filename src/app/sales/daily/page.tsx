'use client'

import { Column, getGlobalStyle, Text } from 'pkg-components'
import React from 'react'

import { ChatStatistic } from '@/container/ChatStatistic'
import { SalesDay } from '@/container/main/components/main.salesDay'

const SalesDaily = () => {
  return (
    <Column
      style={{
        maxWidth: getGlobalStyle('--width-max-desktop'),
        margin: '0 auto',
        padding: getGlobalStyle('--spacing-md')
      }}
    >
      <Text as='h2' size='3xl' weight='semibold'>
        Ventas diarias
      </Text>
      <SalesDay />
      <ChatStatistic />
    </Column>
  )
}

export default SalesDaily
