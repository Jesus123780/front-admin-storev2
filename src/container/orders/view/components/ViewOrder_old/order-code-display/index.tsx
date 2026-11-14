'use client'

import React from 'react'
import { Icon, ImageQRCode } from 'pkg-components'
import styles from './order-code-display.module.css'

export interface CodeDisplayProps { pCodeRef?: string | null }

export const CodeDisplay: React.FC<CodeDisplayProps> = React.memo(({ pCodeRef }) => {
  const headingId = React.useId()
  const code = pCodeRef?.trim() ?? ''
  return (
    <section className={styles.container} aria-labelledby={headingId}>
      <div className={styles.heading}>
        <span className={styles.icon} aria-hidden="true"><Icon icon="IconQrCode" size={22} /></span>
        <div className={styles.headingBody}>
          <h2 id={headingId} className={styles.title}>Código QR de la orden</h2>
          <p className={styles.subtitle}>Identifica esta orden fácilmente.</p>
        </div>
      </div>
      <div className={styles.body}>
        {code ? (
          <>
            <div className={styles.qr} role="img" aria-label={`Código QR de la orden ${code}`}>
              <ImageQRCode size={128} value={code} />
            </div>
            <span className={styles.code}>{code}</span>
          </>
        ) : (
          <p className={styles.empty}>Esta orden todavía no tiene un código disponible.</p>
        )}
      </div>
    </section>
  )
})
CodeDisplay.displayName = 'CodeDisplay'
