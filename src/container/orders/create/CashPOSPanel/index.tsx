'use client'

import Link from 'next/link'
import {
  useCashPOS,
  useFinancialPaymentMethods,
  useOpenCashSession,
  usePreviousCashFloat
} from 'npm-pkg-hook'
import {
  CashDenominationCounter,
  countCashMinor,
  emptyCashCount,
  formatCashMinor,
  getGlobalStyle
} from 'pkg-components'
import { useEffect, useRef, useState } from 'react'

import { CashPaymentSetup } from '../../../finance/cash/CashPaymentSetup'
import styles from './styles.module.css'

type Control = ReturnType<typeof useCashPOS>
type Source = 'PREVIOUS_SESSION' | 'TREASURY' | 'OTHER_DOCUMENTED'
type OpeningInput = {
  registerId: string
  selectedPaymentMethodIds: string[]
  details: ReturnType<typeof emptyCashCount>
  source: Source
  previousSessionId: string | null
  reference: string | null
  notes: string | null
  idempotencyKey: string
}

export function CashPOSPanel({
  control,
  disabled = false,
  onOpeningChange
}: {
  control: Control
  disabled?: boolean
  onOpeningChange?: (open: boolean) => void
}) {
  const [opening, setOpening] = useState(false)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    onOpeningChange?.(opening || locked)
  }, [opening, locked, onOpeningChange])

  useEffect(() => () => onOpeningChange?.(false), [onOpeningChange])

  useEffect(() => {
    if (!control.enabled || !control.known || disabled || locked || opening || control.registerId) return
    const active = control.registers.filter(r => r.active)
    if (active.length === 1) control.selectRegister(active[0].id)
  }, [control.enabled, control.known, control.registerId, control.registers, control.selectRegister, disabled, locked, opening])

  const selected = control.registers.find(r => r.id === control.registerId && r.active)
  const ownOpen = control.session?.status === 'OPEN' && control.session.openedBy === control.access?.actorId

  if (control.known && !control.enabled) return null

  return <section className={styles.panel} aria-label='Caja del punto de venta'>
    <div className={styles.heading}>
      <div>
        <strong>Caja del turno</strong>
        <p role='status' className={styles.status} data-open={ownOpen}>
          {!control.known
            ? 'Consultando caja…'
            : ownOpen
              ? 'Caja abierta · tu sesión'
              : control.session
                ? 'Caja no disponible para cobrar'
                : 'Sin apertura de caja'}
        </p>
      </div>
      <button type='button' className={styles.secondary} disabled={disabled || locked} onClick={() => void control.refresh()}>
        Actualizar
      </button>
    </div>
    <label className={styles.field}>
      Caja física
      <select
        value={control.registerId}
        disabled={disabled || locked || !control.known}
        onChange={e => { setOpening(false); control.selectRegister(e.target.value) }}
      >
        <option value=''>Selecciona una caja</option>
        {control.registers.filter(r => r.active).map(r =>
          <option key={r.id} value={r.id}>{r.name} · {r.code}</option>
        )}
      </select>
    </label>
    {control.blocking && <p className={styles.notice} role='status'>{control.blocking}</p>}
    {ownOpen && <p className={styles.muted}>Turno {control.session?.businessDate}. Los cobros se registran en esta sesión.</p>}
    {control.enabled && control.known && !control.session && selected && control.access?.canOpen && !opening &&
      <button type='button' className={styles.primary} disabled={disabled} onClick={() => setOpening(true)}>
        Abrir caja sin salir de la venta
      </button>
    }
    {opening && selected && control.enabled && control.access?.canOpen &&
      <OpeningForm
        key={selected.id}
        control={control}
        register={selected}
        disabled={disabled}
        setLocked={setLocked}
        onDone={() => { setLocked(false); setOpening(false) }}
      />
    }
    <p className={styles.muted}>
      Arqueos, retiros, cierre y configuración:{' '}
      <Link style={{ color: getGlobalStyle('--color-primary-red') }} href='/finance/cash' rel='noopener noreferrer'>
        Gestión de cajas
      </Link>.
      {' '}No cierres un turno con un cobro pendiente de verificar.
    </p>
  </section>
}

function OpeningForm({
  control,
  register,
  disabled,
  setLocked,
  onDone
}: {
  control: Control
  register: Control['registers'][number]
  disabled: boolean
  setLocked: (value: boolean) => void
  onDone: () => void
}) {
  const [counts, setCounts] = useState(emptyCashCount)
  const [source, setSource] = useState<Source>('TREASURY')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState<OpeningInput | null>(null)
  const [message, setMessage] = useState('')
  const [open] = useOpenCashSession()
  const previous = usePreviousCashFloat(register.id, !control.session)
  const catalog = useFinancialPaymentMethods(Boolean(control.access?.canRead) && !control.session, false)

  const last = previous.data?.getPreviousCashFloat
  const requiredPrevious = last != null && BigInt(last.retainedMinor) > BigInt(0)
  const actualSource = requiredPrevious ? 'PREVIOUS_SESSION' : source
  const counted = countCashMinor(counts)
  const frozen = busy || attempt !== null

  const available = catalog.data?.getFinancialPaymentMethods ?? []
  const validIds = new Set(available
    .filter(method => method.state === 'active' && method.financialKind !== 'UNKNOWN')
    .map(method => method.payId))
  const paymentSelectionValid = selectedPaymentMethodIds.length > 0 &&
    new Set(selectedPaymentMethodIds).size === selectedPaymentMethodIds.length &&
    selectedPaymentMethodIds.every(id => validIds.has(id))

  const ready = !disabled && control.known && !control.session &&
    !previous.loading && !previous.error && previous.data !== undefined &&
    !catalog.loading && !catalog.error && catalog.data !== undefined
  const meetsMinimum = BigInt(counted) >= BigInt(register.minimumFloatMinor ?? '0')
  const sourceValid = actualSource === 'PREVIOUS_SESSION'
    ? Boolean(last && (last.retainedMinor === counted || notes.trim()))
    : Boolean(reference.trim())
  const running = useRef(false)

  const execute = async () => {
    if (running.current || disabled || (!attempt && (!ready || !meetsMinimum || !sourceValid || !paymentSelectionValid))) return

    // Freeze the full request across retries, including payment IDs and idempotency key.
    const input: OpeningInput = attempt ?? {
      registerId: register.id,
      selectedPaymentMethodIds: [...selectedPaymentMethodIds],
      details: counts.map(d => ({ ...d })),
      source: actualSource,
      previousSessionId: actualSource === 'PREVIOUS_SESSION' ? last?.id ?? null : null,
      reference: reference.trim() || null,
      notes: notes.trim() || null,
      idempotencyKey: crypto.randomUUID()
    }

    running.current = true
    setBusy(true)
    setLocked(true)
    setAttempt(input)
    setMessage('')
    try {
      const response = await open({ variables: { input } })
      if (!response.data?.openCashSession?.id) throw new Error('Respuesta de apertura no verificable')
      await control.refresh()
      onDone()
    } catch (error) {
      // Unknown outcome is NOT a new opening: keep exact request and idempotency key.
      setMessage(error instanceof Error ? error.message : 'Resultado desconocido. Verifica la sesión antes de repetir.')
      await control.refresh()
      const gqlErrors = (error as { graphQLErrors?: Array<{ extensions?: { code?: string } }> })?.graphQLErrors
      const code = gqlErrors?.length === 1 ? gqlErrors[0]?.extensions?.code : undefined
      const knownBusinessErrors = [
        'BELOW_MINIMUM', 'INVALID_SOURCE', 'INVALID_PREVIOUS_SESSION',
        'OPENING_VARIANCE', 'SOURCE_REQUIRED', 'PREVIOUS_FLOAT_REQUIRED',
        'REGISTER_INACTIVE', 'FORBIDDEN', 'PAYMENT_METHODS_REQUIRED',
        'INVALID_PAYMENT_SELECTION', 'PAYMENT_SELECTION_REQUIRED',
        'PAYMENT_METHOD_NOT_FOUND', 'PAYMENT_KIND_UNKNOWN'
      ]
      if (code && knownBusinessErrors.includes(code)) {
        setAttempt(null)
        setLocked(false)
      }
    } finally {
      running.current = false
      setBusy(false)
    }
  }

  const visibleOwn = control.known && control.session?.status === 'OPEN' &&
    control.session.openedBy === control.access?.actorId
  if (control.session && !busy) {
    return <div className={styles.form}>
      <p role='status'>
        {visibleOwn
          ? 'El servidor informa una sesión abierta a tu nombre. Verifica que corresponda a este conteo antes de continuar.'
          : 'Ya existe una sesión operativa. Verifica su estado antes de cobrar.'}
      </p>
      <button type='button' className={styles.secondary} onClick={onDone}>Volver al checkout</button>
    </div>
  }

  return <div className={styles.form} aria-busy={busy}>
    <h3>Apertura · {register.name}</h3>
    <p className={styles.muted}>Base sugerida: {formatCashMinor(register.defaultFloatMinor)}. Cuenta el efectivo real, no copies la base sugerida.</p>
    {previous.loading && <p role='status'>Consultando fondo anterior…</p>}
    {previous.error && <p role='alert'>No se pudo consultar el fondo anterior.</p>}
    <CashDenominationCounter value={counts} onChange={setCounts} disabled={disabled || frozen}/>
    <CashPaymentSetup
      methods={available}
      selectedIds={selectedPaymentMethodIds}
      onSelectedChange={setSelectedPaymentMethodIds}
      mode='opening'
      disabled={disabled || frozen || catalog.loading || Boolean(catalog.error)}
      canClassify={false}
      onClassify={() => { /* La clasificación financiera se realiza en Finanzas. */ }}
    />
    {catalog.error && <p role='alert' className={styles.notice}>
      No se pudo consultar el catálogo financiero. Actualiza la caja antes de abrirla.
    </p>}
    <label className={styles.field}>
      Origen del dinero
      <select value={actualSource} disabled={disabled || frozen || requiredPrevious || previous.loading || Boolean(previous.error)} onChange={e => setSource(e.target.value as Source)}>
        <option value='TREASURY'>Tesorería / caja fuerte</option>
        {last && <option value='PREVIOUS_SESSION'>Base retenida del turno anterior</option>}
        <option value='OTHER_DOCUMENTED'>Otro origen documentado</option>
      </select>
    </label>
    {actualSource === 'PREVIOUS_SESSION' && last && <p>Base anterior: {formatCashMinor(last.retainedMinor)}. Si difiere, justifica el conteo.</p>}
    <label className={styles.field}>
      Referencia del fondo
      <input maxLength={200} value={reference} disabled={disabled || frozen} onChange={e => setReference(e.target.value)} placeholder='Recibo / origen'/>
    </label>
    <label className={styles.field}>
      Observaciones*
      <textarea maxLength={1000} rows={2} value={notes} disabled={disabled || frozen} onChange={e => setNotes(e.target.value)}/>
    </label>
    {!meetsMinimum && <p role='alert'>La base contada es inferior al mínimo configurado.</p>}
    {message && <p className={styles.notice} role='alert'>{message}</p>}
    {attempt && <p className={styles.muted}>Si el resultado es incierto, reintenta los mismos datos o verifica el turno. No registres otra apertura.</p>}
    <div className={styles.actions}>
      <button type='button' className={styles.secondary} disabled={frozen || disabled} onClick={onDone}>Cancelar</button>
      <button
        type='button'
        className={styles.primary}
        disabled={disabled || busy || (!attempt && (!ready || !meetsMinimum || !sourceValid || !paymentSelectionValid))}
        onClick={() => void execute()}
      >
        {busy ? 'Verificando…' : attempt ? 'Reintentar apertura' : `Abrir caja · ${formatCashMinor(counted)}`}
      </button>
    </div>
  </div>
}
