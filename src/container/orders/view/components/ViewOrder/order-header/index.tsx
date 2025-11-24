import {
  Column,
  CopyToClipboard,
  getGlobalStyle,
  Icon,
  Row,
  Text
} from 'pkg-components'
import React from 'react'

import styles from './order-header.module.css'

type Props = {
  pCodeRef: string
  status?: string
  createdAt?: string | null
  statusOrder: { name: string, backgroundColor: string, color: string }
}

const OrderHeader: React.FC<Props> = ({
  pCodeRef,
  status = 'DESCONOCIDO',
  createdAt,
  statusOrder
}) => {

  return (
    <Row as='header' justifyContent='space-between' gap='md' style={{ padding: getGlobalStyle('--spacing-2xl') }}>
      <div className={styles.left}>
        <Row gap="md" alignItems='center'>
          <Text className={styles.title}>
            Orden
          </Text>
          <CopyToClipboard text={pCodeRef} />
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
