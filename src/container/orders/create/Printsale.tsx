'use client'

import { useFormatDate, useStore } from 'npm-pkg-hook'
import { Icon, RippleButton } from 'pkg-components'
import React, {
 type CSSProperties,useCallback, useEffect, useMemo, useRef, useState 
} from 'react'

import styles from './Prints.module.css'
import { downloadReceiptDebug } from './receipt/debug'
import { buildPreviewReceipt } from './receipt/financial-receipt'
import {
 normalizeStore, receiptDate, selectClient, text 
} from './receipt/normalize'
import { prepareReceiptForPrint } from './receipt/prepare-print'
import {
 Perforation, ReceiptClientInfo, ReceiptHeader, ReceiptProducts, ReceiptSummary 
} from './receipt/ReceiptSections'
import type { PrintsMemoProps } from './receipt/types'
export type { PrintsMemoProps } from './receipt/types'

export const PrintsMemo: React.FC<PrintsMemoProps> = ({ data, dataClientes, values, handleSubmit, code, isPrinting, promiseResolveRef, componentRef, saleDate, mode = 'preview', submitting = false, paper = 'auto', printableWidthMm, thankYouMessage = 'Gracias por su compra', onPrintPreparationIssue, previewInput, persistedView, checkoutBlocked = false, persistedStore, persistedClient }) => {
  const [dataStore] = useStore()
  const { yearMonthDay, longDayName } = useFormatDate({})
  const store = mode === 'receipt' ? persistedStore ?? normalizeStore(null) : normalizeStore(dataStore)
  const client = mode === 'receipt' ? persistedClient ?? null : selectClient(dataClientes, values)
  const resolved = useMemo(() => {
    try {
      if (mode === 'receipt') {
        if (!persistedView || persistedView.financials.source !== 'persisted') {throw new Error('Consulta primero el comprobante registrado.')}
        return { view: persistedView, issue: '' }
      }
      if (!previewInput) {throw new Error('Se requiere el checkout financiero v15 para confirmar esta venta.')}
      return { view: buildPreviewReceipt(previewInput), issue: '' }
    } catch (error) { return { view: null, issue: error instanceof Error ? error.message : 'No se pudo verificar el comprobante.' } }
  }, [mode, previewInput, persistedView])
  const { view, issue } = resolved
  const date = receiptDate(saleDate)
  const codeText = text(code)
  const localRef = useRef<HTMLDivElement | null>(null)
  const submitLock = useRef(false)
  const mounted = useRef(false)
  const issueRef = useRef(onPrintPreparationIssue)
  const [pending, setPending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const setTicketRef = useCallback((node: HTMLDivElement | null) => { localRef.current = node; componentRef.current = node }, [componentRef])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => { issueRef.current = onPrintPreparationIssue }, [onPrintPreparationIssue])
  const documentKey = JSON.stringify([view, codeText, date?.iso, store, client, paper, printableWidthMm, mode, thankYouMessage])
  useEffect(() => {
    if (!isPrinting || !view || !localRef.current || !promiseResolveRef.current) {return}
    const controller = new AbortController(), root = localRef.current, resolve = promiseResolveRef.current
    void prepareReceiptForPrint(root, controller.signal).catch(() => 'incomplete' as const).then(result => {
      if (controller.signal.aborted || result === 'aborted' || localRef.current !== root || promiseResolveRef.current !== resolve) {return}
      promiseResolveRef.current = null
      if (result === 'incomplete') { try { issueRef.current?.('No se pudieron preparar todos los recursos; se conserva el contenido textual.') } catch { /* non-critical */ } }
      resolve()
    })
    return () => controller.abort()
  }, [isPrinting, promiseResolveRef, documentKey, Boolean(view)])
  const busy = isPrinting || submitting || pending
  const canSubmit = mode === 'preview' && Boolean(view?.canConfirm) && !checkoutBlocked && !busy
  const submit = async () => {
    if (!canSubmit || submitLock.current || !handleSubmit) {return}
    submitLock.current = true; setPending(true); setSubmitError('')
    try { await handleSubmit() } catch { if (mounted.current) {setSubmitError('No fue posible completar la acción. Verifica el estado de la venta antes de reintentar.')} }
    finally { submitLock.current = false; if (mounted.current) {setPending(false)} }
  }
  const width = typeof printableWidthMm === 'number' && Number.isFinite(printableWidthMm) && printableWidthMm >= 30 && printableWidthMm <= 210 ? printableWidthMm : undefined
  const customStyle = width === undefined ? undefined : ({ '--ticket-print-width': `${width}mm` } as CSSProperties)
  return <div className={styles.page} data-printing={isPrinting}>
    <div className={styles.ticketWrapper}><div className={styles.stage}>
      <div ref={setTicketRef} className={styles.ticket} id='ticket' data-paper={paper} data-printing={isPrinting} data-long={(view?.items.length ?? 0) > 20} style={customStyle} aria-label={mode === 'preview' ? 'Vista previa del ticket de venta' : 'Ticket de venta'}>
        <div className={styles.paperTop}><ReceiptHeader store={store} /><div className={styles.reference}><span className={styles.eyebrow}>{mode === 'preview' ? 'Vista previa · Ticket de venta' : 'Comprobante de venta'}</span><strong className={styles.referenceCode}>{codeText ? `#${codeText}` : 'Referencia pendiente'}</strong>{date ? <time className={styles.referenceDate} dateTime={date.iso}>{date.label}</time> : <span className={styles.referenceDate}>{mode === 'preview' ? `Vista previa · ${yearMonthDay} ${longDayName}` : 'Fecha no disponible'}</span>}</div></div>
        <Perforation />
        {view ? <><div className={styles.paperBody}><ReceiptClientInfo client={client}/><ReceiptProducts items={view.items}/></div><Perforation/><div className={styles.paperBottom}><ReceiptSummary financials={view.financials} payment={view.payment} mode={mode}/>{view.financials.warnings.map(w => <p className={styles.dataNotice} key={w}>{w}</p>)}<footer className={styles.footer}><div className={styles.footerMark}>{process.env.NEXT_PUBLIC_BUSINESS_TITLE || 'VENTY'}</div><p className={styles.thanks}>{thankYouMessage}</p><p className={styles.footerMessage}>{mode === 'preview' ? 'Vista previa · No acredita un pago' : 'Conserve este comprobante'}</p></footer></div></> : <div className={styles.paperBottom}><p className={styles.dataNotice} role='status'>{issue}</p><p className={styles.dataNotice}>No se mostrará un total sin verificar.</p></div>}
        <div className={styles.zigzag} aria-hidden='true'/>
      </div>
    </div></div>
    {handleSubmit && mode === 'preview' && <div className={styles.actionFooter}><RippleButton type='button' disabled={!canSubmit} loading={submitting || pending} onClick={() => { void submit() }} bgColor='var(--receipt-action)' color='var(--color-base-white)' radius='var(--border-radius-md)' className={styles.actionButton} aria-label='Confirmar venta'><span className={styles.actionContent}><span aria-hidden='true'><Icon icon='IconSales' color='currentColor' size={20}/></span>{busy ? 'Procesando…' : 'Confirmar venta'}</span></RippleButton>{submitError && <p className={styles.submitError} role='alert'>{submitError}</p>}</div>}
    {process.env.NODE_ENV === 'development' && view && <div className={styles.debugActions}><p>Diagnóstico local; revisa el archivo antes de compartirlo.</p><button type='button' onClick={() => downloadReceiptDebug({ cart:data,items:view.items,financials:view.financials,payment:view.payment,store,client,configuration:{ mode,paper,printableWidthMm:width },state:{ busy,canSubmit,isPrinting } })}>Descargar diagnóstico financiero</button></div>}
  </div>
}
export const Prints = React.memo(PrintsMemo)
