'use client'
import { memo } from 'react'
import type { SoldExtra } from './order-item.types'
import type { SaleCalculatedLine } from '../../types/order'
import { extraSubtotal, label } from './order-item.utils'
import { getLineExtras, isPositiveMoney, validQuantity } from '../helpers/order-financials'
import { formatCOP } from '../helpers/order-format'
import styles from './order-item-details.module.css'
export const OrderItemExtras=memo(function OrderItemExtras({extras,line,currency='COP'}:{extras:SoldExtra[];line?:SaleCalculatedLine;currency?:string}) {
 const selected=extras.filter(e=>validQuantity(e.quantity)!==0),byId=getLineExtras(line)
 const counts=new Map<string,number>(); for(const e of selected){if(e.exPid)counts.set(e.exPid,(counts.get(e.exPid)??0)+1)}
 if(!selected.length)return null
 return <section className={styles.section}><h4 className={styles.title}>Complementos</h4><ul className={styles.extras}>{selected.map((extra,i)=>{const qty=validQuantity(extra.quantity),detail=extra.exPid&&counts.get(extra.exPid)===1?byId.get(extra.exPid):undefined,match=detail&&detail.quantity===qty?detail:undefined;return <li className={styles.extra} key={`${extra.exPid??'extra'}-${i}`}><div><span>{label(extra.extraName,'Complemento')}</span><small>{qty??'—'} × {formatCOP(extra.extraPrice,currency)}</small></div><div className={styles.extraValue}>{match&&isPositiveMoney(match.discountAmount)&&<del>{formatCOP(match.gross,currency)}</del>}<strong>{formatCOP(match?match.net:extraSubtotal(extra),currency)}</strong>{!match&&<small>Registrado</small>}</div></li>})}</ul></section>
})
