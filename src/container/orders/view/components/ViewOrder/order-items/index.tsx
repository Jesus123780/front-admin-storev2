'use client'
import { memo,useMemo } from 'react'
import type { OrderItemCart } from './order-item.types'
import type { SaleFinancials } from '../../types/order'
import { getVerifiedLines, validQuantity } from '../helpers/order-financials'
import OrderItemRow from './order-item-row'
import styles from './order-items.module.css'
const OrderItems=memo(function OrderItems({items,financials}:{items?:(OrderItemCart|null)[]|null;financials?:SaleFinancials|null}){
 const rows=(items??[]).filter((i):i is OrderItemCart=>i!=null),counts=rows.map(i=>validQuantity(i.cantProducts))
 const count=counts.some(i=>i===null)?null:counts.reduce<number>((sum,i)=>sum+(i??0),0)
 const lines=useMemo(()=>getVerifiedLines(financials),[financials])
 const ids=new Set<string>(),duplicates=new Set<string>();for(const row of rows){if(ids.has(row.shoppingCartId))duplicates.add(row.shoppingCartId);ids.add(row.shoppingCartId)}
 return <section className={styles.container} aria-label='Productos de la orden'><header className={styles.header}><div className={styles.heading}><h2 className={styles.title}>Productos</h2><p className={styles.subtitle}>Importes de la venta y complementos seleccionados</p></div><span className={styles.counter}>{count===null?`${rows.length} artículos`:`${count} ${count===1?'unidad':'unidades'}`}</span></header>{rows.length?<ul className={styles.list}>{rows.map((item,i)=><li className={styles.listItem} key={`${item.shoppingCartId}-${i}`}><OrderItemRow item={item} line={duplicates.has(item.shoppingCartId)?undefined:lines.get(item.shoppingCartId)} currency={financials?.currency}/></li>)}</ul>:<p className={styles.empty}>No hay productos registrados en esta orden.</p>}</section>
})
export default OrderItems
