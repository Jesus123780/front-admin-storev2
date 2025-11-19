import {
  CounterAnimation,
  Divider,
  Image,
  numberFormat,
  Row,
  Text
} from 'pkg-components'
import React from 'react'

import type { ShoppingCart } from '../../types/order'
import styles from './order-item-row.module.css'

const ItemRow: React.FC<{ item: ShoppingCart }> = ({ item }) => {
  const p = item.products
  return (
    <div className={styles.row}>
      <div className={styles.thumb}>
        {p.ProImage
          ? <Image className={styles.image} src={p.ProImage} alt={p.pName} />
          : <div style={{ fontSize: 12 }}>No image</div>
        }
      </div>
      <div className={styles.info}>
        <Text font='light' size='4xl'>
          {p.pName}
        </Text>
        <div className={styles.meta}>
          <Row>
            <Text font='light' size='md'>
              Cantidad:
            </Text>
            <CounterAnimation
              number={Number(p.ProQuantity ?? 0)}
              size='1rem'
              numberformat={false}
            />
          </Row>
          <Divider />
          <span className={styles.price}>
            {numberFormat(p.ProPrice)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ItemRow)
