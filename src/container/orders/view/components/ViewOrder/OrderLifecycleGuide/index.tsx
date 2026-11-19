'use client'

import { useState } from 'react'
import styles from './styles.module.css'

/** Explain internal workflow without confusing it with accounting or cancellation. */
export function OrderLifecycleGuide({ onManageStatuses }: { onManageStatuses?: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <section className={styles.guide} aria-labelledby="order-flow-heading">
      <div className={styles.icon} aria-hidden="true">↔</div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Organización de tu comercio</span>
            <h2 id="order-flow-heading">Las columnas son etapas internas, no estados de pago</h2>
          </div>
          <button className={styles.detailsButton} type="button" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>
            {expanded ? 'Ocultar explicación' : '¿Cómo funciona?'}
          </button>
        </div>
        <p className={styles.summary}>«En espera», «Aceptada», «En preparación» o «Listo» indican cómo avanza una orden ya registrada. Puedes adaptar estas etapas a la operación de tu negocio.</p>
        {expanded && (
          <div className={styles.details}>
            <div><span className={styles.dotBlue} /><strong>Seguimiento interno</strong><p>Arrastrar una orden solo cambia su etapa de trabajo y registra el movimiento.</p></div>
            <div><span className={styles.dotGreen} /><strong>Venta y existencias</strong><p>La venta se registra en el POS. Moverla aquí no vuelve a descontar stock ni cambia cobros o contabilidad.</p></div>
            <div><span className={styles.dotAmber} /><strong>Cancelación o devolución</strong><p>Se tramitan por su flujo autorizado, con las validaciones y ajustes de stock que correspondan. No se ejecutan arrastrando tarjetas.</p></div>
          </div>
        )}
        {onManageStatuses && <button className={styles.configure} type="button" onClick={onManageStatuses}>Configurar etapas internas <span aria-hidden="true">↗</span></button>}
      </div>
    </section>
  )
}
