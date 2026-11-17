'use client'

import type { FinancialKind, FinancialMethod } from 'npm-pkg-hook'
import React, { useMemo, useState } from 'react'

import styles from './CashPaymentSetup.module.css'

export type PaymentSetupMethod = Pick<FinancialMethod, 'payId'|'name'|'financialKind'|'state'>
export const FINANCIAL_KINDS: {value:FinancialKind;label:string;help:string}[] = [
  { value:'CASH',label:'Efectivo',help:'El dinero entra físicamente a la caja y puede requerir vuelto' },
  { value:'BANK_TRANSFER',label:'Transferencia',help:'Pago enviado a una cuenta bancaria; no entra efectivo físico' },
  { value:'CARD',label:'Tarjeta',help:'Pago procesado por datáfono o pasarela; no entra efectivo físico' },
  { value:'DIGITAL_WALLET',label:'Billetera digital',help:'Pago por billetera electrónica; no entra efectivo físico' },
  { value:'OTHER',label:'Otro medio',help:'Un medio electrónico o alternativo claramente identificado' },
  { value:'UNKNOWN',label:'Sin clasificar',help:'No se puede cobrar con este medio hasta clasificarlo' }
]

export function CashPaymentSetup({
  methods, selectedIds, onSelectedChange, onClassify, disabled=false, canClassify=true, mode='opening'
}: {
  methods: PaymentSetupMethod[]
  selectedIds: string[]
  onSelectedChange: (ids:string[])=>void
  onClassify: (payId:string, kind:FinancialKind)=>void
  disabled?:boolean
  canClassify?:boolean
  mode?:'opening'|'catalog'
}) {
  const selectedSet = useMemo(()=>new Set(selectedIds),[selectedIds])
  const unclassified = methods.filter(m=>m.financialKind==='UNKNOWN')
  const selectedInvalid = methods.filter(m=>selectedSet.has(m.payId) && (m.financialKind==='UNKNOWN'||m.state!=='active'))
  const [expanded,setExpanded] = useState(false)
  const validMethods = methods.filter(m=>m.state==='active'&&m.financialKind!=='UNKNOWN')
  const checkedCount=validMethods.filter(m=>selectedSet.has(m.payId)).length
  // This is a local checklist; the authoritative policy is snapshotted by the backend when opening.
  const toggle=(id:string,checked:boolean)=>onSelectedChange(checked?[...selectedIds,id]:selectedIds.filter(x=>x!==id))
  return <section className={styles.panel} aria-label={mode==='opening'?'Medios de cobro de este turno':'Clasificación financiera de medios de pago'}>
    <header className={styles.header}>
      <span className={styles.eyebrow}>PASO {mode==='opening'?'2 · APERTURA':'1 · CONFIGURACIÓN'}</span>
      <h2>{mode==='opening'?'¿Cómo recibirás pagos en este turno?':'¿Qué tipo de pago representa cada opción?'}</h2>
      <p>{mode==='opening'
        ? 'Marca los medios que realmente aceptarás en esta caja. Solo aparecerán esos botones al cobrar. No cambia el catálogo de otras cajas.'
        : 'Indica cómo se recibe realmente cada pago. Solo efectivo suma dinero físico a la caja; tarjetas y transferencias quedan en el registro financiero.'}</p>
    </header>
    {mode==='opening'&&<div className={styles.counter} role='status'><strong>{checkedCount} seleccionados</strong><span>Se guardarán al abrir la caja</span></div>}
    {methods.length===0&&<div className={styles.notice}>Aún no hay medios de pago activos. Revisa el catálogo antes de abrir caja.</div>}
    {unclassified.length>0&&<div className={styles.notice} role='status'>
      <strong>{unclassified.length} medio{unclassified.length===1?'':'s'} sin clasificar</strong>
      <p>Selecciona su tipo financiero para poder habilitarlos. No es necesario cambiar cómo se llaman en el POS.</p>
    </div>}
    <div className={styles.items}>
      {methods.map(m=>{
        const valid=m.state==='active'&&m.financialKind!=='UNKNOWN'
        const detail=FINANCIAL_KINDS.find(k=>k.value===m.financialKind)
        return <div key={m.payId} className={styles.item} data-enabled={mode==='opening'&&selectedSet.has(m.payId)}>
          <div className={styles.line}>
            {mode==='opening'&&<input type='checkbox' aria-label={`Aceptar ${m.name} en este turno`} disabled={disabled||(!valid&&!selectedSet.has(m.payId))}
              checked={selectedSet.has(m.payId)} onChange={e=>toggle(m.payId,e.target.checked)}/>}
            <div className={styles.info}><strong>{m.name}</strong><small>{detail?.help}</small></div>
          </div>
          <label className={styles.kind}>Tipo de pago
            <select value={m.financialKind} disabled={disabled||!canClassify} onChange={e=>onClassify(m.payId,e.target.value as FinancialKind)}>
              {FINANCIAL_KINDS.map(k=><option value={k.value} key={k.value}>{k.label}</option>)}
            </select>
          </label>
        </div>
      })}
    </div>
    {mode==='opening'&&<>
      {selectedInvalid.length>0&&<p role='alert' className={styles.error}>Hay medios seleccionados que ya no están disponibles. Desmárcalos antes de continuar.</p>}
      {checkedCount===0&&<p className={styles.error} role='status'>Selecciona al menos un medio de pago para continuar.</p>}
      <button type='button' className={styles.secondary} disabled={disabled||validMethods.length===0} onClick={()=>{
        onSelectedChange(validMethods.map(m=>m.payId))
      }}>Aceptar todos los medios clasificados</button>
      <p className={styles.caption}>La selección se mantiene durante el turno. Para cambiarla, finaliza la sesión y realiza una nueva apertura.</p>
    </>}
    {mode==='catalog'&&<button type='button' className={styles.secondary} aria-expanded={expanded} onClick={()=>setExpanded(x=>!x)}>
      {expanded?'Ocultar':'Ver'} ejemplo de clasificación
    </button>}
    {expanded&&mode==='catalog'&&<p className={styles.caption}>Ejemplo: Efectivo → Efectivo; Visa y Mastercard → Tarjeta; consignación a cuenta → Transferencia. Comprueba cómo se recibe realmente el dinero antes de guardar.</p>}
  </section>
}
