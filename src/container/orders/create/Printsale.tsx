'use client'

import { useFormatDate, useStore } from 'npm-pkg-hook'
import { Icon, RippleButton } from 'pkg-components'
import type { CSSProperties } from 'react'
import React, {
 useCallback, useEffect, useMemo, useRef, useState 
} from 'react'

import styles from './Prints.module.css'
import { downloadReceiptDebug } from './receipt/debug'
import {
 amount, hasIncompleteAmounts, normalizePayment,normalizeProducts, normalizeStore, receiptDate, selectClient, summarizeReceipt, text 
} from './receipt/normalize'
import { prepareReceiptForPrint } from './receipt/prepare-print'
import {
 Perforation, ReceiptClientInfo, ReceiptHeader, ReceiptProducts, ReceiptSummary 
} from './receipt/ReceiptSections'
import type { PrintsMemoProps } from './receipt/types'

export type { PrintsMemoProps } from './receipt/types'

export const PrintsMemo: React.FC<PrintsMemoProps> = ({
  data, dataClientes, values, paymentMethod, handleSubmit, code, change, total,
  isPrinting, promiseResolveRef, componentRef, discount, saleDate,
  mode = 'preview', submitting = false, paymentKind, paper = 'auto', printableWidthMm,
  thankYouMessage = 'Gracias por su compra', onPrintPreparationIssue
}) => {
  const [dataStore] = useStore()
  const { yearMonthDay, longDayName } = useFormatDate({})
  const store = normalizeStore(dataStore)
  const client = selectClient(dataClientes, values)
  const items = useMemo(() => normalizeProducts(data), [data])
  const effectiveTotal = amount(total)
  const payment = normalizePayment(paymentMethod, change, paymentKind)
  const financials = useMemo(() => summarizeReceipt(items, effectiveTotal, discount), [items, effectiveTotal, discount])
  const date = receiptDate(saleDate)
  const codeText = text(code)
  const incomplete = hasIncompleteAmounts(items, effectiveTotal)
  const courtesyExtraConflict = items.some(item => item.extras.some(extra => extra.inconsistentCourtesyPrice))
  const warnings = [...financials.warnings, ...(payment.warning ? [payment.warning] : [])]
  const localRef = useRef<HTMLDivElement | null>(null)
  const issueRef = useRef(onPrintPreparationIssue)
  const submitLock = useRef(false)
  const [pending, setPending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const mounted = useRef(false)
  const setTicketRef = useCallback((node: HTMLDivElement | null) => {
    localRef.current = node
    componentRef.current = node
  }, [componentRef])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  useEffect(() => { issueRef.current = onPrintPreparationIssue }, [onPrintPreparationIssue])

  useEffect(() => {
    if (!isPrinting || !localRef.current || !promiseResolveRef.current) {return}
    const controller = new AbortController()
    const root = localRef.current
    const resolve = promiseResolveRef.current
    // React committed the DOM. Screen animations are disabled by data-printing.
    void prepareReceiptForPrint(root, controller.signal).catch(() => 'incomplete' as const).then(result => {
      if (controller.signal.aborted || result === 'aborted' || localRef.current !== root || promiseResolveRef.current !== resolve) {return}
      // Never resolve the same request twice (including Strict Mode).
      promiseResolveRef.current = null
      if (result === 'incomplete') {
        try { issueRef.current?.('No se pudieron preparar todos los recursos; se conserva el contenido textual.') } catch { /* notification is non-critical */ }
      }
      resolve()
    })
    return () => controller.abort()
  }, [isPrinting, promiseResolveRef, codeText, data, saleDate, store.logo, store.name, store.nit, store.address, store.phone, client?.name, client?.document, client?.phone, client?.address, total, change, paymentMethod, paymentKind, discount, paper, printableWidthMm, mode, thankYouMessage])

  const busy = isPrinting || submitting || pending
  const submit = async () => {
    if (busy || courtesyExtraConflict || submitLock.current || !handleSubmit) {return}
    submitLock.current = true
    setPending(true)
    setSubmitError('')
    try { await handleSubmit() }
    catch { if (mounted.current) {setSubmitError('No fue posible completar la acción. Verifica el estado de la venta antes de reintentar.')} }
    finally {
      submitLock.current = false
      if (mounted.current) {setPending(false)}
    }
  }

  const width = typeof printableWidthMm === 'number' && Number.isFinite(printableWidthMm) && printableWidthMm >= 30 && printableWidthMm <= 210 ? printableWidthMm : undefined
  const customStyle = width === undefined ? undefined : ({ '--ticket-print-width': `${width}mm` } as CSSProperties)


const downloadPaymentDebug = () => {
  const rawValues =
    values && typeof values === 'object'
      ? (values as Record<string, unknown>)
      : {}

  const inspectValue = (value: unknown) => ({
    value:
      value === undefined
        ? null
        : typeof value === 'number' && !Number.isFinite(value)
          ? String(value)
          : typeof value === 'object' && value !== null
            ? '[OBJECT]'
            : value,
    type: typeof value,
    isUndefined: value === undefined,
    isNull: value === null,
    isEmpty: value === ''
  })

  const debugData = {
    metadata: {
      application: 'Venty',
      component: 'PrintsMemo',
      version: '4.1.0',
      generatedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV
    },

    raw: {
      paymentMethod: inspectValue(paymentMethod),
      paymentKind: inspectValue(paymentKind),
      change: inspectValue(change),
      total: inspectValue(total),
      discount,
      code,
      saleDate,
      mode
    },

    values: {
      availableKeys: Object.keys(rawValues),

      change: inspectValue(rawValues.change),
      cash: inspectValue(rawValues.cash),
      cashReceived: inspectValue(rawValues.cashReceived),
      received: inspectValue(rawValues.received),
      receivedAmount: inspectValue(rawValues.receivedAmount),
      amountReceived: inspectValue(rawValues.amountReceived),
      paymentMethod: inspectValue(rawValues.paymentMethod),
      paymentKind: inspectValue(rawValues.paymentKind),
      payId: inspectValue(rawValues.payId),
      valueDelivery: inspectValue(rawValues.valueDelivery),
      tip: inspectValue(rawValues.tip)
    },

    normalized: {
      payment,
      financials,
      effectiveTotal,
      codeText,
      date,
      incomplete,
      courtesyExtraConflict
    },

    comparisons: {
      changeMatchesValues: Object.is(
        change,
        rawValues.change
      ),

      hasChange: change !== undefined && change !== null,

      numericChange: amount(change),

      hasPaymentKind: Boolean(paymentKind),

      normalizedPaymentKind: payment.kind,

      reportedChange: payment.reportedChange,

      normalizedChange: payment.change,

      paymentWarning: payment.warning,

      warnings
    },

    products: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      originalTotal: item.originalTotal,
      total: item.total,
      free: item.free,
      discountAmount: item.discountAmount,
      discountPercent: item.discountPercent,

      extras: item.extras.map((extra) => ({
        name: extra.name,
        quantity: extra.quantity,
        unitPrice: extra.unitPrice,
        originalTotal: extra.originalTotal,
        total: extra.total,
        discountAmount: extra.discountAmount,
        inconsistentCourtesyPrice:
          extra.inconsistentCourtesyPrice
      })),

      optionals: item.optionals
    })),

    state: {
      busy,
      pending,
      submitting,
      isPrinting,
      incomplete,
      courtesyExtraConflict,
      submitLocked: submitLock.current,
      mounted: mounted.current
    },

    configuration: {
      mode,
      paper,
      printableWidthMm: width,
      totalItems: items.length,
      hasReference: Boolean(codeText)
    }
  }

  const json = JSON.stringify(
    debugData,
    (key, value) => {
      if (
        /password|secret|token|authorization|cookie|email|phone|address|ccClient|clientName|clientNumber|cardNumber|cvv/i.test(key)
      ) {
        return '[REDACTED]'
      }

      if (typeof value === 'bigint') {
        return value.toString()
      }

      if (
        typeof value === 'number' &&
        !Number.isFinite(value)
      ) {
        return String(value)
      }

      return value
    },
    2
  )

  console.groupCollapsed(
    '%c[VENTY] PAYMENT DEBUG',
    'color: #0062ff; font-weight: bold; font-size: 14px;'
  )

  console.log('Raw:', debugData.raw)
  console.log('Values:', debugData.values)
  console.log('Normalized:', debugData.normalized)
  console.log('Comparisons:', debugData.comparisons)
  console.log('JSON:', json)

  console.groupEnd()

  const blob = new Blob([json], {
    type: 'application/json;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `VENTY_PAYMENT_DEBUG_${Date.now()}.json`

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}


  return <div className={styles.page} data-printing={isPrinting}>
    <button
  type='button'
  onClick={downloadPaymentDebug}
>
  Descargar diagnóstico de pagos
</button>
    <div className={styles.ticketWrapper}>
      <div className={styles.stage}>
        <div ref={setTicketRef} className={styles.ticket} id='ticket' data-paper={paper} data-printing={isPrinting} data-long={items.length > 20} style={customStyle} aria-label={mode === 'preview' ? 'Vista previa del ticket de venta' : 'Ticket de venta'}>
          <div className={styles.paperTop}>
            <ReceiptHeader store={store} />
            <div className={styles.reference}>
              <span className={styles.eyebrow}>{mode === 'preview' ? 'Vista previa · Ticket de venta' : 'Ticket de venta'}</span>
              <strong className={styles.referenceCode}>{codeText ? `#${codeText}` : 'Referencia pendiente'}</strong>
              {date ? <time className={styles.referenceDate} dateTime={date.iso}>{date.label}</time> : mode === 'preview' ? <span className={styles.referenceDate}>Vista previa · {yearMonthDay} {longDayName}</span> : <span className={styles.referenceDate}>Fecha de venta no disponible</span>}
            </div>
          </div>
          <Perforation />
          <div className={styles.paperBody}>
            <ReceiptClientInfo client={client} />
            <ReceiptProducts items={items} />
          </div>
          <Perforation />
          <div className={styles.paperBottom}>
            <ReceiptSummary financials={financials} payment={payment} mode={mode} />
            {!financials.netMatches && <p className={styles.dataNotice}>Desglose no conciliado con el total informado. Verifica los importes.</p>}
            {incomplete && <p className={styles.dataNotice} role='status'>Algunos importes o cantidades no están disponibles (—). Verifica la información de la venta.</p>}
            <footer className={styles.footer}>
              <div className={styles.footerMark} aria-hidden='true'>{process.env.NEXT_PUBLIC_BUSINESS_TITLE}</div>
              <p className={styles.thanks}>{thankYouMessage}</p>
              <p className={styles.footerMessage}>{mode === 'preview' ? 'Vista previa · No acredita un pago' : 'Conserve este comprobante'}</p>
            </footer>
          </div>
          <div className={styles.zigzag} aria-hidden='true' />
        </div>
      </div>
    </div>
    {warnings.length > 0 && <aside className={styles.operatorNotice} aria-label='Validación de la venta'><strong>Verifica antes de continuar</strong><ul>{warnings.map(message => <li key={message}>{message}</li>)}</ul></aside>}
    {handleSubmit && <div className={styles.actionFooter}>
      <RippleButton type='button' disabled={busy || courtesyExtraConflict} loading={submitting || pending} onClick={() => { void submit() }} bgColor='var(--receipt-action)' color='var(--color-base-white)' radius='var(--border-radius-md)' className={styles.actionButton} aria-label='Confirmar venta'>
        <span className={styles.actionContent}><span aria-hidden='true'><Icon icon='IconSales' color='currentColor' size={20} /></span>{busy ? 'Procesando…' : 'Confirmar venta'}</span>
      </RippleButton>
      {submitError && <p className={styles.submitError} role='alert'>{submitError}</p>}
    </div>}
    {process.env.NODE_ENV === 'development' && <div className={styles.debugActions}>
      <p>Diagnóstico local. Revisa nombres de productos y opciones antes de compartir el archivo.</p>
      <button type='button' onClick={() => downloadReceiptDebug({ cart: data, items, financials, payment, store, client,
        configuration: { mode, paper, printableWidthMm: width, hasReference: Boolean(codeText), saleDate: date?.iso ?? null, items: items.length },
        state: { busy, pending, submitting, isPrinting, hasSubmitError: Boolean(submitError), incomplete, hasLocalRef: Boolean(localRef.current), hasComponentRef: Boolean(componentRef.current), hasPendingPrintPromise: Boolean(promiseResolveRef.current), hasSubmitHandler: Boolean(handleSubmit), hasPrintIssueHandler: Boolean(onPrintPreparationIssue) } })}>Descargar JSON de depuración</button>
    </div>}
  </div>
}

export const Prints = React.memo(PrintsMemo)
