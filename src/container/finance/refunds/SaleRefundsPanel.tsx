'use client'
import {
 type RefundDisposition, type RefundLineInput,useSaleRefundAccounting, useSaleRefunds 
} from 'npm-pkg-hook'
import { Text } from 'pkg-components'
import {
 useContext, useEffect, useMemo, useRef, useState 
} from 'react'

import { Context } from '../../../context/Context'
import styles from './SaleRefundsPanel.module.css'

const formatMinor = (minor: string) => {
  const n = BigInt(minor)
  const abs = n < 0n ? -n : n
  const digits = new Intl.NumberFormat('es-CO').format(abs / 100n)
  return `${n < 0n ? '-' : ''}$${digits},${String(abs % 100n).padStart(2, '0')}`
}

/** Pass the currently authenticated operator's OPEN cash-session ID. No client-supplied storeId. */
export function SaleRefundsPanel({ cashSessionId }: { cashSessionId?: string | null }) {
  const { sendNotification } = useContext(Context)
  const [saleReference, setSaleReference] = useState('')
  const [searched, setSearched] = useState('')
  const [reason, setReason] = useState('')
  const [scope, setScope] = useState<'FULL_REMAINING'|'SELECTED'>('SELECTED')
  const [defaultDisposition, setDefaultDisposition] = useState<RefundDisposition>('RESTOCK')
  const [quantities, setQuantities] = useState<Record<string,number>>({})
  const [dispositions, setDispositions] = useState<Record<string,RefundDisposition>>({})
  const [externalReference, setExternalReference] = useState('')
  const [confirmId, setConfirmId] = useState('')
  const [cancelId, setCancelId] = useState('')
  const [cashArmed, setCashArmed] = useState(false)
  const pendingAttempt = useRef<{ signature: string; key: string } | null>(null)
  const { preview, refunds, busy, loading, error, request, confirmExternal, cancel } = useSaleRefunds(searched)
  const accounting = useSaleRefundAccounting(searched)
  const cash = preview?.paymentKind === 'CASH'
  const selectedLines = useMemo<RefundLineInput[]>(() => (preview?.lines ?? []).flatMap(line => {
    const quantity = quantities[line.shoppingCartId] ?? 0
    return quantity > 0 ? [{ shoppingCartId: line.shoppingCartId, quantity,
      disposition: dispositions[line.shoppingCartId] ?? 'RESTOCK' }] : []
  }), [preview, quantities, dispositions])
  const disabled = busy || loading
  useEffect(() => { setCashArmed(false) }, [searched, scope, quantities, dispositions, reason, cashSessionId, defaultDisposition])
  async function submit() {
    if (!searched || !preview) {return}
    if (cash && !cashSessionId) {
      sendNotification({ title:'Caja requerida', description:'Abre una caja para entregar el reembolso en efectivo.', backgroundColor:'error' })
      return
    }
    const data = { saleReference: searched, scope, items:scope==='SELECTED'?selectedLines:null,
      defaultDisposition, cashSessionId:cash?cashSessionId:null, reason: reason.trim() }
    const signature = JSON.stringify(data)
    if (pendingAttempt.current && pendingAttempt.current.signature !== signature) {
      sendNotification({ title:'Verifica el intento anterior',description:'Antes de cambiar la devolución, confirma en el historial que la solicitud anterior no fue registrada.',backgroundColor:'error' })
      return
    }
    const attempt = pendingAttempt.current ?? { signature,key:crypto.randomUUID() }
    pendingAttempt.current = attempt
    try {
      const refund = await request({ ...data,idempotencyKey: attempt.key })
      pendingAttempt.current = null
      setCashArmed(false)
      void accounting.refetch().catch(() => undefined)
      sendNotification({ title: refund.status==='COMPLETED'?'Devolución confirmada':'Devolución solicitada',
        description:refund.status==='COMPLETED'?'El dinero y el inventario se registraron.':'Pendiente de comprobar el abono externo. No se ha contabilizado como reembolsado.',
        backgroundColor:'success' })
    } catch (caught) {
      const code = (caught as {graphQLErrors?: Array<{extensions?:{code?:string}}>} | null)?.graphQLErrors?.[0]?.extensions?.code
      if (typeof code === 'string' && code.startsWith('REFUND_')) {pendingAttempt.current = null}
      sendNotification({ title:'Verifica el estado de la devolución', description:caught instanceof Error?caught.message:'Resultado incierto: consulta el historial antes de repetir.',backgroundColor:'error' })
    }
  }
  async function handleExternalConfirmation() {
    if (!confirmId || !externalReference.trim()) {return}
    try {
      await confirmExternal({ refundId:confirmId, externalReference: externalReference.trim(),
        externallyVerified:true,idempotencyKey:crypto.randomUUID() })
      setConfirmId('');setExternalReference('')
      void accounting.refetch().catch(() => undefined)
      sendNotification({ title:'Reembolso confirmado',description:'Se registró la evidencia de devolución externa.',backgroundColor:'success' })
    } catch (caught) {
      sendNotification({ title:'Confirmación rechazada',description:caught instanceof Error?caught.message:'Error desconocido',backgroundColor:'error' })
    }
  }
  async function handleCancel(refundId:string) {
    try {
      await cancel({ refundId,reason:'Reembolso externo cancelado por el operador',idempotencyKey:crypto.randomUUID() })
      setCancelId('')
      void accounting.refetch().catch(() => undefined)
      sendNotification({ title:'Solicitud cancelada',description:'No se generó desembolso ni se movió inventario.',backgroundColor:'success' })
    } catch (caught) {
      sendNotification({ title:'Cancelación rechazada',description:caught instanceof Error?caught.message:'Error desconocido',backgroundColor:'error' })
    }
  }
  return <section className={styles.page} aria-label='Gestión de devoluciones'>
    <header className={styles.header}>
      <Text as='h1' weight={700} customSize='clamp(1.25rem,3vw,1.8rem)'>Devoluciones de ventas</Text>
      <Text as='p' color='gray-light'>Busca la venta, selecciona las unidades y confirma cómo se devolverá el dinero.</Text>
    </header>
    <form className={styles.search} onSubmit={e=>{e.preventDefault();setSearched(saleReference.trim());setQuantities({})}}>
      <label htmlFor='saleRefundReference'>Referencia de venta</label>
      <div className={styles.row}><input id='saleRefundReference' value={saleReference} onChange={e=>setSaleReference(e.target.value)} placeholder='Ej. T-52285375' required/>
        <button type='submit' disabled={disabled}>Buscar venta</button></div>
    </form>
    {loading&&<p role='status'>Consultando venta y reembolsos anteriores…</p>}
    {error&&<p role='alert' className={styles.error}>{error.message}</p>}
    {preview&&<div className={styles.columns}>
      <div className={styles.card}>
        <Text as='h2' customSize={18} weight={700}>Productos de la venta</Text>
        {pendingAttempt.current&&<p role='alert' className={styles.error}>Existe un intento con resultado incierto. Consulta el historial antes de cambiar los datos o reintentar.</p>}
        <p>Mercancía reembolsable: <strong>{formatMinor(preview.refundableMerchandiseMinor)}</strong></p>
        <div className={styles.switches} role='group' aria-label='Tipo de devolución'>
          <button type='button' aria-pressed={scope==='SELECTED'} className={styles.option} onClick={()=>setScope('SELECTED')}>Parcial / por artículos</button>
          <button type='button' aria-pressed={scope==='FULL_REMAINING'} className={styles.option} onClick={()=>setScope('FULL_REMAINING')}>Todo lo restante</button>
        </div>
        {scope==='FULL_REMAINING'&&<label>Condición de los productos
          <select value={defaultDisposition} onChange={e=>setDefaultDisposition(e.target.value as RefundDisposition)}>
            <option value='RESTOCK'>Reintegrar al inventario</option><option value='DAMAGED'>Dañados / no reintegrar</option><option value='NO_STOCK'>Sin inventario gestionado</option>
          </select></label>}
        {preview.lines.map(line=><div key={line.shoppingCartId} className={styles.line}>
          <div><strong>{line.productName}</strong><small>{line.remainingQuantity} disponibles de {line.soldQuantity} vendidas</small></div>
          {scope==='SELECTED'&&<div className={styles.lineControls}>
            <label>Cantidad<input type='number' min={0} max={line.remainingQuantity} step={1} value={quantities[line.shoppingCartId]??0}
              onChange={e=>setQuantities(old=>({ ...old,[line.shoppingCartId]:Math.max(0,Math.min(line.remainingQuantity,Math.trunc(Number(e.target.value)||0))) }))}/></label>
            <label>Estado<select value={dispositions[line.shoppingCartId]??'RESTOCK'} onChange={e=>setDispositions(old=>({ ...old,[line.shoppingCartId]:e.target.value as RefundDisposition }))}>
              <option value='RESTOCK'>A inventario</option><option value='DAMAGED'>Dañado</option><option value='NO_STOCK'>Sin stock gestionado</option>
            </select></label>
          </div>}
        </div>)}
        <label>Motivo de la devolución<textarea rows={3} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} required placeholder='Indica por qué el cliente devuelve el producto'/></label>
        {accounting.data?.getSaleRefundAccounting && <section className={styles.accounting} aria-label='Conciliación comercial de esta venta'>
          <strong>Estado financiero de la venta</strong>
          <dl>
            <div><dt>Mercancía original</dt><dd>{formatMinor(accounting.data.getSaleRefundAccounting.originalMerchandiseMinor)}</dd></div>
            <div><dt>Reembolsos confirmados</dt><dd>{formatMinor(accounting.data.getSaleRefundAccounting.confirmedRefundMinor)}</dd></div>
            <div><dt>Solicitudes pendientes</dt><dd>{formatMinor(accounting.data.getSaleRefundAccounting.pendingRefundMinor)}</dd></div>
            <div><dt>Mercancía neta</dt><dd>{accounting.data.getSaleRefundAccounting.verified?formatMinor(accounting.data.getSaleRefundAccounting.effectiveMerchandiseMinor):'Sin verificar'}</dd></div>
          </dl>
          {!accounting.data.getSaleRefundAccounting.verified&&<p role='alert' className={styles.error}>Evidencia financiera pendiente de conciliación. No uses el neto como valor contable definitivo.</p>}
          {!accounting.data.getSaleRefundAccounting.kardexVerified&&<p role='alert' className={styles.error}>Hay movimientos de stock pendientes de conciliación.</p>}
          {accounting.data.getSaleRefundAccounting.stockIssues.length>0&&<p role='alert' className={styles.error}>Revisa movimientos de inventario: {accounting.data.getSaleRefundAccounting.stockIssues.join(', ')}</p>}
        </section>}
        {cashArmed&&cash&&<p role='alert' className={styles.error}>Confirma físicamente que entregaste al cliente el importe correcto. El siguiente clic registrará el reembolso y la salida de caja.</p>}
        <p className={styles.help}>{cash?'Se entregará efectivo desde la caja activa y se registrará REFUND_CASH.':'La solicitud quedará pendiente hasta que un supervisor confirme el abono del proveedor externo.'}</p>
        <button type='button' disabled={disabled||reason.trim().length===0||(!preview.lines.some(l=>l.remainingQuantity>0))||(scope==='SELECTED'&&selectedLines.length===0)} onClick={()=>{ if(cash&&!cashArmed){setCashArmed(true);return} void submit() }}>
          {busy?'Procesando…':cash?(cashArmed?'Confirmar entrega de efectivo':'Revisar devolución de efectivo'):'Solicitar devolución externa'}
        </button>
      </div>
      <div className={styles.card}>
        <Text as='h2' customSize={18} weight={700}>Historial y confirmaciones</Text>
        {refunds.length===0&&<p>Aún no se han registrado devoluciones para esta venta.</p>}
        {refunds.map(refund=><div className={styles.history} key={refund.id}>
          <strong>{formatMinor(refund.amountMinor)}</strong>
          <small>{refund.status==='PENDING_EXTERNAL'?'Pendiente de proveedor':refund.status==='COMPLETED'?'Confirmada':'Cancelada'} · {refund.reason}</small>
          {refund.status==='PENDING_EXTERNAL'&&<div className={styles.row}>
            <button className={styles.secondary} disabled={disabled} type='button' onClick={()=>{setConfirmId(refund.id);setCancelId('')}}>Confirmar abono</button>
            <button className={styles.secondary} disabled={disabled} type='button' onClick={()=>{setCancelId(refund.id);setConfirmId('')}}>Cancelar</button>
          </div>}
          {confirmId===refund.id&&<div className={styles.confirm}><p>Solo un supervisor distinto debe confirmar después de verificar el proveedor.</p>
            <label>Referencia externa<input value={externalReference} maxLength={200} onChange={e=>setExternalReference(e.target.value)} placeholder='ID real del reembolso'/></label>
            <button type='button' disabled={disabled||!externalReference.trim()} onClick={()=>void handleExternalConfirmation()}>Confirmo que el proveedor reembolsó</button></div>}
          {cancelId===refund.id&&<div className={styles.row}><button type='button' className={styles.secondary} disabled={disabled} onClick={()=>void handleCancel(refund.id)}>Confirmar cancelación pendiente</button></div>}
        </div>)}
      </div>
    </div>}
  </section>
}
