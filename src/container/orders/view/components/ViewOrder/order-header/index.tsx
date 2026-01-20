import {
  Column,
  CopyToClipboard,
  getGlobalStyle,
  Icon,
  Row,
  Text
} from 'pkg-components'
import React, { useContext } from 'react'

import { Context } from '@/context/Context'

import styles from './order-header.module.css'

type Props = {
  pCodeRef: string
  modalView: boolean
  status?: string
  createdAt?: string | null
  statusOrder: { name: string, backgroundColor: string, color: string }
}

const OrderHeader: React.FC<Props> = ({
  pCodeRef,
  status = 'DESCONOCIDO',
  createdAt,
  modalView = false,
  statusOrder
}) => {
  const { sendNotification } = useContext(Context)

  if (modalView) {
    return (
      <Column as='header' gap='md' style={{ padding: getGlobalStyle('--spacing-2xl') }}>
        <div className={styles.left}>
          <Row gap="md" alignItems='center'>
            <Text className={styles.title}>
              Orden
            </Text>
            <CopyToClipboard
              text={pCodeRef}
              onCopyError={() => { }}
              onCopySuccess={() => {
                sendNotification({
                  backgroundColor: 'success',
                  description: `El código ${pCodeRef} ha sido copiado al portapapeles.`,
                  title: 'Éxito',
                  position: 'top-left',
                })
              }}
            />
          </Row>
        </div>
        <div className={styles.right}>
          <Column gap='sm' justifyContent='flex-start' alignItems='flex-start'>
            <Column style={{
              backgroundColor: statusOrder.backgroundColor,
              color: statusOrder.color,
              width: 'fit-content'
            }}>
              <Text className={styles.badge}>
                {status}
              </Text>
            </Column>
          </Column>
        </div>
      </Column>
    )
  }

  return (
    <Row as='header' justifyContent='space-between' gap='md' style={{ padding: getGlobalStyle('--spacing-2xl') }}>
      <div className={styles.left}>
        <Row gap="md" alignItems='center'>
          <Text className={styles.title}>
            Orden
          </Text>
          <CopyToClipboard text={pCodeRef}
            onCopySuccess={() => {
              sendNotification({
                backgroundColor: 'success',
                description: `El código ${pCodeRef} ha sido copiado al portapapeles.`,
                title: 'Éxito'
              })
            }}
          />
        </Row>
      </div>
      <div className={styles.right}>
        <Column gap='sm' justifyContent='flex-end' alignItems='flex-end'>
          <Column style={{
            backgroundColor: statusOrder.backgroundColor,
            color: statusOrder.color,
            width: 'fit-content'
          }}>
            <Text className={styles.badge}>
              {status}
            </Text>
          </Column>
          {createdAt
            && (
              <Row alignItems='center' gap='sm' justifyContent='flex-end'>
                <Icon icon='IconSimpleCalendar' size={25} />
                <Text as='time' className={styles.time}>
                  {createdAt}
                </Text>
              </Row>
            )
          }
        </Column>
      </div>
    </Row>
  )
}

export default React.memo(OrderHeader)
