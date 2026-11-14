import {
  Column,
  Divider,
  getGlobalStyle,
  Icon,
  Row,
  Text
} from 'pkg-components'
import { memo } from 'react'

import type { Client, Store } from '../../types/order.ts'
import styles from './order-client-info.module.css'

type Props = {
  client: Client
  store: Store
  createdAt: string | null
}

const OrderClientInfo: React.FC<Props> = ({
  client = {
    clientName: '',
    clientLastName: '',
    clientNumber: '',
    ClientAddress: '',
    ccClient: ''
  },
  store = {
    description: '',
    emailStore: ''
  },
  createdAt = null
}) => {
  const {
    clientName,
    clientLastName,
    clientNumber,
    ClientAddress,
    ccClient
  } = client ?? {
    clientName: '',
    clientLastName: '',
    clientNumber: '',
    ClientAddress: '',
    ccClient: ''
  }

  const { description, emailStore } = store ?? { description: '', emailStore: '' }
  const empty = 'vacío'

  return (
    <section className={styles.container}>
      <div className={styles.row}>
        <Column>
          <Row alignItems='center' gap='sm'>
            <Icon icon='IconUser' size={20} />
            <Text size='sm' color='gray'>
              Información del cliente.
            </Text>
          </Row>
          <Text size='xl' weight='black'>
            {clientName}
          </Text>
          <Text size='xl' weight='black'>
            {clientLastName}
          </Text>
          <Divider
            borderTop
            marginBottom={getGlobalStyle('--spacing-sm')}
            marginTop={getGlobalStyle('--spacing-sm')}
          />
          <Column gap='sm'>
            <Row alignItems='center' gap='sm'>
              <Icon icon='IconPhone' size={20} />
              <Text font='light' size='sm' color='gray'>
                N° contacto:
              </Text>
            </Row>
            <Text>
              {clientNumber ?? empty}
            </Text>
          </Column>
          <Divider
            borderTop
            marginBottom={getGlobalStyle('--spacing-sm')}
            marginTop={getGlobalStyle('--spacing-sm')}
          />
          <Column gap='sm'>
            <Row alignItems='center' gap='sm'>
              <Icon icon='IconLocationMap2' size={20} />
              <Text font='light' size='sm' color='gray'>
                Dirección:
              </Text>
            </Row>
            <Text>
              {ClientAddress ?? empty}
            </Text>
          </Column>
          <Divider
            borderTop
            marginBottom={getGlobalStyle('--spacing-sm')}
            marginTop={getGlobalStyle('--spacing-sm')}
          />
          <Column gap='sm'>
            <Row alignItems='center' gap='sm'>
              <Icon icon='IconFingerPrint' size={20} />
              <Text font='light' size='sm' color='gray'>
                N° identificación:
              </Text>
            </Row>
            <Text>
              {ccClient ?? empty}
            </Text>
          </Column>

        </Column>
        <div className={styles.right}>
          <Column alignItems='flex-start'>
            <Row className={styles.smallLabel} alignItems='center' gap='sm'>
              <Icon icon='IconSimpleCalendar' size={20} /> Fecha de creación
            </Row>
            <Text>
              {createdAt}
            </Text>
          </Column>
        </div>
      </div>
      <Divider borderTop marginTop='0.6667rem' />
      <div className={styles.store}>
        <Row alignItems='center' gap='sm'>
          <Icon icon='IconStore' size={20} color={getGlobalStyle('--color-neutral-black')} />
          <Text size='sm' color='gray'>
            Información del comercio.
          </Text>
        </Row>
        <Divider
          marginBottom={getGlobalStyle('--spacing-2xl')}
          marginTop={getGlobalStyle('--spacing-2xl')}
        />
        <Column gap='sm'>
          <Row alignItems='center' gap='sm'>
            <Icon icon='IconInfo' size={20} />
            <Text font='light' size='sm' color='gray'>
              Descripción:
            </Text>
          </Row>
          <Text>
            {description ?? empty}
          </Text>
        </Column>

        <Divider
          marginBottom={getGlobalStyle('--spacing-sm')}
          marginTop={getGlobalStyle('--spacing-sm')}
        />
        <Column gap='sm'>
          <Row alignItems='center' gap='sm'>
            <Icon icon='IconEmail' size={20} />
            <Text font='light' size='sm' color='gray'>
              Correo electrónico:
            </Text>
          </Row>
          <Text>
            {emailStore ?? empty}
          </Text>
        </Column>
      </div>
    </section>
  )
}

export default memo(OrderClientInfo)
