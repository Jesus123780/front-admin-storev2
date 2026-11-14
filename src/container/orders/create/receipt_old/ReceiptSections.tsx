'use client'

import {
 Icon, Image, numberFormat, Tag 
} from 'pkg-components'
import { useState } from 'react'

import styles from '../Prints.module.css'
import { formatQuantity } from './normalize'
import type {
 Amount, ReceiptClient, ReceiptFinancials, ReceiptPayment,ReceiptProduct, ReceiptStore 
} from './types'

export function ReceiptHeader({ store }: { store: ReceiptStore }) {
  const [failed, setFailed] = useState('')
  return <header className={styles.header}>
    <div className={styles.brandMark} aria-hidden='true'>{process.env.NEXT_PUBLIC_BUSINESS_TITLE} <span>·</span> POS</div>
    {store.logo && failed !== store.logo && <div className={styles.logoWrapper} onErrorCapture={() => setFailed(store.logo)}>
      <Image src={store.logo} alt={`Logo de ${store.name}`} className={styles.logo} />
    </div>}
    <h1 className={styles.storeName}>{store.name}</h1>
    <div className={styles.storeInfo}>
      {store.nit && <span>NIT: {store.nit}</span>}
      {store.address && <span>{store.address}</span>}
      {store.phone && <span>Tel. {store.phone}</span>}
    </div>
  </header>
}

export function Perforation() {
  return <div className={styles.perforation} aria-hidden='true'><span /></div>
}

export function ReceiptClientInfo({ client }: { client: ReceiptClient | null }) {
  if (!client) {return null}
  const fields = [['Nombre', client.name], ['Documento', client.document], ['Teléfono', client.phone], ['Dirección', client.address]].filter(([, value]) => value)
  return <section className={styles.clientBox} aria-label='Datos del cliente'>
    <h2 className={styles.eyebrow}>Datos del cliente</h2>
    <dl className={styles.clientGrid}>{fields.map(([label, value]) => <div key={label} className={styles.metaRow}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  </section>
}

function ReceiptItem({ item }: { item: ReceiptProduct }) {
  const courtesy = item.free && item.total === 0
  const discounted = !courtesy && item.discountAmount !== null && item.discountAmount > 0
  const showOriginal = (courtesy || discounted) && item.originalTotal !== null && item.total !== null && item.originalTotal > item.total
  return <li className={styles.product}>
    <div className={styles.productRow}>
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{item.name}</h3>
        <div className={styles.itemMeta}>
          <span>{formatQuantity(item.quantity)} × {numberFormat(item.unitPrice)}</span>
          {item.sku && <span className={styles.sku}>Ref. {item.sku}</span>}
          {courtesy && <Tag label='Cortesía' color='success' backgroundColor='success' variant='soft' rounded='full' textTransform='none' className={styles.courtesyTag} />}
        </div>
        {discounted && <span className={styles.discountText}>Descuento{item.originalTotal !== null && item.originalTotal > 0 && item.discountAmount !== null ? ` del ${Number((item.discountAmount / item.originalTotal * 100).toFixed(2))}%` : ''} · −{numberFormat(item.discountAmount)}</span>}
        {courtesy && <span className={styles.discountText}>Este producto fue marcado como gratis.</span>}
        {!item.free && item.total === 0 && item.originalTotal === 0 && <span className={styles.naturalZero}>Sin costo</span>}
      </div>
      <div className={styles.lineAmount}>
        {showOriginal && <del aria-label={`Precio original de la línea: ${numberFormat(item.originalTotal)}`}>{numberFormat(item.originalTotal)}</del>}
        <strong>{numberFormat(item.total)}</strong>
      </div>
    </div>
    {(item.extras.length > 0 || item.optionals.length > 0 || item.comment) && <div className={styles.addons}>
      {item.extras.length > 0 && <div className={styles.addonGroup}><h4 className={styles.addonHeading}>Complementos</h4><ul className={styles.extras} aria-label='Complementos seleccionados'>
        {item.extras.map(extra => <li className={styles.extraRow} key={extra.key}>
          <div><span className={styles.extraName}>{formatQuantity(extra.quantity)} × {extra.name}</span>{extra.quantity !== 1 && <span className={styles.extraMeta}>{numberFormat(extra.unitPrice)}/ud.</span>}</div>
          <span className={styles.extraAmount}>{!extra.inconsistentCourtesyPrice && extra.discountAmount !== null && extra.discountAmount > 0 && <del>{numberFormat(extra.originalTotal)}</del>}{numberFormat(extra.total)}</span>
        </li>)}
      </ul></div>}
      {item.optionals.length > 0 && <div className={styles.options} aria-label='Opciones seleccionadas'>
        {item.optionals.map(option => <div key={option.key} className={styles.optionGroup}>
          <h4>{option.name} <small>· {option.options.length} seleccionados</small></h4><ul>{option.options.map(sub => <li key={sub.key}>{sub.name}</li>)}</ul>
        </div>)}
      </div>}
      {item.comment && <p className={styles.comment}><strong>Nota: </strong>{item.comment}</p>}
    </div>}
  </li>
}

export function ReceiptProducts({ items }: { items: readonly ReceiptProduct[] }) {
  const units = items.every(item => item.quantity !== null) ? items.reduce((sum, item) => sum + (item.quantity ?? 0), 0) : null
  return <section className={styles.products} aria-label='Productos de la venta'>
    <div className={styles.productsHeader}><h2>Detalle de productos</h2><span>{units === null ? `${items.length} líneas` : `${units} ${units === 1 ? 'unidad' : 'unidades'}`}</span></div>
    <div className={styles.columns} aria-hidden='true'><span>Artículo / cantidad</span><span>Importe</span></div>
    {items.length ? <ul className={styles.productList}>{items.map(item => <ReceiptItem key={item.key} item={item} />)}</ul> : <p className={styles.empty}>No hay productos en esta venta.</p>}
  </section>
}

function MoneyRow({ label, value, subtract = false }: { label: string; value: Amount; subtract?: boolean }) {
  return <div className={styles.metaRow} data-saving={subtract}><dt>{label}</dt><dd>{subtract && value !== null ? '− ' : ''}{numberFormat(value)}</dd></div>
}

export function ReceiptSummary({ financials, payment, mode = 'preview' }: { financials: ReceiptFinancials; payment: ReceiptPayment; mode?: 'preview' | 'receipt' }) {
  const { total, productNet, extraNet, productGross, extraGross, appliedDiscount, courtesy, showBreakdown, reportedDiscountLabel } = financials
  return <section className={styles.summary} aria-label='Resumen de la venta'>
    <h2 className={styles.summaryHeading}>Resumen de compra</h2>
    <dl className={styles.summaryMeta}>
      {showBreakdown ? <>
        <MoneyRow label='Subtotal de productos' value={productGross} />
        <MoneyRow label='Complementos' value={extraGross} />
        {appliedDiscount !== null && appliedDiscount > 0 && <MoneyRow label='Descuento aplicado' value={appliedDiscount} subtract />}
        {courtesy !== null && courtesy > 0 && <MoneyRow label='Cortesías' value={courtesy} subtract />}
      </> : <>
        <MoneyRow label='Productos · importe neto' value={productNet} />
        <MoneyRow label='Complementos · importe neto' value={extraNet} />
        {reportedDiscountLabel && <div className={styles.metaRow}><dt>Descuento informado (no se resta de nuevo)</dt><dd>{reportedDiscountLabel}</dd></div>}
      </>}
    </dl>
    <div className={styles.totalBox}>
      <span className={styles.totalLabel}>{mode === 'preview' ? 'Total a pagar' : 'Total de la venta'} <small>COP</small></span>
      <strong className={styles.totalAmount}>{numberFormat(total)}</strong>
    </div>
    {(payment.name || payment.change !== null) && <div className={styles.paymentBox}>
      <div className={styles.paymentIdentity}>
        <span className={styles.paymentIcon} aria-hidden='true'><Icon icon={payment.kind === 'cash' ? 'IconDollar' : 'IconSales'} size={18} color='currentColor' /></span>
        <div className={styles.paymentText}><span>Método de pago</span><strong>{payment.name || 'No informado'}</strong></div>
      </div>
      {payment.change !== null && <dl className={styles.paymentChange}><MoneyRow label='Cambio' value={payment.change} /></dl>}
    </div>}
  </section>
}
