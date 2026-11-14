'use client'

import { Icon, Image, numberFormat, Tag } from 'pkg-components'
import { memo } from 'react'

import type { OrderItemCart } from './order-item.types'
import { getItemAmounts, label, resolveImage } from './order-item.utils'
import { OrderItemDetails } from './order-item-details'
import styles from './order-item-row.module.css'

const OrderItemRow = memo(function OrderItemRow({ item }: { item: OrderItemCart }) {
  const product = item.products
  const { quantity, unit, original, free, courtesy } = getItemAmounts(item)
  const productName = label(product?.pName, 'Producto sin nombre')
  const image = resolveImage(product?.ProImage)

  return (
    <article className={styles.row} data-free={free}>
      <div className={styles.thumbnail}>
        {image ? (
          <Image src={image} alt={productName} className={styles.image} width='76' height='76' />
        ) : (
          <span className={styles.placeholder} aria-hidden='true'>
            <Icon icon='IconBox' size={24} color='currentColor' />
          </span>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.productHeading}>
          <h3 className={styles.name}>{productName}</h3>
          {free && (
            <Tag className={styles.freeTag} label='Gratis' color='success' backgroundColor='success'
              variant='soft' size='sm' rounded='full' weight='semibold' textTransform='none' />
          )}
        </div>
        {product?.pCode && <p className={styles.sku}>Ref. {product.pCode}</p>}
        <div className={styles.bottom}>
          <span className={styles.quantity}>Cantidad: <strong>{quantity ?? '—'}</strong></span>
          <div className={styles.priceWrapper}>
            <span className={styles.priceLabel}>{free ? 'Precio cobrado por unidad' : 'Precio unitario'}</span>
            {courtesy && original !== null && <del className={styles.originalPrice}>{numberFormat(original)}</del>}
            <span className={styles.price} data-free={free}>{unit === null ? '—' : numberFormat(unit)}</span>
          </div>
        </div>
        {courtesy && (
          <p className={styles.courtesyNotice}>
            <span aria-hidden='true' className={styles.courtesyIcon}>✓</span>
            Este producto fue marcado como gratis.
          </p>
        )}
      </div>
      <div className={styles.detailSlot}><OrderItemDetails item={item} /></div>
    </article>
  )
})

export default OrderItemRow
