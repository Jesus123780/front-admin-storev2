'use client'

import {
  AwesomeModal, CashPaymentFields, Icon, InputHooks,
  numberFormat
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React, {
  useEffect, useId, useMemo, useRef, useState
} from 'react'

import { useModalLayer } from '../modalLayers'
import { Prints } from '../Printsale'
import { buildPreviewReceipt } from '../receipt/financial-receipt'
import styles from './styles.module.css'

const noAction = () => { }

export const ModalSales = ({
  print, setPrint = noAction, totalProductPrice = 0, dataClientes = {},
  values = {}, code, data, delivery, loading, discount = {}, paymentKind,
  setDelivery = noAction, handleChange = noAction, handleSubmit,
  deliverySection, cashCheckout, previewInput, onCashReceivedChange,
  paymentConfirmationSection, recoverySection, pendingRecovery = false,
  paymentBusy = false, requiredAction, ...rest
}) => {
  const printZIndex = useModalLayer(Boolean(print))
  const deliveryZIndex = useModalLayer(Boolean(delivery && !print))
  const uid = useId()
  const running = useRef(false)
  const mounted = useRef(false)
  const deliveryRef = useRef(null)
  const cashRef = useRef(null)
  const confirmationRef = useRef(null)
  const recoveryRef = useRef(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => { if (!print) { setError('') } }, [print])

  const paymentName = typeof rest.paymentMethod === 'string'
    ? rest.paymentMethod.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
    : ''
  const resolvedKind = paymentKind ?? (/^(efectivo|cash|pago en efectivo|dinero en efectivo)$/.test(paymentName) ? 'cash' : 'unknown')
  const busy = Boolean(loading || paymentBusy || pending)
  const closeLocked = busy || pendingRecovery
  const receiptValues = resolvedKind === 'non-cash' ? { ...values, change: 0 } : values
  const preview = useMemo(() => {
    if (!print) { return { ready: false, issue: '' } }
    try {
      const view = buildPreviewReceipt(previewInput)
      return { ready: view?.canConfirm === true, issue: '' }
    } catch (e) {
      return { ready: false, issue: e instanceof Error ? e.message : 'No se pudo verificar el comprobante.' }
    }
  }, [previewInput, print])
  const total = cashCheckout?.total ?? totalProductPrice
  const totalValid = cashCheckout?.amountsValid === true && typeof total === 'number' && Number.isFinite(total) && total >= 0
  const canSubmit = Boolean(print && !busy && !pendingRecovery && cashCheckout?.canSubmit && preview.ready && typeof handleSubmit === 'function')
  const blocker = pendingRecovery ? 'Verifica el cobro anterior antes de continuar.' : preview.issue || requiredAction?.message || cashCheckout?.message || 'Revisa los datos del cobro antes de confirmar.'
  const close = () => { if (!running.current && !closeLocked) { setPrint(false) } }
  const submit = async () => {
    if (!canSubmit || running.current) { return }
    running.current = true
    setPending(true)
    setError('')
    try { await handleSubmit() }
    catch { if (mounted.current) { setError('No fue posible completar la acción. Verifica el estado de la venta antes de reintentar.') } }
    finally { running.current = false; if (mounted.current) { setPending(false) } }
  }
  const actionTarget = pendingRecovery ? 'recovery' : requiredAction?.target ?? (
    cashCheckout?.kind === 'cash' && (cashCheckout.received == null || cashCheckout.missing > 0) ? 'cash-received' : undefined
  )
  const actionLabel = pendingRecovery ? 'Revisar cobro pendiente' : requiredAction?.label || (actionTarget === 'cash-received' ? 'Revisar efectivo recibido' : '')
  const focusPending = () => {
    if (actionTarget === 'payment' || actionTarget === 'cash-session') { close(); return }
    const target = { recovery: recoveryRef, delivery: deliveryRef, 'cash-received': cashRef, confirmation: confirmationRef }[actionTarget]?.current
    if (!target) { return }
    if (target.tagName === 'DETAILS') { target.open = true }
    target.scrollIntoView?.({ block: 'nearest', behavior: 'auto' })
    const field = target.querySelector('input:not(:disabled), select:not(:disabled), button:not(:disabled)')
      ; (field || target).focus({ preventScroll: true })
  }
  const hasCashFields = Boolean(cashCheckout && onCashReceivedChange)
  const cashFields = hasCashFields
    ? <CashPaymentFields checkout={cashCheckout} onReceivedChange={onCashReceivedChange} disabled={busy || pendingRecovery} compact /> : null

  return <>
    <AwesomeModal backgroundColor='var(--color-background-white, #fff)' footer={false} header={false}
      backdrop='static' keyboard={false} padding='0' show={Boolean(print)} size={MODAL_SIZES.large}
      useScroll={true} title='Revisar y confirmar venta' zIndex={printZIndex} onHide={close}>
      <div className={styles.shell} aria-labelledby={`${uid}-heading`} role='region' aria-busy={busy}>
        <header className={styles.header}>
          <div><span className={styles.eyebrow}>PUNTO DE VENTA</span><h2 id={`${uid}-heading`}>Revisar y confirmar venta</h2><p>Verifica el cobro y el comprobante antes de registrar.</p></div>
          <button type='button' className={styles.close} aria-label='Volver al checkout' disabled={closeLocked} onClick={close}><Icon icon='IconClose' size={22} color='currentColor' /></button>
        </header>
        <div className={styles.workspace}>
          <main className={styles.controls} aria-label='Datos del cobro' tabIndex={0}>
            {recoverySection && <div ref={recoveryRef} tabIndex={-1} className={styles.recovery}>{recoverySection}</div>}
            <section className={styles.card}>
              <div className={styles.sectionHeading}>
                <span className={styles.step}>01</span><h3>Medio de pago</h3></div><p className={styles.method}>{rest.paymentMethod || 'Sin seleccionar'}</p>
              <p className={styles.hint}>
                Para cambiarlo, vuelve al checkout.
              </p>
            </section>
            <details className={styles.card} ref={deliveryRef} tabIndex={-1} open>
              <summary className={styles.sectionHeading}><span className={styles.step}>02</span><h3>Entrega</h3></summary>
              <div className={styles.delivery}>{deliverySection || <p className={styles.hint}>Sin configuración de entrega disponible.</p>}</div>
            </details>
            <section className={styles.card} ref={cashRef} tabIndex={-1}><div className={styles.sectionHeading}><span className={styles.step}>03</span><h3>Importes del cobro</h3></div>{hasCashFields && cashCheckout.kind === 'cash' && cashCheckout.hasItems && cashCheckout.amountsValid && cashCheckout.total > 0 ? cashFields : <p className={styles.hint}>{resolvedKind === 'non-cash' ? 'No requiere efectivo ni vuelto.' : 'Revisa los importes en el checkout.'}</p>}</section>
          </main>
          <aside className={styles.preview} aria-label='Vista previa del comprobante' tabIndex={0}>
            <div className={styles.previewHeading}><h3>Vista previa del ticket</h3><span>No acredita un pago</span></div>
            <Prints {...rest} change={resolvedKind === 'non-cash' ? 0 : values?.change} paymentKind={resolvedKind} code={code}
              data={data?.PRODUCT || []} dataClientes={dataClientes} discount={discount} previewInput={previewInput}
              checkoutBlocked={!canSubmit} submitting={busy} total={total} values={receiptValues} />
          </aside>
        </div>
        <footer className={styles.footer}>
          <div className={styles.footerAmount}><span>Total a cobrar en POS</span><strong>{totalValid ? numberFormat(total) : '—'}</strong></div>
          <div className={styles.footerControls}>
            {paymentConfirmationSection && <div className={styles.confirmation} ref={confirmationRef} tabIndex={-1}>{paymentConfirmationSection}</div>}
            {!canSubmit && !busy && <div className={styles.blocker} role='status'><span>{blocker}</span>{actionLabel && <button type='button' onClick={focusPending}>{actionLabel}</button>}</div>}
            {error && <p role='alert' className={styles.error}>{error}</p>}
            <div className={styles.actions}><button type='button' className={styles.secondary} disabled={closeLocked} onClick={close}>Volver</button><button type='button' className={styles.primary} disabled={!canSubmit} onClick={() => void submit()}>{busy ? 'Procesando…' : 'Confirmar venta'}</button></div>
          </div>
        </footer>
      </div>
    </AwesomeModal>
    <AwesomeModal borderRadius='12px' btnCancel={false} btnConfirm={false} footer={false} header
      backdrop={closeLocked ? 'static' : ''} keyboard={!closeLocked} onHide={() => { if (!closeLocked) { setDelivery(false) } }}
      padding='20px' show={Boolean(delivery && !print)} size={MODAL_SIZES.small} title='Configurar entrega' zIndex={deliveryZIndex}>
      <div className={styles.legacy}>{deliverySection ?? <InputHooks autoComplete='off' name='valueDelivery' onChange={handleChange} placeholder='Costo de envío' value={values?.valueDelivery} />}
        {!print && hasCashFields && <CashPaymentFields checkout={cashCheckout} onReceivedChange={onCashReceivedChange} disabled={busy || pendingRecovery} />}
        {!hasCashFields && <InputHooks autoComplete='off' name='change' disabled={resolvedKind !== 'cash' || busy} onChange={(event, hasError) => { if (resolvedKind === 'cash' && !busy) { handleChange(event, hasError) } }} placeholder='Cambio' value={resolvedKind === 'cash' ? values?.change ?? '' : ''} />}
      </div>
    </AwesomeModal>
  </>
}
