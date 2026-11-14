'use client'
import React from 'react'
import { Icon } from 'pkg-components'
import type { PaymentMethod,SaleFinancials } from '../../types/order'
import { formatCOP } from '../helpers/order-format'
import { isCashPayment,isPositiveMoney } from '../helpers/order-financials'
import styles from './order-payments.module.css'
export type { PaymentMethod }
type Props={paymentMethod?:PaymentMethod|null;financials?:SaleFinancials|null;change?:unknown}
const ALLOWED_PAYMENT_ICONS=new Set(['IconWallet','IconVisa','IconMasterCard','IconVisaSimple','IconMasterCardSimple','IconTransfer','IconDollar'])
const OrderPayments:React.FC<Props>=({paymentMethod,financials,change})=>{
 const headingId=React.useId(),name=paymentMethod?.name?.trim()||'No registrado',icon=paymentMethod?.icon&&ALLOWED_PAYMENT_ICONS.has(paymentMethod.icon)?paymentMethod.icon:'IconWallet'
 const cash=isCashPayment(paymentMethod?.name),currency=financials?.currency||'COP',reportedChange=financials ? financials.exact?.change??financials.change : change
 return <section className={styles.container} aria-labelledby={headingId}><h2 id={headingId} className={styles.title}>Método de pago</h2><div className={styles.method}><span className={styles.icon} aria-hidden='true'><Icon icon={icon} size={26}/></span><div className={styles.info}><span className={styles.methodLabel}>Medio utilizado</span><strong className={styles.name}>{name}</strong></div></div><dl className={styles.details}><div><dt>Vuelto</dt><dd>{cash?formatCOP(reportedChange,currency):paymentMethod?.name?'No aplica':'No registrado'}</dd></div></dl>{!cash&&isPositiveMoney(reportedChange)&&<p className={styles.warning} role='status'>Hay un vuelto registrado que requiere revisión para este método de pago.</p>}</section>
}
export default React.memo(OrderPayments)
