'use client'
import { memo } from 'react'
import type { SoldOptional } from './order-item.types'
import { label, visibleSubOptions } from './order-item.utils'
import styles from './order-item-details.module.css'
export const OrderItemOptions=memo(function OrderItemOptions({options}:{options:SoldOptional[]}){const groups=options.map(o=>({o,selected:visibleSubOptions(o)})).filter(g=>g.selected.length);return groups.length?<section className={styles.section}><h4 className={styles.title}>Opcionales</h4>{groups.map(({o,selected},i)=><div className={styles.optionGroup} key={`${o.opExPid??'group'}-${i}`}><span>{label(o.OptionalProName,'Opción')}</span><ul className={styles.chips}>{selected.map((s,j)=><li key={`${s.opSubExPid??'option'}-${j}`}>{label(s.OptionalSubProName,'Opción')}</li>)}</ul></div>)}</section>:null})
