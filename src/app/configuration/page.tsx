'use client'

import { useRouter } from 'next/navigation'
import {
  Column,
  Divider,
  getGlobalStyle,
  Icon,
  Row,
  Text
} from 'pkg-components'
import React from 'react'

interface SettingOption {
  title: string
  description: string
  icon: string
  path: string
}

const options: SettingOption[] = [
  {
    title: 'Perfil del negocio',
    description: 'Administra los datos, el logo y la información de tu tienda.',
    icon: 'IconStore',
    path: '/merchant'
  },
  {
    title: 'Horarios',
    description: 'Define los horarios de atención de tu tienda.',
    icon: 'time',
    path: '/schedules'
  },
  {
    title: 'Roles y usuarios',
    description: 'Gestiona los usuarios y permisos del equipo.',
    icon: 'IconPlusUser',
    path: '/management'
  },
  {
    title: 'Notificaciones',
    description: 'Configura las notificaciones de nuevos pedidos y mensajes.',
    icon: 'IconNotification',
    path: '/configuration/notifications'
  }
]

const Configuration = () => {
  const router = useRouter()

  return (
    <Column
      style={{
        maxWidth: getGlobalStyle('--width-max-desktop'),
        margin: '0 auto',
        padding: getGlobalStyle('--spacing-md')
      }}
    >
      <Text as='h2' size='3xl' weight='semibold'>
        Configuración
      </Text>
      <Text as='p' size='md'>
        Administra las preferencias y los datos de tu tienda.
      </Text>

      <Divider marginTop={getGlobalStyle('--spacing-xl')} />

      <Column style={{ gap: getGlobalStyle('--spacing-md') }}>
        {options.map((option) => (
          <Row
            key={option.path}
            onClick={() => router.push(option.path)}
            style={{
              alignItems: 'center',
              cursor: 'pointer',
              gap: getGlobalStyle('--spacing-md'),
              padding: getGlobalStyle('--spacing-md'),
              border: `1px solid ${getGlobalStyle('--color-neutral-gray-light')}`,
              borderRadius: getGlobalStyle('--border-radius-sm')
            }}
          >
            <Icon
              icon={option.icon}
              size={28}
              color={getGlobalStyle('--color-icons-primary')}
            />
            <Column>
              <Text as='h3' size='lg' weight='semibold'>
                {option.title}
              </Text>
              <Text as='p' size='sm' color='gray-dark'>
                {option.description}
              </Text>
            </Column>
          </Row>
        ))}
      </Column>
    </Column>
  )
}

export default Configuration
