import React, { memo } from 'react'

import styles from './styles.module.css'
export const CashRealtimeStatus=memo(function CashRealtimeStatus({ connection }:{connection?:'connecting'|'live'|'offline'}){
 return <div className={styles.status} data-state={connection??'connecting'}><span className={styles.dot} aria-hidden='true'/><span role='status'>{connection==='live'?'Caja sincronizada':connection==='offline'?'Sin conexión de caja':'Conectando caja…'}</span></div>
})
