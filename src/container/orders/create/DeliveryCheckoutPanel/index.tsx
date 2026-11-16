'use client'
import type { DeliveryCheckout, DeliveryMode } from 'npm-pkg-hook'
import { useId } from 'react'

import styles from './styles.module.css'
const labels: Record<DeliveryMode,string> = {
 NONE:'Retiro o consumo en local. No se cobra domicilio.', MERCHANT:'La tarifa entra en el cobro y es ingreso del comercio.', MERCHANT_EXTERNAL:'El comercio cobra el servicio y asume el costo del proveedor.', THIRD_PARTY_COLLECTED:'El comercio recauda y debe entregar la tarifa al proveedor.', THIRD_PARTY_DIRECT:'El cliente paga el domicilio directamente al proveedor.', MERCHANT_SUBSIDIZED:'El cliente no paga el domicilio; el comercio asume el costo.', MERCHANT_SUBSIDIZED_EXTERNAL:'El comercio cubre el costo del proveedor externo.'
}
const costModes = new Set(['MERCHANT','MERCHANT_EXTERNAL','MERCHANT_SUBSIDIZED','MERCHANT_SUBSIDIZED_EXTERNAL'])
function money(s: string) {const [w,d='00']=s.split('.');return '$ '+w.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+d.padEnd(2,'0')}
export function DeliveryCheckoutPanel({ checkout:c,disabled=false,compact=false }:{checkout:DeliveryCheckout;disabled?:boolean;compact?:boolean}) {
 const uid=useId(), m=c.method, t=c.totals
 const lock=disabled||c.loading
 return <section className={styles.panel} aria-label={compact?'Modalidad de entrega':undefined} aria-labelledby={compact?undefined:`${uid}-title`} aria-busy={c.loading||c.pending}>
  {!compact&&<header className={styles.header}><span className={styles.eyebrow}>ENTREGA</span><h3 id={`${uid}-title`}>Modalidad de domicilio</h3><p>Define quién recibe el dinero del envío.</p></header>}
  <fieldset disabled={lock} className={styles.fields}>
   <label htmlFor={`${uid}-method`}>Método de entrega</label><select id={`${uid}-method`} value={m?.id??''} onChange={e=>c.select(e.target.value)}><option value=''>Selecciona una modalidad</option>{c.methods.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
   {m&&<p className={styles.hint}>{labels[m.mode]}</p>}
   {m&&m.allowFeeOverride&&<div className={styles.field}><label htmlFor={`${uid}-fee`}>Tarifa que paga el cliente (COP)</label><input id={`${uid}-fee`} inputMode='decimal' placeholder='5000,00' value={c.draft.customerFee} onChange={e=>c.edit('customerFee',e.target.value)} /></div>}
   {m&&!m.allowFeeOverride&&m.mode!=='NONE'&&m.defaultFee!==null&&<div className={styles.line}><span>Tarifa configurada</span><strong>{money(m.defaultFee)}</strong></div>}
   {m?.providerType==='THIRD_PARTY'&&<><div className={styles.field}><label htmlFor={`${uid}-provider`}>Domiciliario o empresa externa</label><input id={`${uid}-provider`} maxLength={100} autoComplete='off' value={c.draft.providerName} onChange={e=>c.edit('providerName',e.target.value)} /></div><div className={styles.field}><label htmlFor={`${uid}-ref`}>Referencia del proveedor (opcional)</label><input id={`${uid}-ref`} maxLength={100} value={c.draft.providerRef} onChange={e=>c.edit('providerRef',e.target.value)} /></div></>}
   {m&&costModes.has(m.mode)&&<div className={styles.field}><label htmlFor={`${uid}-cost`}>Costo asumido por el comercio (opcional)</label><input id={`${uid}-cost`} inputMode='decimal' placeholder='Sin determinar' value={c.draft.providerCost} onChange={e=>c.edit('providerCost',e.target.value)} /><small>Es un costo, no un descuento de mercancía.</small></div>}
   {m&&(m.allowFeeOverride||costModes.has(m.mode))&&<small>Importes sin separadores de miles; máximo dos decimales.</small>}
  </fieldset>
  {(c.loading||c.pending)&&<p className={styles.status} role='status'><span className={styles.spinner} aria-hidden='true'/> {c.loading?'Consultando modalidades…':'Cotizando domicilio…'}</p>}
  {!c.loading&&!c.pending&&!c.ready&&<div className={styles.warning} role='status'>{c.blockingMessage}<button type='button' disabled={disabled} onClick={c.retry}>Actualizar modalidades</button></div>}
  {c.ready&&t&&<dl className={styles.summary}>
   {!compact&&<div className={styles.line}><dt>Neto de mercancía</dt><dd>{money(t.merchandiseNet)}</dd></div>}
   <div className={styles.line}><dt>Domicilio cobrado en POS</dt><dd>{money(t.posCharge)}</dd></div>
   {t.externalCharge!=='0.00'&&<div className={styles.line}><dt>Pago directo al proveedor</dt><dd>{money(t.externalCharge)}</dd></div>}
   {t.thirdPartyPayable!=='0.00'&&<div className={styles.line}><dt>Por entregar a terceros</dt><dd>{money(t.thirdPartyPayable)}</dd></div>}
   {t.merchantCost!==null&&t.merchantCost!=='0.00'&&<div className={styles.line}><dt>Costo de domicilio</dt><dd>{money(t.merchantCost)}</dd></div>}
   {t.merchantCost===null&&<small>Costo del servicio aún no determinado.</small>}
   {!compact&&<div className={styles.total}><dt>A cobrar en POS</dt><dd>{money(t.checkoutTotal)}</dd></div>}
   <div className={styles.line}><dt>Ingresos propios estimados*</dt><dd>{money(t.merchantRevenue)}</dd></div>
   {t.externalCharge!=='0.00'&&<div className={styles.line}><dt>Total que paga el cliente</dt><dd>{money(t.customerTotal)}</dd></div>}
   <small>*Antes de costos e impuestos; no es utilidad.</small>
  </dl>}
 </section>
}
