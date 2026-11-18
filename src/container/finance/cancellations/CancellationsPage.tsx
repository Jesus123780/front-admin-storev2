'use client'

import {
  type CancellationDisposition,
  type CancelUnpaidOrderInput,
  type ConfirmExternalSaleCancellationInput,
  formatCancellationMinorCOP,
  type RequestCancellationManualReviewInput,
  type RequestFullSaleCancellationInput,
  type SaleCancellationView,
  useCashContext,
  useCashRegisters,
  useCurrentCashSession,
  useSaleCancellation,
  useSaleCancellationLedger,
  useStore,
  type WithdrawPendingSaleCancellationInput
} from 'npm-pkg-hook'
import { Button, Text } from 'pkg-components'
import {
  type FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { Context } from '../../../context/Context'
import styles from './CancellationsPage.module.css'

type Tab = 'operation' | 'ledger'

type Attempt =
  | { action: 'requestFull'; reference: string; input: RequestFullSaleCancellationInput }
  | { action: 'confirmExternal'; reference: string; input: ConfirmExternalSaleCancellationInput }
  | { action: 'withdrawPending'; reference: string; input: WithdrawPendingSaleCancellationInput }
  | { action: 'cancelUnpaid'; reference: string; input: CancelUnpaidOrderInput }
  | { action: 'requestManualReview'; reference: string; input: RequestCancellationManualReviewInput }

const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  NOT_CONCLUDED: { label: 'Pedido sin concluir', tone: 'neutral' },
  RECONCILIATION_REQUIRED: { label: 'Requiere conciliación', tone: 'danger' },
  UNSUPPORTED_PAYMENT: { label: 'Medio de pago no compatible', tone: 'danger' },
  CHARGES_REQUIRE_MANUAL_RECONCILIATION: { label: 'Cargos por conciliar', tone: 'danger' },
  PENDING_OTHER_REFUND: { label: 'Otra devolución pendiente', tone: 'warning' },
  ELIGIBLE: { label: 'Apta para cancelación', tone: 'success' },
  PENDING_EXTERNAL: { label: 'Devolución externa pendiente', tone: 'warning' },
  FINANCIALLY_CANCELLED: { label: 'Cancelada financieramente', tone: 'success' },
  ALREADY_REFUNDED: { label: 'Ya reembolsada', tone: 'success' },
  PENDING_WITHDRAWN: { label: 'Solicitud retirada', tone: 'neutral' },
  ORDER_REJECTED: { label: 'Pedido rechazado', tone: 'neutral' }
}

const ISSUE_NAMES: Record<string, string> = {
  CANCELLATION_FULL_SETTLEMENT_AUDIT_FAILED: 'La conciliación de reembolsos no está completa.',
  CANCELLATION_READ_SNAPSHOT_INCONSISTENT: 'Existen diferencias entre los saldos y los movimientos.',
  CANCELLATION_REFUND_LINK_PENDING: 'Pendiente de enlazar la operación con el reembolso.',
  CANCELLATION_CHARGES_REQUIRE_MANUAL_RECONCILIATION: 'El cobro incluye conceptos que requieren revisión manual.',
  PROVIDER_SETTLEMENT_UNVERIFIED: 'El proveedor de pagos no ha verificado la devolución.',
  CANCELLATION_OPERATION_RECOVERY_REQUIRED: 'La operación necesita recuperación y verificación.',
  CANCELLATION_OPERATION_NEEDS_REVIEW: 'La operación requiere revisión manual.',
  CANCELLATION_OPERATION_PREPARED: 'La operación fue preparada y todavía no está conciliada.'
}

const DISPOSITION_OPTIONS: Array<{ value: CancellationDisposition; label: string }> = [
  { value: 'RESTOCK', label: 'Volver al inventario' },
  { value: 'DAMAGED', label: 'Producto dañado / no reintegrar' },
  { value: 'NO_STOCK', label: 'Sin movimiento de inventario' }
]

function bogotaToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date())
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function shiftDate(iso: string, days: number): string {
  const value = new Date(`${iso}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function validRange(from: string, to: string): boolean {
  const a = Date.parse(`${from}T00:00:00.000Z`)
  const b = Date.parse(`${to}T00:00:00.000Z`)
  return /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) &&
    Number.isFinite(a) && Number.isFinite(b) &&
    new Date(a).toISOString().slice(0, 10) === from &&
    new Date(b).toISOString().slice(0, 10) === to &&
    b >= a && (b - a) / 86400000 < 31
}

function showMoney(raw: string | null | undefined): string {
  return formatCancellationMinorCOP(raw)
}

function readableDate(value: string | null | undefined): string {
  if (!value) {return '—'}
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota'
  }).format(date)
}

function attemptFingerprint(value: Attempt): string {
  const { idempotencyKey: _idempotencyKey, ...rest } = value.input
  return JSON.stringify({ action: value.action, reference: value.reference, input: rest })
}

function isStoredAttempt(raw: unknown): raw is Attempt {
  if (!raw || typeof raw !== 'object') {return false}
  const value = raw as { action?: unknown; reference?: unknown; input?: { idempotencyKey?: unknown } }
  return typeof value.reference === 'string' && value.reference.length > 0 &&
    typeof value.input === 'object' && value.input !== null &&
    typeof value.input.idempotencyKey === 'string' &&
    value.input.idempotencyKey.length > 0 &&
    ['requestFull', 'confirmExternal', 'withdrawPending', 'cancelUnpaid', 'requestManualReview']
      .includes(String(value.action))
}

function StateBadge({ value }: { value: string }) {
  const entry = STATUS[value] ?? { label: value.replaceAll('_', ' '), tone: 'neutral' as const }
  return <span className={styles.badge} data-tone={entry.tone}>{entry.label}</span>
}

function Flag({ ok, label }: { ok: boolean | null; label: string }) {
  return <span className={styles.flag} data-state={ok === null ? 'unknown' : ok ? 'ok' : 'check'}>
    <span aria-hidden='true'>{ok === null ? '·' : ok ? '✓' : '!'}</span>{label}
  </span>
}

function MoneyItem({ label, amount, help }: {
  label: string
  amount: string | null | undefined
  help?: string
}) {
  return <div className={styles.moneyItem}>
    <Text as='span' className={styles.muted}>{label}</Text>
    <Text as='strong' className={styles.moneyValue}>{showMoney(amount)}</Text>
    {help && <Text as='span' className={styles.micro}>{help}</Text>}
  </div>
}

/** The store key remounts the whole financial workflow when the active tenant changes. */
export default function CancellationsPage() {
  const [store] = useStore()
  if (!store?.idStore) {
    return <main className={styles.page}>
      <section className={styles.empty}><Text as='h1' weight={700} customSize={24}>Cancelaciones de ventas</Text>
        <Text as='p'>Selecciona un comercio para consultar sus ventas y cancelaciones.</Text></section>
    </main>
  }
  return <CancellationsWorkspace key={store.idStore} storeId={store.idStore} />
}

function CancellationsWorkspace({ storeId }: { storeId: string }) {
  const { sendNotification } = useContext(Context)
  const [tab, setTab] = useState<Tab>('operation')
  const [inputReference, setInputReference] = useState('')
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [defaultDisposition, setDefaultDisposition] = useState<CancellationDisposition>('RESTOCK')
  const [dispositions, setDispositions] = useState<Record<string, CancellationDisposition>>({})
  const [registerId, setRegisterId] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [externalReference, setExternalReference] = useState('')
  const [externalAttested, setExternalAttested] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [manualClearConfirmed, setManualClearConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const attemptRef = useRef<Attempt | null>(null)
  const runningRef = useRef(false)
  const [storageReady, setStorageReady] = useState(false)
  const [storageError, setStorageError] = useState(false)

  const [from, setFrom] = useState(() => shiftDate(bogotaToday(), -6))
  const [to, setTo] = useState(bogotaToday)
  const [range, setRange] = useState(() => ({ from: shiftDate(bogotaToday(), -6), to: bogotaToday() }))
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'verified' | 'unverified'>('all')

  const { data: cashContextData, loading: cashContextLoading, error: cashContextError } = useCashContext()
  const accessData = cashContextData?.cashManagementContext
  const access = accessData?.storeId === storeId ? accessData : undefined
  const canAudit = access?.enabled === true && access.canAudit
  const canMove = access?.enabled === true && access.canMove
  const canApprove = access?.enabled === true && access.canApprove
  const canExecuteFull = canMove && canApprove

  const { data: registerData, loading: registersLoading, refetch: refetchRegisters } = useCashRegisters(
    access?.enabled === true && access.canRead
  )
  const registers = useMemo(() => (registerData?.getCashRegisters ?? []).filter(item => item.active), [registerData])
  const validRegister = registers.some(item => item.id === registerId) ? registerId : ''
  const { data: sessionData, loading: sessionLoading, refetch: refetchSession } = useCurrentCashSession(
    validRegister, Boolean(canAudit && validRegister)
  )
  const currentSession = sessionData?.getCurrentCashSession
  const cashSession = currentSession?.registerId === validRegister && currentSession.status === 'OPEN' &&
    currentSession.openedBy === access?.actorId ? currentSession : null

  const sale = useSaleCancellation(reference, {
    enabled: Boolean(canAudit), sendNotification
  })
  const cancellation = sale.cancellation
  const ledger = useSaleCancellationLedger(range.from, range.to, {
    enabled: Boolean(canAudit && tab === 'ledger'), sendNotification
  })

  const storageKey = `venty:financial-cancellation:attempt:${storeId}`

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(storageKey)
      if (raw) {
        const saved: unknown = JSON.parse(raw)
        if (!isStoredAttempt(saved)) {throw new Error('Invalid financial attempt')}
        attemptRef.current = saved
        setAttempt(saved)
      }
    } catch {
      setStorageError(true)
    } finally {
      setStorageReady(true)
    }
  }, [storageKey])

  // Supports deep links from the orders list, for example /finance/cancellations?sale=T-123.
  // Do not override a retained uncertain attempt for a different sale.
  useEffect(() => {
    if (!storageReady) {return}
    const params = new URLSearchParams(window.location.search)
    const linkedReference = (params.get('sale') ?? params.get('saleReference') ?? '').trim()
    if (linkedReference && linkedReference.length <= 100 &&
      (!attemptRef.current || attemptRef.current.reference === linkedReference)) {
      setInputReference(linkedReference)
      setReference(linkedReference)
    }
  }, [storageReady])

  const clearAttempt = useCallback(() => {
    try {
      window.sessionStorage.removeItem(storageKey)
      attemptRef.current = null
      setAttempt(null)
      setManualClearConfirmed(false)
      return true
    } catch {
      sendNotification({ title: 'No se pudo liberar el intento',
        description: 'No fue posible actualizar el almacenamiento local. No inicies otro pago.', backgroundColor: 'error' })
      return false
    }
  }, [sendNotification, storageKey])

  const selectedLines = useMemo(() => cancellation?.lines.filter(line => line.remainingQuantity > 0) ?? [], [cancellation])
  const lineDispositions = useMemo(() => selectedLines.map(line => ({
    shoppingCartId: line.shoppingCartId,
    disposition: dispositions[line.shoppingCartId] ?? (line.manageStock === false ? 'NO_STOCK' : defaultDisposition)
  })), [selectedLines, dispositions, defaultDisposition])

  const saleReady = Boolean(cancellation && cancellation.saleReference === reference &&
    !sale.loading && !sale.error && canAudit)
  const isCash = cancellation?.paymentKind === 'CASH'
  const isUnpaid = cancellation?.cancellationStatus === 'NOT_CONCLUDED' && cancellation.historicalState !== 4
  const pendingRefund = cancellation?.latestCancellationRefund?.status === 'PENDING_EXTERNAL'
    ? cancellation.latestCancellationRefund : null
  const canRequestFull = Boolean(saleReady && cancellation?.canRequest && canExecuteFull && selectedLines.length &&
    (!isCash || cashSession) && acknowledged && reason.trim().length > 0 &&
    !sale.busy && !submitting && storageReady && !storageError && !attempt)
  const canReject = Boolean(saleReady && isUnpaid && canExecuteFull && reason.trim() && acknowledged &&
    !sale.busy && !submitting && !attempt && storageReady && !storageError)

  // Every mutating action persists its full payload and UUID BEFORE making a network request.
  // If the response is lost, the retry reuses the identical payload/key after a reload.
  const runAttempt = async (requested: Attempt) => {
    if (runningRef.current || sale.busy || !storageReady || storageError) {return}
    const previous = attemptRef.current
    if (previous && attemptFingerprint(previous) !== attemptFingerprint(requested)) {
      sendNotification({
        title: 'Hay una operación por verificar',
        description: 'No cambies los datos ni generes otro reembolso. Primero reintenta exactamente el mismo intento o concilia su resultado.',
        backgroundColor: 'warning'
      })
      return
    }
    const active = previous ?? requested
    const canPerform = active.action === 'requestFull' || active.action === 'cancelUnpaid'
      ? canExecuteFull
      : active.action === 'confirmExternal' ? canApprove : canMove
    if (!canAudit || !canPerform) {
      sendNotification({ title: 'Permiso insuficiente',
        description: 'Esta operación requiere los permisos financieros correspondientes.', backgroundColor: 'error' })
      return
    }
    if (!previous) {
      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(active))
      } catch {
        setStorageError(true)
        sendNotification({ title: 'No se pudo proteger la operación',
          description: 'No se envió la solicitud: no fue posible guardar la clave de idempotencia.', backgroundColor: 'error' })
        return
      }
      attemptRef.current = active
      setAttempt(active)
    }
    runningRef.current = true
    setSubmitting(true)
    try {
      let view: SaleCancellationView
      switch (active.action) {
        case 'requestFull': view = await sale.requestFull(active.input); break
        case 'confirmExternal': view = await sale.confirmExternal(active.input); break
        case 'withdrawPending': view = await sale.withdrawPending(active.input); break
        case 'cancelUnpaid': view = await sale.cancelUnpaid(active.input); break
        case 'requestManualReview': view = await sale.requestManualReview(active.input); break
      }
      if (view.saleReference !== active.reference ||
        view.operationPhase === 'RECOVERY_REQUIRED' || view.operationPhase === 'PREPARED' ||
        view.issues.includes('CANCELLATION_REFUND_LINK_PENDING') ||
        view.issues.includes('CANCELLATION_OPERATION_LINK_FAILED')) {
        sendNotification({ title: 'Resultado pendiente de conciliación',
          description: 'Se recibió una respuesta, pero no se pudo descartar una operación incompleta. Revisa el estado antes de liberar el intento.',
          backgroundColor: 'warning' })
      } else {
        clearAttempt()
        setAcknowledged(false)
        setExternalAttested(false)
        setReason('')
        setDetails('')
        setWithdrawReason('')
        setExternalReference('')
      }
      void sale.refresh().catch(() => undefined)
    } catch {
      // The hook already calls sendNotification. A rejected promise is NOT proof of rollback.
      // Keep the exact attempt in sessionStorage for a safe replay.
    } finally {
      runningRef.current = false
      setSubmitting(false)
    }
  }

  const createAttempt = <T extends Attempt>(entry: T): T => entry
  const newKey = () => crypto.randomUUID()

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = inputReference.trim()
    if (!next) {return}
    if (attempt && next !== attempt.reference) {
      sendNotification({ title: 'Intento pendiente',
        description: `Antes de cambiar de venta, verifica el intento pendiente asociado a ${attempt.reference}.`, backgroundColor: 'warning' })
      return
    }
    setReference(next)
    setDispositions({})
    setAcknowledged(false)
    setReason('')
  }

  function requestFull() {
    if (!cancellation || !canRequestFull) {return}
    const input: RequestFullSaleCancellationInput = {
      saleReference: reference,
      reason: reason.trim(),
      idempotencyKey: newKey(),
      disposition: defaultDisposition,
      // Every outstanding line is covered, exactly once, as required by the backend.
      lineDispositions,
      cashSessionId: isCash ? cashSession!.id : null
    }
    void runAttempt(createAttempt({ action: 'requestFull', reference, input }))
  }

  function cancelUnpaid() {
    if (!canReject) {return}
    void runAttempt(createAttempt({ action: 'cancelUnpaid', reference,
      input: { saleReference: reference, reason: reason.trim(), idempotencyKey: newKey() } }))
  }

  function confirmExternal() {
    if (!saleReady || !pendingRefund || !canApprove || !externalAttested || !externalReference.trim()) {return}
    void runAttempt(createAttempt({ action: 'confirmExternal', reference,
      input: { refundId: pendingRefund.id, externalReference: externalReference.trim(),
        externallyVerified: true, idempotencyKey: newKey() } }))
  }

  function withdrawPending() {
    if (!saleReady || !pendingRefund || !canMove || !withdrawReason.trim()) {return}
    void runAttempt(createAttempt({ action: 'withdrawPending', reference,
      input: { refundId: pendingRefund.id, reason: withdrawReason.trim(), idempotencyKey: newKey() } }))
  }

  function requestManualReview() {
    if (!saleReady || !canMove || !cancellation || !reason.trim() || !details.trim()) {return}
    void runAttempt(createAttempt({ action: 'requestManualReview', reference,
      input: { saleReference: reference, reason: reason.trim(), details: details.trim(),
        idempotencyKey: newKey() } }))
  }

  const retryPrevious = () => { if (attempt) {void runAttempt(attempt)} }

  function submitDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validRange(from, to)) {
      sendNotification({ title: 'Rango de fechas inválido',
        description: 'Selecciona fechas válidas y un periodo inclusivo de máximo 31 días.', backgroundColor: 'warning' })
      return
    }
    if (range.from === from && range.to === to) {
      void ledger.refetch().catch(() => undefined)
    } else {
      setRange({ from, to })
    }
  }

  const filteredRows = useMemo(() => (ledger.rows ?? []).filter(row =>
    ledgerFilter === 'all' || (ledgerFilter === 'verified' ? row.accountingVerified : !row.accountingVerified)
  ), [ledger.rows, ledgerFilter])

  return <main className={styles.page}>
    <header className={styles.header}>
      <div>
        <Text as='span' className={styles.eyebrow}>FINANZAS / CONTROL DE VENTAS</Text>
        <Text as='h1' customSize='clamp(1.5rem, 3vw, 2.15rem)' weight={700} className={styles.pageTitle}>
          Cancelaciones de ventas
        </Text>
        <Text as='p' className={styles.lead}>
          Gestiona cancelaciones completas, devoluciones pendientes y su conciliación sin alterar el historial original de la venta.
        </Text>
      </div>
      <span className={styles.headerIcon} aria-hidden='true'>↶</span>
    </header>

    <nav className={styles.tabs} aria-label='Secciones de cancelaciones'>
      <Button type='button' className={styles.tab} aria-current={tab === 'operation' ? 'page' : undefined}
        onClick={() => setTab('operation')}>Gestionar cancelación</Button>
      <Button type='button' className={styles.tab} aria-current={tab === 'ledger' ? 'page' : undefined}
        onClick={() => setTab('ledger')}>Conciliación y auditoría</Button>
    </nav>

    {cashContextLoading && <section className={styles.notice} role='status'>Consultando permisos financieros…</section>}
    {cashContextError && <section className={styles.notice} data-tone='danger' role='alert'>No se pudo consultar el acceso a caja: {cashContextError.message}</section>}
    {!cashContextLoading && !canAudit && !cashContextError && <section className={styles.notice} data-tone='warning' role='alert'>
      Este comercio u operador no tiene habilitada la consulta de cancelaciones. Solicita permisos de auditoría financiera.
    </section>}
    {storageError && <section className={styles.notice} data-tone='danger' role='alert'>
      No se pudo recuperar el registro local de idempotencia. Se deshabilitaron nuevas operaciones para evitar pagos duplicados.
    </section>}

    {tab === 'operation' ? <>
      <section className={styles.panel} aria-labelledby='search-title'>
        <div className={styles.panelHeader}>
          <div><Text as='h2' customSize={18} weight={700} id='search-title'>Buscar venta</Text>
            <Text as='p' className={styles.muted}>Ingresa el código de referencia tal como aparece en el comprobante.</Text></div>
        </div>
        <form className={styles.searchForm} onSubmit={submitSearch}>
          <label className={styles.field} htmlFor='cancellation-sale-reference'>
            <span>Referencia de venta</span>
            <input id='cancellation-sale-reference' value={inputReference} maxLength={100}
              placeholder='Ej. T-52285375' autoComplete='off' onChange={event => setInputReference(event.target.value)} required />
          </label>
          <Button type='submit' primary disabled={!inputReference.trim() || submitting || sale.busy || !canAudit}>
            Consultar venta
          </Button>
          <Button type='button' disabled={!reference || sale.loading || !canAudit} onClick={() => {
            void sale.refresh().catch(() => undefined)
          }}>Actualizar</Button>
        </form>
      </section>

      {attempt && <section className={styles.attemptPanel} role='alert' aria-label='Intento financiero sin verificar'>
        <div className={styles.attemptHeading}>
          <Text as='strong'>Intento financiero pendiente de verificación</Text>
          <span className={styles.attemptId}>Venta {attempt.reference} · {attempt.action}</span>
        </div>
        <Text as='p'>El resultado del último intento podría haberse registrado aunque se haya perdido la respuesta. No generes otra operación hasta conciliarlo. Puedes reintentar exactamente los mismos datos con su misma clave.</Text>
        <div className={styles.buttonRow}>
          <Button type='button' primary onClick={retryPrevious} disabled={submitting || sale.busy}>Reintentar el mismo intento</Button>
          <Button type='button' onClick={() => {
            setInputReference(attempt.reference); setReference(attempt.reference)
            void sale.refresh().catch(() => undefined)
          }}>Consultar estado de esa venta</Button>
        </div>
        <label className={styles.checkRow}>
          <input type='checkbox' checked={manualClearConfirmed} onChange={event => setManualClearConfirmed(event.target.checked)} />
          <span>Ya concilié esta operación con los registros del servidor y confirmo que puedo liberar el bloqueo local.</span>
        </label>
        <Button type='button' disabled={!manualClearConfirmed || submitting || sale.busy} onClick={clearAttempt}>
          Liberar después de conciliar
        </Button>
      </section>}

      {reference && sale.loading && <section className={styles.notice} role='status'>Consultando estado, inventario y reembolsos de la venta…</section>}
      {reference && sale.error && <section className={styles.notice} data-tone='danger' role='alert'>
        No fue posible verificar la venta: {sale.error.message}
      </section>}

      {!reference && <section className={styles.empty}>
        <span className={styles.emptyIcon} aria-hidden='true'>⌕</span>
        <Text as='h2' customSize={20} weight={700}>Consulta una venta para comenzar</Text>
        <Text as='p'>Podrás ver su estado financiero, mercancía, movimientos de inventario y operaciones permitidas.</Text>
      </section>}

      {cancellation && reference && cancellation.saleReference === reference && <>
        <section className={styles.saleSummary} aria-label='Resumen de cancelación'>
          <div className={styles.summaryTop}>
            <div>
              <Text as='span' className={styles.eyebrow}>VENTA CONSULTADA</Text>
              <Text as='h2' customSize={23} weight={700}>{cancellation.saleReference}</Text>
              <Text as='p' className={styles.micro}>Estado comercial: {cancellation.commercialStatus}</Text>
            </div>
            <StateBadge value={cancellation.cancellationStatus} />
          </div>
          <div className={styles.moneyGrid}>
            <MoneyItem label='Mercancía original' amount={cancellation.originalMerchandiseMinor} />
            <MoneyItem label='Cobro original' amount={cancellation.originalCollectedMinor} />
            <MoneyItem label='Devoluciones confirmadas' amount={cancellation.confirmedRefundMinor} />
            <MoneyItem label='Devoluciones pendientes' amount={cancellation.pendingRefundMinor} />
            <MoneyItem label='Mercancía neta' amount={cancellation.verified ? cancellation.effectiveMerchandiseMinor : null}
              help={cancellation.verified ? 'Conciliada internamente' : 'No verificable todavía'} />
          </div>
          <div className={styles.flags}>
            <Flag ok={cancellation.verified} label='Conciliación interna' />
            <Flag ok={cancellation.kardexVerified} label='Kardex' />
            <Flag ok={cancellation.cashVerified} label='Caja / movimientos' />
            <Flag ok={cancellation.providerVerified} label='Confirmación del proveedor' />
          </div>
        </section>

        <div className={styles.workspace}>
          <div className={styles.mainColumn}>
            <section className={styles.panel} aria-labelledby='products-title'>
              <div className={styles.panelHeader}>
                <div>
                  <Text as='h2' id='products-title' customSize={18} weight={700}>Productos e inventario</Text>
                  <Text as='p' className={styles.muted}>La cancelación total cubre todas las unidades restantes. Indica qué productos vuelven al stock.</Text>
                </div>
                <span className={styles.counter}>{selectedLines.length} líneas pendientes</span>
              </div>
              <div className={styles.field}>
                <label htmlFor='default-disposition'>Tratamiento de inventario predeterminado</label>
                <select id='default-disposition' value={defaultDisposition} disabled={!!attempt || sale.busy || submitting}
                  onChange={event => { setDefaultDisposition(event.target.value as CancellationDisposition); setAcknowledged(false) }}>
                  {DISPOSITION_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className={styles.productList}>
                {cancellation.lines.length === 0 && <Text as='p' className={styles.muted}>No se encontraron líneas de inventario para esta venta.</Text>}
                {cancellation.lines.map(line => {
                  const enabled = line.remainingQuantity > 0
                  const value = dispositions[line.shoppingCartId] ?? (line.manageStock === false ? 'NO_STOCK' : defaultDisposition)
                  return <article key={line.shoppingCartId} className={styles.product}>
                    <div className={styles.productMain}>
                      <div className={styles.productSymbol} aria-hidden='true'>◫</div>
                      <div className={styles.productInfo}>
                        <Text as='strong'>{line.productName}</Text>
                        <Text as='span' className={styles.micro}>Vendidas: {line.soldQuantity} · Devueltas: {line.returnedQuantity} · Reservadas: {line.reservedQuantity}</Text>
                        <Text as='span' className={styles.micro}>Restituidas: {line.restockedQuantity} · Stock actual: {line.currentStock ?? 'No disponible'}</Text>
                        {line.extras.length > 0 && <details className={styles.extras}>
                          <summary>Ver {line.extras.length} complementos</summary>
                          {line.extras.map(extra => <div key={extra.catalogId} className={styles.extraItem}>
                            {extra.name} · {extra.soldQuantity} vendidos · {extra.restockedQuantity} restituidos
                          </div>)}
                        </details>}
                      </div>
                    </div>
                    <div className={styles.productControls}>
                      <Text as='span' className={styles.quantity}>
                        {enabled ? `${line.remainingQuantity} por devolver` : 'Sin unidades pendientes'}
                      </Text>
                      {enabled && <label className={styles.field}>
                        <span className={styles.micro}>Destino del inventario</span>
                        <select value={value} disabled={!!attempt || submitting || sale.busy || !canExecuteFull}
                          onChange={event => {
                            setDispositions(current => ({ ...current, [line.shoppingCartId]: event.target.value as CancellationDisposition }))
                            setAcknowledged(false)
                          }}>
                          {DISPOSITION_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      </label>}
                    </div>
                  </article>
                })}
              </div>
              <Text as='p' className={styles.hint}>Los complementos siguen la disposición de su línea. Si una mercancía está dañada, no la ingreses nuevamente al inventario.</Text>
            </section>

            <section className={styles.panel} aria-labelledby='audit-title'>
              <div className={styles.panelHeader}>
                <div><Text as='h2' id='audit-title' customSize={18} weight={700}>Verificaciones y trazabilidad</Text>
                  <Text as='p' className={styles.muted}>Se muestran evidencias del backend, no estimaciones del navegador.</Text></div>
              </div>
              <dl className={styles.detailsGrid}>
                <div><dt>Medio de pago original</dt><dd>{cancellation.paymentKind ?? 'Sin clasificar'}</dd></div>
                <div><dt>Fase de operación</dt><dd>{cancellation.operationPhase ?? 'Sin operación registrada'}</dd></div>
                <div><dt>Estado fiscal</dt><dd>{cancellation.fiscalStatus ?? 'Sin registro'}</dd></div>
                <div><dt>Id. operación</dt><dd className={styles.monospace}>{cancellation.operationId ?? '—'}</dd></div>
                <div><dt>Cargos excluidos</dt><dd>{showMoney(cancellation.excludedChargesMinor)}</dd></div>
                <div><dt>Estado histórico</dt><dd>{cancellation.historicalState}</dd></div>
              </dl>
              {cancellation.issues.length > 0 ? <div className={styles.issues} role='alert'>
                <Text as='strong'>Observaciones que requieren atención</Text>
                <ul>{cancellation.issues.map((issue, index) =>
                  <li key={`${issue}-${index}`}>{ISSUE_NAMES[issue] ?? issue}</li>)}</ul>
              </div> : <Text as='p' className={styles.positive}>El servidor no reportó observaciones adicionales para esta proyección.</Text>}
            </section>
          </div>

          <aside className={styles.sideColumn} aria-label='Acciones de cancelación'>
            <section className={styles.panel}>
              <Text as='h2' customSize={18} weight={700}>Ejecutar operación</Text>
              <Text as='p' className={styles.muted}>Solo se habilitan las acciones compatibles con el estado de la venta y tus permisos.</Text>
              <label className={styles.field} htmlFor='cancel-reason'>Motivo de la operación</label>
              <textarea id='cancel-reason' className={styles.textarea} rows={3} maxLength={970}
                placeholder='Describe el motivo de la cancelación o la revisión'
                value={reason} disabled={!!attempt || submitting || sale.busy}
                onChange={event => { setReason(event.target.value); setAcknowledged(false) }} />

              {isCash && cancellation.canRequest && <div className={styles.cashBox}>
                <Text as='strong'>Devolución en efectivo</Text>
                <Text as='p' className={styles.micro}>El dinero saldrá de una caja abierta a tu nombre. La operación registrará movimiento de caja y kardex.</Text>
                <label className={styles.field} htmlFor='cancellation-register'>Caja donde se registrará la salida</label>
                <select id='cancellation-register' value={validRegister}
                  onChange={event => { setRegisterId(event.target.value); setAcknowledged(false) }}
                  disabled={registersLoading || !!attempt || submitting || sale.busy}>
                  <option value=''>Selecciona una caja</option>
                  {registers.map(register => <option key={register.id} value={register.id}>
                    {register.code} · {register.name}
                  </option>)}
                </select>
                {validRegister && <Text as='p' className={styles.micro}>
                  {sessionLoading ? 'Consultando sesión…' : cashSession
                    ? `Caja abierta · ${cashSession.businessDate} · turno ${cashSession.id.slice(0, 8)}`
                    : 'Esta caja no tiene una sesión OPEN válida para el operador autenticado.'}
                </Text>}
                <div className={styles.buttonRow}>
                  <Button type='button' disabled={!validRegister || sessionLoading} onClick={() => {
                    void refetchSession().catch(() => undefined)
                  }}>Actualizar sesión</Button>
                  <Button type='button' disabled={registersLoading} onClick={() => {
                    void refetchRegisters().catch(() => undefined)
                  }}>Actualizar cajas</Button>
                </div>
              </div>}

              {(cancellation.canRequest || isUnpaid) && <label className={styles.checkRow}>
                <input type='checkbox' checked={acknowledged} disabled={!!attempt || sale.busy || submitting}
                  onChange={event => setAcknowledged(event.target.checked)} />
                <span>{isCash ? 'Confirmo que revisé los importes y que entregaré físicamente el efectivo indicado.'
                  : isUnpaid ? 'Confirmo que este pedido no fue cobrado y debe rechazarse.'
                    : 'Revisé la venta, sus importes, el inventario y el destino de la devolución.'}</span>
              </label>}

              {cancellation.canRequest && <Button type='button' primary className={styles.fullButton}
                disabled={!canRequestFull} loading={submitting && sale.pendingAction === 'requestFull'} onClick={requestFull}>
                {isCash ? 'Registrar cancelación en efectivo' : 'Solicitar cancelación total'}
              </Button>}
              {isUnpaid && cancellation.cancellationStatus !== 'ORDER_REJECTED' && <Button type='button' primary
                className={styles.fullButton} disabled={!canReject} onClick={cancelUnpaid}>
                Rechazar pedido sin cobro
              </Button>}

              {!canExecuteFull && (isUnpaid || cancellation.canRequest) && <Text as='p' className={styles.warningText}>
                Se requieren permisos para mover y aprobar operaciones financieras.
              </Text>}
              {!cancellation.canRequest && !isUnpaid && <Text as='p' className={styles.hint}>
                La venta no puede cancelarse automáticamente en su estado actual. Consulta las observaciones o solicita conciliación manual.
              </Text>}
            </section>

            {pendingRefund && <section className={styles.panel} aria-labelledby='pending-title'>
              <Text as='h2' id='pending-title' customSize={18} weight={700}>Devolución externa pendiente</Text>
              <div className={styles.pendingAmount}>{showMoney(pendingRefund.amountMinor)}</div>
              <Text as='p' className={styles.micro}>ID de devolución: <span className={styles.monospace}>{pendingRefund.id}</span></Text>
              <Text as='p' className={styles.muted}>No se ha acreditado una confirmación bancaria. Esta sección registra exclusivamente una constancia del operador.</Text>
              {canApprove && <>
                <label className={styles.field} htmlFor='external-reference'>Comprobante o referencia externa</label>
                <input id='external-reference' maxLength={200} placeholder='Identificador real del proveedor'
                  value={externalReference} disabled={!!attempt || sale.busy || submitting}
                  onChange={event => { setExternalReference(event.target.value); setExternalAttested(false) }} />
                <label className={styles.checkRow}>
                  <input type='checkbox' checked={externalAttested} disabled={!!attempt || sale.busy || submitting}
                    onChange={event => setExternalAttested(event.target.checked)} />
                  <span>Consulté el soporte externo y dejo constancia como operador. Entiendo que no es verificación bancaria.</span>
                </label>
                <Button type='button' className={styles.fullButton} primary disabled={!saleReady || !externalAttested || !externalReference.trim() || !!attempt || sale.busy || submitting}
                  onClick={confirmExternal}>Registrar constancia externa</Button>
              </>}
              {canMove && <>
                <div className={styles.subSection}>
                  <Text as='strong'>Retirar solicitud no pagada</Text>
                  <Text as='p' className={styles.micro}>No es posible retirar una devolución ya pagada.</Text>
                  <label className={styles.field} htmlFor='withdraw-reason'>Motivo del retiro</label>
                  <textarea id='withdraw-reason' className={styles.textarea} maxLength={1000} rows={2}
                    value={withdrawReason} disabled={!!attempt || sale.busy || submitting}
                    onChange={event => setWithdrawReason(event.target.value)} />
                  <Button type='button' className={styles.fullButton} disabled={!saleReady || !withdrawReason.trim() || !!attempt || sale.busy || submitting}
                    onClick={withdrawPending}>Retirar solicitud pendiente</Button>
                </div>
              </>}
            </section>}

            {canMove && cancellation.operationPhase !== 'NEEDS_REVIEW' && <section className={styles.panel}>
              <Text as='h2' customSize={18} weight={700}>Conciliación manual</Text>
              <Text as='p' className={styles.muted}>Registra un caso para revisión sin devolver dinero ni modificar existencias.</Text>
              <label className={styles.field} htmlFor='cancellation-details'>Detalle para el equipo de conciliación</label>
              <textarea id='cancellation-details' className={styles.textarea} rows={3} maxLength={3000}
                value={details} placeholder='Describe el cobro, las evidencias y el problema encontrado'
                disabled={!!attempt || sale.busy || submitting} onChange={event => setDetails(event.target.value)} />
              <Button type='button' className={styles.fullButton}
                disabled={!saleReady || !reason.trim() || !details.trim() || !!attempt || sale.busy || submitting || !storageReady || storageError}
                onClick={requestManualReview}>Solicitar revisión manual</Button>
            </section>}
          </aside>
        </div>
      </>}
    </> : <>
      <section className={styles.panel} aria-labelledby='ledger-title'>
        <div className={styles.panelHeader}>
          <div><Text as='h2' id='ledger-title' customSize={18} weight={700}>Conciliación de cancelaciones</Text>
            <Text as='p' className={styles.muted}>Solo se incluyen devoluciones confirmadas vinculadas a cancelaciones. Periodos de hasta 31 días, zona horaria Bogotá.</Text></div>
        </div>
        <form className={styles.rangeForm} onSubmit={submitDates}>
          <label className={styles.field}>Desde<input type='date' value={from} onChange={event => setFrom(event.target.value)} required /></label>
          <label className={styles.field}>Hasta<input type='date' value={to} onChange={event => setTo(event.target.value)} required /></label>
          <Button type='submit' primary disabled={!canAudit || ledger.loading}>Consultar periodo</Button>
          <Button type='button' disabled={!canAudit || ledger.loading} onClick={() => {
            void ledger.refetch().catch(() => undefined)
          }}>Actualizar</Button>
        </form>
        <Text as='p' className={styles.micro}>Periodo consultado: {range.from} al {range.to} · {ledger.ledger?.timezone ?? 'America/Bogota'} · {ledger.ledger?.currency ?? 'COP'}</Text>
      </section>
      {ledger.loading && <section className={styles.notice} role='status'>Consultando la conciliación financiera…</section>}
      {ledger.error && <section className={styles.notice} data-tone='danger' role='alert'>{ledger.error.message}</section>}
      {ledger.summary && <>
        <section className={styles.ledgerMetrics} aria-label='Indicadores de conciliación'>
          <div className={styles.metricCard}>
            <Text as='span' className={styles.muted}>Total verificado internamente</Text>
            <Text as='strong' customSize={25}>{showMoney(ledger.summary.confirmedVerifiedMinor)}</Text>
            <Text as='span' className={styles.micro}>{ledger.summary.confirmedCount} movimientos</Text>
          </div>
          <div className={styles.metricCard}>
            <Text as='span' className={styles.muted}>Excluido por falta de verificación</Text>
            <Text as='strong' customSize={25}>{showMoney(ledger.summary.excludedUnverifiedMinor)}</Text>
            <Text as='span' className={styles.micro}>{ledger.summary.unverifiedCount} movimientos</Text>
          </div>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div><Text as='h2' customSize={18} weight={700}>Movimientos registrados</Text>
              <Text as='p' className={styles.muted}>Los movimientos sin conciliación interna no se cuentan como verificados.</Text></div>
            <label className={styles.field}>Mostrar
              <select value={ledgerFilter} onChange={event => setLedgerFilter(event.target.value as typeof ledgerFilter)}>
                <option value='all'>Todos</option>
                <option value='verified'>Verificados</option>
                <option value='unverified'>Por revisar</option>
              </select>
            </label>
          </div>
          <div className={styles.tableViewport}>
            <table className={styles.table}>
              <thead><tr><th scope='col'>Referencia</th><th scope='col'>Confirmación</th><th scope='col'>Medio</th>
                <th scope='col'>Importe</th><th scope='col'>Conciliación</th><th scope='col'>Hallazgos</th></tr></thead>
              <tbody>
                {filteredRows.map(row => <tr key={row.refundId}>
                  <td><strong>{row.saleReference}</strong><span className={styles.micro}>{row.refundId.slice(0, 12)}</span></td>
                  <td>{readableDate(row.confirmedAt)}</td>
                  <td>{row.paymentKind}</td>
                  <td className={styles.monospace}>{showMoney(row.amountMinor)}</td>
                  <td><span className={styles.badge} data-tone={row.accountingVerified ? 'success' : 'danger'}>
                    {row.accountingVerified ? 'Conciliada internamente' : 'Requiere revisión'}
                  </span><span className={styles.micro}>Proveedor: {row.providerVerified ? 'verificado' : 'sin verificar'}</span></td>
                  <td>{row.issues.length ? <details className={styles.ledgerIssues}>
                    <summary>{row.issues.length} observaciones</summary>
                    <ul>{row.issues.map((issue, index) => <li key={`${issue}-${index}`}>{ISSUE_NAMES[issue] ?? issue}</li>)}</ul>
                  </details> : '—'}</td>
                </tr>)}
                {!filteredRows.length && <tr><td colSpan={6} className={styles.tableEmpty}>
                  No hay movimientos para el periodo o filtro seleccionado.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </>}
    </>}
  </main>
}
