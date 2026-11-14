'use client'


import {
 buildDeliveryUpdate, 
 changeDraftMode, 
 DELIVERY_MODE_INFO, DELIVERY_MODES, deliveryAdminError, editDeliveryDraft, formatDeliveryMoney,initialDeliveryDraft, normalizeDeliveryDraft, useDeliveryMethodMutations, useGetAllDeliveryMethods, useStore 
} from 'npm-pkg-hook'
import type { FormEvent } from 'react'
import {
 useEffect, useMemo, useRef, useState 
} from 'react'

import styles from './styles.module.css'

export type DeliveryMode = 'NONE' | 'MERCHANT' | 'MERCHANT_EXTERNAL' | 'THIRD_PARTY_COLLECTED' | 'THIRD_PARTY_DIRECT' | 'MERCHANT_SUBSIDIZED' | 'MERCHANT_SUBSIDIZED_EXTERNAL'
export interface DeliveryMethod { id: string; code: string; name: string; mode: DeliveryMode; providerType: 'NONE'|'OWN'|'THIRD_PARTY'; defaultFee: string|null; allowFeeOverride: boolean; active: boolean; revision: number }
export interface DeliveryDraft { methodId: string; customerFee: string; providerCost: string; providerName: string; providerRef: string }
export interface DeliveryInput { methodId: string; expectedRevision: number; customerFee?: string; providerCost?: string; providerName?: string; providerRef?: string }
export interface DeliveryQuote { methodId: string; methodRevision: number; mode: DeliveryMode; methodName: string; providerType: DeliveryMethod['providerType']; currency: string; policyVersion: number; customerFee: string; providerCost: string|null; posCharge: string; externalCharge: string; merchantRevenue: string; thirdPartyPayable: string; merchantCost: string|null; providerName: string|null; providerRef: string|null }
export type DeliveryTotals = { merchandiseNet: string; posCharge: string; checkoutTotal: string; customerTotal: string; merchantRevenue: string; externalCharge: string; thirdPartyPayable: string; merchantCost: string|null }


export type DeliveryParty = 'NONE' | 'MERCHANT' | 'PROVIDER'
export interface ManagedDeliveryMethod extends DeliveryMethod {
  idStore: string
  collector: DeliveryParty
  beneficiary: DeliveryParty
  defaultFeeMinor: string | null
  createdAt: string
  updatedAt: string
}
export interface CreateDeliveryMethodInput {
  code: string
  name: string
  mode: DeliveryMode
  defaultFee: string | null
  allowFeeOverride: boolean
  active: boolean
}
export type UpdateDeliveryMethodInput = Partial<Pick<CreateDeliveryMethodInput, 'name' | 'defaultFee' | 'allowFeeOverride' | 'active'>>
export interface UpdateDeliveryMethodVariables { id: string; expectedRevision: number; input: UpdateDeliveryMethodInput }
export type DeliveryMethodDraft = Omit<CreateDeliveryMethodInput,'defaultFee'> & { defaultFee: string; variableFee: boolean }


type Filter = 'ALL'|'ACTIVE'|'INACTIVE'
type Editor = { kind:'create' } | {kind:'edit';original:ManagedDeliveryMethod}
type Notice = {kind:'success'|'error'|'info';text:string} | null
const feeLabel = (m:ManagedDeliveryMethod) => m.defaultFee===null?'Tarifa en caja':DELIVERY_MODE_INFO[m.mode].free?'Sin cobro al cliente':m.allowFeeOverride?'Tarifa sugerida':'Tarifa fija'
const term=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()

function DeliveryMethodsManager({ storeId }:{storeId:string}) {
 const catalog=useGetAllDeliveryMethods(storeId)
 const writes=useDeliveryMethodMutations(storeId)
 const [filter,setFilter]=useState<Filter>('ALL'),[search,setSearch]=useState('')
 const [editor,setEditor]=useState<Editor|null>(null),[draft,setDraft]=useState<DeliveryMethodDraft>(()=>initialDeliveryDraft())
 const [notice,setNotice]=useState<Notice>(null),[confirmation,setConfirmation]=useState<ManagedDeliveryMethod|null>(null)
 const [saving,setSaving]=useState(false)
 const actionLock=useRef(false), editorRef=useRef<HTMLElement|null>(null), titleRef=useRef<HTMLHeadingElement|null>(null)
 const locked=saving||writes.busy
 const rows=useMemo(()=>catalog.methods.filter(m=> (filter==='ALL'||m.active===(filter==='ACTIVE'))&&term(`${m.name} ${m.code} ${DELIVERY_MODE_INFO[m.mode].label}`).includes(term(search))),[catalog.methods,filter,search])
 const active=catalog.methods.filter(m=>m.active).length
 const selected=editor?.kind==='edit'?editor.original:null
 const fresh=selected?catalog.methods.find(m=>m.id===selected.id):null
 const stale=!!selected&&catalog.ready&&(!fresh||fresh.revision!==selected.revision)
 const info=DELIVERY_MODE_INFO[draft.mode]
 useEffect(()=>{if(editor){editorRef.current?.focus()}},[editor])
 const closeEditor=()=>{setEditor(null);titleRef.current?.focus()}
 const startCreate=()=>{setNotice(null);setDraft(initialDeliveryDraft());setEditor({ kind:'create' })}
 const startEdit=(m:ManagedDeliveryMethod)=>{setNotice(null);setDraft(editDeliveryDraft(m));setEditor({ kind:'edit',original:m })}
 const patch=<K extends keyof DeliveryMethodDraft,>(key:K,value:DeliveryMethodDraft[K])=>setDraft(current=>({ ...current,[key]:value }))
 async function run(work:()=>Promise<void>){
   if(actionLock.current||!catalog.ready){return}
   actionLock.current=true;setSaving(true);setNotice(null)
   try{await work()}catch(error){const failure=deliveryAdminError(error);setNotice({ kind:'error',text:failure.message });if(failure.code==='DELIVERY_CONFLICT'){setConfirmation(null);catalog.refresh()}}
   finally{actionLock.current=false;setSaving(false)}
 }
 const save=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!editor||locked||stale){return}
   void run(async()=>{
     if(editor.kind==='create'){
       const input=normalizeDeliveryDraft(draft)
       if(catalog.methods.some(m=>m.code===input.code)){throw new Error('Ya existe un método con ese código.')}
       await writes.create(input);setNotice({ kind:'success',text:'Método de entrega creado.' })
     }else{
       const changes=buildDeliveryUpdate(editor.original,draft)
       if(!Object.keys(changes).length){setNotice({ kind:'info',text:'No hay cambios para guardar.' });return}
       await writes.update(editor.original,changes);setNotice({ kind:'success',text:'Configuración actualizada.' })
     }
     closeEditor()
   })
 }
 const toggle=(m:ManagedDeliveryMethod)=>{if(locked||!catalog.ready||m.mode==='NONE'){return;}setNotice(null);setConfirmation(m)}
 const confirmToggle=()=>{const m=confirmation;if(!m||locked){return}
   void run(async()=>{await writes.setActive(m,!m.active);setConfirmation(null);setNotice({ kind:'success',text:m.active?'Método desactivado. Las ventas históricas no cambian.':'Método activado. Ya está disponible en el POS.' })})
 }
 return <main className={styles.page}>
   <header className={styles.heading}>
     <div><p className={styles.eyebrow}>CONFIGURACIÓN / ENTREGAS</p><h1 ref={titleRef} tabIndex={-1}>Métodos de entrega</h1><p>Controla cómo se cobran y distribuyen los domicilios de tu comercio.</p></div>
     <div className={styles.actions}><button type='button' onClick={catalog.refresh} disabled={locked||catalog.loading} className={styles.secondary}>Actualizar</button><button type='button' onClick={startCreate} disabled={locked||!catalog.ready} className={styles.primary}>+ Nuevo método</button></div>
   </header>
   {notice&&<div className={`${styles.notice} ${notice.kind==='error'?styles.error:notice.kind==='success'?styles.success:''}`} role={notice.kind==='error'?'alert':'status'}><span>{notice.text}</span><button type='button' aria-label='Cerrar mensaje' onClick={()=>setNotice(null)}>×</button></div>}
   {catalog.error&&<div className={`${styles.notice} ${styles.error}`} role='alert'><div><strong>{catalog.error.code==='FORBIDDEN'?'Acceso administrativo requerido':'No se pudo consultar el catálogo'}</strong><p>{catalog.error.message}</p>{catalog.error.code==='FORBIDDEN'&&<p>Solicita al administrador los permisos de gestión de entregas.</p>}</div><button type='button' className={styles.secondary} onClick={catalog.refresh}>Reintentar</button></div>}
   <section className={styles.metrics} aria-label='Resumen de modalidades' aria-busy={catalog.loading}>
     {[['Métodos configurados',catalog.methods.length],['Disponibles en POS',active],['Inactivos',catalog.methods.length-active]].map(([name,value])=><article className={styles.metric} key={name}><span>{name}</span><strong>{catalog.ready?value:'—'}</strong></article>)}
   </section>
   <div className={styles.layout}>
     <section className={styles.catalog} aria-labelledby='delivery-list-title'>
       <header className={styles.catalogHead}><div><h2 id='delivery-list-title'>Modalidades</h2><p>Los cambios se aplican a nuevas ventas.</p></div><span className={styles.count}>{catalog.ready?`${rows.length} métodos`:'—'}</span></header>
       <div className={styles.filters}><label className={styles.search}><span className={styles.srOnly}>Buscar método</span><input type='search' value={search} onChange={e=>setSearch(e.target.value)} placeholder='Buscar nombre o código…'/></label><div className={styles.tabs} role='group' aria-label='Filtrar por estado'>{([['ALL','Todos'],['ACTIVE','Activos'],['INACTIVE','Inactivos']] as const).map(([key,label])=><button key={key} type='button' aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}</div></div>
       {catalog.loading&&<div className={styles.empty} role='status'>Consultando métodos de entrega…</div>}
       {catalog.ready&&rows.length===0&&<div className={styles.empty}><strong>No hay métodos con este filtro</strong><p>Prueba otra búsqueda o crea un método personalizado.</p></div>}
       {catalog.ready&&rows.map(m=>{const meta=DELIVERY_MODE_INFO[m.mode];const isBase=m.mode==='NONE';return <article key={m.id} className={`${styles.method} ${selected?.id===m.id?styles.selected:''}`}>
         <div className={styles.methodTop}><div className={styles.icon} aria-hidden='true'>{isBase?<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'><path d='M3 10l9-7 9 7M5 9v12h14V9M9 21v-7h6v7'/></svg>:<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7'><path d='M3 5h12v12H3zM15 9h4l3 4v4h-7'/><circle cx='7' cy='18' r='2'/><circle cx='18' cy='18' r='2'/></svg>}</div><div className={styles.methodTitle}><h3>{m.name}</h3><small>{m.code} · v{m.revision}</small></div><span className={`${styles.state} ${m.active?styles.active:''}`}>{m.active?'Activo':'Inactivo'}</span></div>
         <p className={styles.description}>{meta.description}</p><dl className={styles.details}><div><dt>{feeLabel(m)}</dt><dd>{formatDeliveryMoney(m.defaultFee)}</dd></div><div><dt>Recauda</dt><dd>{meta.collector}</dd></div><div><dt>Beneficiario</dt><dd>{meta.beneficiary}</dd></div></dl>
         <div className={styles.methodFooter}><button type='button' className={styles.secondary} disabled={locked} onClick={()=>startEdit(m)}>Editar</button><button type='button' className={styles.switchButton} role='switch' aria-checked={m.active} aria-label={`${m.active?'Desactivar':'Activar'} ${m.name}`} disabled={locked||isBase} title={isBase?'El retiro siempre está disponible':undefined} onClick={()=>toggle(m)}><i aria-hidden='true'/><span>{isBase?'Siempre activo':m.active?'Desactivar':'Activar'}</span></button></div>
       </article>})}
     </section>
     {editor?<section className={styles.editor} ref={editorRef} tabIndex={-1} aria-labelledby='edit-delivery-title'>
       <header className={styles.editorHead}><div><p className={styles.eyebrow}>{editor.kind==='create'?'NUEVA MODALIDAD':'CONFIGURACIÓN'}</p><h2 id='edit-delivery-title'>{editor.kind==='create'?'Crear método':'Editar método'}</h2></div><button className={styles.close} type='button' aria-label='Cerrar editor' disabled={locked} onClick={closeEditor}>×</button></header>
       {stale&&<div role='alert' className={`${styles.notice} ${styles.error}`}><div>La configuración cambió mientras editabas. Carga la última revisión antes de guardar.</div><button type='button' className={styles.secondary} onClick={()=>fresh?startEdit(fresh):closeEditor()}>{fresh?'Cargar revisión':'Cerrar'}</button></div>}
       <form onSubmit={save}><fieldset disabled={locked||!catalog.ready||stale} className={styles.fields}>
         <label>Nombre<input value={draft.name} required maxLength={120} onChange={e=>patch('name',e.target.value)} placeholder='Ej. Domicilio zona norte'/></label>
         <label>Código<input value={draft.code} required maxLength={48} readOnly={editor.kind==='edit'} onChange={e=>patch('code',e.target.value.toUpperCase())} placeholder='DOMICILIO_NORTE'/><small>Identificador único. No se puede cambiar después de crear.</small></label>
         <label>Modalidad financiera<select value={draft.mode} disabled={editor.kind==='edit'} onChange={e=>setDraft(d=>changeDraftMode(d,e.target.value as DeliveryMode))}>{DELIVERY_MODES.filter(m=>m!=='NONE'||editor.kind==='edit'&&draft.mode==='NONE').map(mode=><option key={mode} value={mode}>{DELIVERY_MODE_INFO[mode].label}</option>)}</select></label>
         <div className={styles.explainer}><strong>{info.label}</strong><p>{info.description}</p><dl><div><dt>Cobra</dt><dd>{info.collector}</dd></div><div><dt>Recibe</dt><dd>{info.beneficiary}</dd></div></dl></div>
         {info.free?<p className={styles.zeroFee}>Tarifa del cliente: <strong>$ 0,00</strong>. No se modifica en caja.</p>:<><label>Tipo de tarifa<select value={draft.variableFee?'MANUAL':draft.allowFeeOverride?'SUGGESTED':'FIXED'} onChange={e=>{const choice=e.target.value;setDraft(d=>({ ...d,variableFee:choice==='MANUAL',allowFeeOverride:choice!=='FIXED' }))}}><option value='MANUAL'>Definir durante la venta</option><option value='FIXED'>Tarifa fija</option><option value='SUGGESTED'>Tarifa sugerida (editable en caja)</option></select></label>{!draft.variableFee&&<label>Tarifa del cliente (COP)<input inputMode='decimal' required value={draft.defaultFee} onChange={e=>patch('defaultFee',e.target.value)} placeholder='5000,00'/><small>Sin separadores de miles. Hasta dos decimales.</small></label>}</>}
         <label className={styles.check}><input type='checkbox' checked={draft.active} disabled={draft.mode==='NONE'} onChange={e=>patch('active',e.target.checked)}/><span><strong>Disponible en el POS</strong><small>Permite elegir esta modalidad al crear ventas.</small></span></label>
         {editor.kind==='edit'&&<small>La modalidad financiera es inmutable: crea otra si necesitas cambiar quién cobra o recibe.</small>}
       </fieldset><footer className={styles.formActions}><button type='button' className={styles.secondary} disabled={locked} onClick={closeEditor}>Cancelar</button><button type='submit' className={styles.primary} disabled={locked||!catalog.ready||stale}>{locked?'Guardando…':'Guardar método'}</button></footer></form>
     </section>:<aside className={styles.guide}><p className={styles.eyebrow}>REGLAS DE RECAUDO</p><h2>El domicilio no siempre es un ingreso</h2><p>Selecciona una modalidad para configurar la tarifa, su disponibilidad y la política de cobro.</p><div className={styles.guideRow}><strong>Ingreso propio</strong><span>El comercio cobra y conserva el valor del servicio.</span></div><div className={styles.guideRow}><strong>Recaudo de terceros</strong><span>Se cobra en caja, pero se debe entregar al proveedor.</span></div><div className={styles.guideRow}><strong>Pago directo</strong><span>El envío no se suma al cobro del POS.</span></div><div className={styles.guideRow}><strong>Domicilio gratuito</strong><span>El cliente paga cero por la entrega; el costo se registra por venta.</span></div><small>No modifica ventas ya registradas ni permite eliminar su historial.</small></aside>}
   </div>
   {confirmation&&<section className={styles.confirmation} role='alert' aria-label='Confirmar cambio de disponibilidad'><div><strong>{confirmation.active?'¿Desactivar':'¿Activar'} {confirmation.name}?</strong><p>{confirmation.active?'Dejará de estar disponible para nuevas ventas. No afecta el historial.':'Los cajeros podrán seleccionarlo después de actualizar el catálogo.'}</p></div><div className={styles.actions}><button type='button' className={styles.secondary} disabled={locked} onClick={()=>setConfirmation(null)}>Cancelar</button><button type='button' className={styles.primary} disabled={locked||!catalog.ready} onClick={confirmToggle}>{locked?'Guardando…':'Confirmar'}</button></div></section>}
 </main>
}
export default function DeliveryMethodsPage(){
  const [store]=useStore()
  const storeId=String(store?.idStore??'')
  return storeId?<DeliveryMethodsManager key={storeId} storeId={storeId}/>:<main className={styles.page}><div className={styles.empty} role='status'>Selecciona un comercio o inicia sesión para administrar sus métodos de entrega.</div></main>
}
