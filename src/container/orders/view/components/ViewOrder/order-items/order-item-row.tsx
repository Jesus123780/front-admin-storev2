'use client'

import React from 'react'
import { Icon, Image } from 'pkg-components'
import type { ShoppingCart } from '../../types/order'
import { formatCOP, formatText } from '../helpers/order-format'
import styles from './order-item-row.module.css'

type Props = { item: ShoppingCart }

const OrderItemRow: React.FC<Props> = ({ item }) => {
  const product = item.products
  // La cantidad vendida es la del carrito, NO el stock del catálogo ProQuantity.
  const quantity = Number.isFinite(Number(item.cantProducts))
    ? Math.max(0, Number(item.cantProducts))
    : 0
  // Precio almacenado en la línea: evita mostrar un precio de catálogo actualizado.
  const recordedPrice = typeof item.priceProduct === 'number' && Number.isFinite(item.priceProduct)
    ? item.priceProduct
    : product?.ProPrice

  return (
    <article className={styles.row}>
      <div className={styles.thumbnail}>
        {product?.ProImage ? (
          <Image
            src={product.ProImage}
            alt={formatText(product?.pName, 'Producto')}
            className={styles.image}
            width="76"
            height="76"
          />
        ) : (
          <span aria-hidden="true" className={styles.placeholder}><Icon icon="IconBox" size={26} /></span>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{formatText(product?.pName, 'Producto sin nombre')}</h3>
        {product?.pCode && <p className={styles.sku}>Ref. {product.pCode}</p>}
        <div className={styles.bottom}>
          <span className={styles.quantity}>Cantidad: <strong>{quantity}</strong></span>
          <div className={styles.priceWrapper}>
            <span className={styles.priceLabel}>Precio registrado</span>
            <span className={styles.price}>{formatCOP(recordedPrice)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default React.memo(OrderItemRow)
