'use client'
import { Icon, Image } from 'pkg-components'
import { memo } from 'react'
import type { SaleCalculatedLine } from '../../types/order'
import type { OrderItemCart } from './order-item.types'
import { getItemAmounts, label, resolveImage } from './order-item.utils'
import { formatCOP } from '../helpers/order-format'
import { isPositiveMoney } from '../helpers/order-financials'
import { OrderItemDetails } from './order-item-details'
import styles from './order-item-row.module.css'
const OrderItemRow = memo(function OrderItemRow({item,line,currency='COP'}:{item:OrderItemCart;line?:SaleCalculatedLine;currency?:string}) {
 const product=item.products, {quantity,unit,original,free,subtotal}=getItemAmounts(item)
 // A verified aggregate is not authorization to attach a line to the wrong item.
 const match=line && line.id===item.shoppingCartId && line.quantity===quantity && line.free===free ? line : undefined
 const productName=label(product?.pName,'Producto sin nombre'), image=resolveImage(product?.ProImage)
 return <article className={styles.row} data-free={free}>
  <div className={styles.main}>
   <div className={styles.thumbnail}>{image?<Image src={image} alt={productName} className={styles.image} width='76' height='76'/>:<span className={styles.placeholder} aria-hidden='true'><Icon icon='IconBox' size={24} color='currentColor'/></span>}</div>
   <div className={styles.identity}><div className={styles.productHeading}><h3 className={styles.name}>{productName}</h3>{free&&<span className={styles.freeTag}>Cortesía</span>}</div>{product?.pCode&&<p className={styles.sku}>Ref. {product.pCode}</p>}<p className={styles.quantity}>{quantity??'—'} × {formatCOP(free?original:unit,currency)} <span>precio original por unidad</span></p></div>
   <div className={styles.priceWrapper}><span className={styles.priceLabel}>{match?'Neto del producto':'Bruto registrado · producto'}</span>{match&&isPositiveMoney(match.originalProductTotal)&& (free||match.productNet!==match.productGross)&&<del className={styles.originalPrice}>{formatCOP(match.originalProductTotal,currency)}</del>}<strong className={styles.price}>{formatCOP(match?match.productNet:subtotal,currency)}</strong></div>
  </div>
  {free&&<p className={styles.courtesyNotice}>✓ Producto principal de cortesía. Los complementos conservan sus importes registrados.</p>}
  {!match&&<p className={styles.unverified}>Desglose neto no verificado; se muestran datos registrados, sin distribuir descuentos.</p>}
  <OrderItemDetails item={item} line={match} currency={currency}/>
 </article>
})
export default OrderItemRow
