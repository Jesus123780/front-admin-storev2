'use client'
import { Icon,RippleButton } from 'pkg-components'
import React,{useEffect,useId,useRef,useState} from 'react'
import type { OrderTotalRow,SaleFinancials } from '../../types/order'
import { getSummary } from '../helpers/order-financials'
import { formatCOP } from '../helpers/order-format'
import styles from './order-totals.module.css'
export type Total=OrderTotalRow
export type PropsTotals={totals:Total[]}
type Props={totals?:Total[]|null;financials?:SaleFinancials|null;note?:string;onSaveNote?:(note:string)=>void|Promise<void>}
const issueLabel:Record<string,string>={HEADER_GROSS_MISMATCH:'El subtotal registrado no coincide con el detalle.',HEADER_DISCOUNT_MISMATCH:'El descuento registrado no coincide con el cálculo.',HEADER_NET_MISMATCH:'El neto registrado no coincide con el cálculo.'}
const OrderTotals:React.FC<Props>=({totals=[],financials,note='',onSaveNote})=>{
 const [draft,setDraft]=useState(note),[savedNote,setSavedNote]=useState(note),[saving,setSaving]=useState(false),[feedback,setFeedback]=useState<'saved'|'error'|null>(null)
 const lock=useRef(false),generation=useRef(0),noteId=useId(),headingId=useId()
 useEffect(()=>{generation.current++;setDraft(note);setSavedNote(note);setFeedback(null)},[note])
 useEffect(()=>()=>{generation.current++},[])
 const {rows,final,finalLabel,mode}=getSummary(financials,totals),dirty=draft!==savedNote
 async function saveNote(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!onSaveNote||!dirty||lock.current)return;lock.current=true;setSaving(true);setFeedback(null);const submitted=draft,version=generation.current;try{await onSaveNote(submitted);if(version===generation.current){setSavedNote(submitted);setFeedback('saved')}}catch{if(version===generation.current)setFeedback('error')}finally{lock.current=false;setSaving(false)}}
 const currency=financials?.currency||'COP'
 return <section className={styles.container} aria-labelledby={headingId}>
  <header className={styles.header}><div><p className={styles.eyebrow}>Liquidación de la orden</p><h2 id={headingId} className={styles.title}>Resumen de pago</h2></div><span className={styles.headingIcon} aria-hidden='true'><Icon icon='IconWallet' size={22}/></span></header>
  {rows.length>0&&<dl className={styles.totals}>{rows.map((row,i)=><div key={`${row.key}-${i}`} className={styles.totalRow} data-effect={row.effect} data-unit={row.unit}><dt className={styles.totalLabel}>{row.label}</dt><dd className={styles.totalValue}>{row.text}</dd></div>)}</dl>}
  {final!=='—'?<div className={styles.final}><span>{finalLabel}</span><strong>{final}</strong><small>{currency} · {mode==='verified'?'Importe conciliado':mode==='review'?'Consultar conciliación':'Importe informado por el servidor'}</small></div>:<p className={styles.empty}>El importe final no está disponible.</p>}
  {mode==='verified'?<div className={styles.integrity} data-state='verified'><span aria-hidden='true'>✓</span><div><strong>Importes conciliados</strong><p>El total y el desglose coinciden con los datos registrados.</p></div></div>:<div className={styles.integrity} data-state='review'><span aria-hidden='true'><Icon icon='IconWarning' size={20}/></span><div><strong>{mode==='legacy'?'Detalle financiero no disponible':'Requiere revisión financiera'}</strong><p>{mode==='legacy'?'Se muestran los totales informados, sin reconstruir descuentos.':'Los importes de referencia no deben interpretarse como un desglose confirmado.'}</p></div></div>}
  {mode==='review'&&financials&&<details className={styles.diagnostics}><summary>Ver conciliación</summary><div className={styles.diagnosticBody}><p>Origen: {financials.source==='persisted'?'Datos persistidos':'Cálculo de referencia'}</p><dl><div><dt>Neto registrado</dt><dd>{formatCOP(financials.persisted?.netTotal,currency)}</dd></div><div><dt>Neto recalculado</dt><dd>{formatCOP(financials.calculated?.exact?.netTotal??financials.calculated?.netTotal,currency)}</dd></div></dl>{(financials.issues??[]).length>0&&<ul>{financials.issues.map((issue,i)=><li key={i}>{issueLabel[issue]??'Inconsistencia financiera informada por el servidor.'}</li>)}</ul>}</div></details>}
  {financials?.calculated?.warnings?.length? <p className={styles.hint}>El servidor informó advertencias sobre la reconstrucción histórica.</p>:null}
  <form className={styles.note} onSubmit={event=>{void saveNote(event)}}><div className={styles.noteHeading}><label htmlFor={noteId} className={styles.noteTitle}>Nota del pedido</label><span className={styles.counter}>{draft.length}/240</span></div><textarea id={noteId} className={styles.textarea} placeholder='Agrega una indicación o comentario...' maxLength={240} value={draft} disabled={saving} onChange={event=>{setDraft(event.target.value);setFeedback(null)}} aria-describedby={`${noteId}-hint`}/>{onSaveNote?<><p id={`${noteId}-hint`} className={styles.hint}>Los cambios se guardarán al seleccionar Guardar nota.</p><RippleButton type='submit' fullWidth bgColor='var(--order-accent, #ea1d2c)' color='#fff' radius='10px' padding='11px 14px' disabled={!dirty||saving} loading={saving} loadingLabel='Guardando nota'>Guardar nota</RippleButton>{feedback==='saved'&&<p className={styles.success} role='status'>Nota guardada correctamente.</p>}{feedback==='error'&&<p className={styles.error} role='alert'>No se pudo guardar la nota. Vuelve a intentarlo.</p>}</>:<p id={`${noteId}-hint`} className={styles.hint}>Borrador local: esta nota no se guarda automáticamente.</p>}</form>
 </section>
}
export default React.memo(OrderTotals)
