'use client'

import React, { useState, useRef } from 'react'
import { Icon, RippleButton } from 'pkg-components'
import styles from './order-actions.module.css'

interface OrderActionsProps {
  handlePrint?: () => void | Promise<void>
  disabled?: boolean
  requiresReview?: boolean
}

export const OrderActions: React.FC<OrderActionsProps> = React.memo(({ handlePrint, disabled = false, requiresReview = false }) => {
  const [printing, setPrinting] = useState(false)
  const lock = useRef(false)
  const [error, setError] = useState('')

  const onPrint = async () => {
    if (lock.current || printing || disabled || !handlePrint) return
    lock.current = true
    setPrinting(true)
    setError('')
    try {
      await handlePrint()
    } catch {
      setError('No se pudo iniciar la impresión. Intenta nuevamente.')
    } finally {
      lock.current = false
      setPrinting(false)
    }
  }

  return (
    <section className={styles.container} aria-label="Acciones de la orden">
      <RippleButton
        type="button"
        className={styles.printButton}
        bgColor="var(--order-accent, #ea1d2c)"
        color="#fff"
        radius="12px"
        padding="14px 18px"
        ripple
        fullWidth
        disabled={disabled || !handlePrint || printing}
        loading={printing}
        loadingLabel="Procesando impresión"
        onClick={() => { void onPrint() }}
      >
        <span className={styles.buttonContent}>
          <span aria-hidden="true"><Icon icon="IconPrint" size={19} color="#fff" /></span>
          <span>{printing ? 'Preparando impresión…' : 'Imprimir comprobante'}</span>
        </span>
      </RippleButton>
      <p className={styles.caption}>{requiresReview ? 'La orden requiere revisión financiera. La impresión usa los datos del servidor.' : 'Se imprimirá el comprobante de esta orden.'}</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
  )
})
OrderActions.displayName = 'OrderActions'
