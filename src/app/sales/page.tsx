'use client'

import { Column, getGlobalStyle } from 'pkg-components'
import React from 'react'

import { ChatStatistic } from '@/container/ChatStatistic'

const Sales = () => {
  return (
    <Column
      style={{
        maxWidth: getGlobalStyle('--width-max-desktop'),
        margin: '0 auto',
        padding: getGlobalStyle('--spacing-md')
      }}
    >
      <ChatStatistic />
    </Column>
  )
}

export default Sales
