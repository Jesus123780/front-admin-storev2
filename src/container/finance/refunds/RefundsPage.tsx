'use client'
import { useCashSessions } from 'npm-pkg-hook'
import React, { useMemo, useState } from 'react'

import { SaleRefundsPanel } from './SaleRefundsPanel'
import styles from './SaleRefundsPanel.module.css'

/** Self-contained App Router page. Never selects another operator's drawer silently. */
export default function RefundsPage() {
  const { data,loading,error,refetch } = useCashSessions()
  console.log({data})
  const sessions = useMemo(()=> (data?.getCashSessions ?? [])
    .filter(session => session.status === 'OPEN'),[data])
  const [selected,setSelected] = useState<string>('')
  const sessionId = sessions.some(s=>s.id===selected)?selected:null
  return <main className={styles.page}>
    <section className={styles.card} aria-label='Caja para reembolso en efectivo'>
      <label htmlFor='refund-cash-session'>Caja que entregará el reembolso en efectivo</label>
      <div className={styles.row}>
        <select id='refund-cash-session' value={sessionId??''} onChange={e=>setSelected(e.target.value)}>
          <option value=''>Selecciona una caja abierta</option>
          {sessions.map(s=><option key={s.id} value={s.id}>
            {String(s.id).slice(0,8)} · {s.status}
          </option>)}
        </select>
        <button type='button' className={styles.secondary} onClick={()=>void refetch()} disabled={loading}>Actualizar cajas</button>
      </div>
      {error&&<p role='alert'>No fue posible cargar las cajas. Intenta nuevamente.</p>}
      <p className={styles.help}>La sesión de caja se utiliza únicamente para devoluciones en efectivo. El backend valida que esté abierta y que pertenezca al operador.</p>
    </section>
    <SaleRefundsPanel cashSessionId={sessionId}/>
  </main>
}
