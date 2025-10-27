'use client'

import { Text } from 'pkg-components'
import React from 'react'

import { Devices } from '../../container/Devices'
import { TeamStore } from '../TeamStore'
import { ContentAddonsGrid } from './styled'

export const Addons = () => {
  const style = {
    margin: '20px 0'
  }

  return (
    <ContentAddonsGrid>
      <div style={style} title='Mi equipo'>
        <Text
          as='h3'
        >
          Mi equipo
        </Text>
        <TeamStore />
      </div>
      <div style={style} title='Dispositivos conectados'>
        <Text
          as='h3'
        >
          Dispositivos conectados
        </Text>
        <Devices />
      </div>
      <div style={style} title=''>
        <Text
          as='h3'
        >
          Nuestras Promo banners
        </Text>
      </div>
    </ContentAddonsGrid>
  )
}
