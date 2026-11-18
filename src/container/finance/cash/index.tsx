'use client';
import Link from 'next/link';
import {
    type CashRegister, type CashSession, type FinancialKind, useApproveCashClose, useBeginCashClose, useCashContext, useCashCount, useCashMovements, useCashReconciliation, useCashRegisters, useCashSessions, useCashUnlinkedSales, useCloseCashSession, useCurrentCashSession, useFinancialPaymentMethods, useOpenCashSession, usePreviousCashFloat, useRecordCashMovement, useRecordDeliveryCashPayout, useRecountCashClose, useReverseCashMovement, useSaveCashRegister, useSetPaymentFinancialKind, useStore
} from 'npm-pkg-hook';
import {
    CashDenominationCounter, CashVarianceSummary, countCashMinor, emptyCashCount, formatCashMinor, Icon, Text
} from 'pkg-components';
import React, {
    useContext, useEffect, useRef, useState
} from 'react';

import { Context } from '../../../context/Context';
import type { OpeningSource } from './cash-opening-validation';
import {
    assertCashMutationResult, type CashOperationName, describeCashError
} from './cash-operation-result';
import { CashOpeningWizard } from './CashOpeningWizard';
import { CashPaymentSetup } from './CashPaymentSetup';
import styles from './styles.module.css';
const money = (minor: string | null | undefined) => {
    if (minor == null) {
        return '';
    }
    const s = minor.padStart(3, '0');
    return `${s.slice(0, -2)}.${s.slice(-2)}`;
};
const key = () => crypto.randomUUID();
const kindName: Record<FinancialKind, string> = { CASH: 'Efectivo', CARD: 'Tarjeta', BANK_TRANSFER: 'Transferencia', DIGITAL_WALLET: 'Billetera digital', OTHER: 'Otro', UNKNOWN: 'Sin clasificar' };
const statusName: Record<string, string> = { OPEN: 'Abierta', CLOSING: 'En cierre', PENDING_APPROVAL: 'Pendiente de aprobación', CLOSED: 'Cerrada' };
const moveName: Record<string, string> = { MANUAL_IN: 'Entrada adicional', MANUAL_OUT: 'Retiro', EXPENSE: 'Gasto menor', SUPPLIER_PAYMENT: 'Pago a proveedor', CASH_DROP: 'Traslado a custodia', DELIVERY_PAYOUT: 'Liquidación de domiciliario', SALE_CASH: 'Cobro de venta', CLOSING_TRANSFER: 'Traslado al cierre', REVERSAL: 'Contramovimiento' };
type Tab = 'operation' | 'registers' | 'history' | 'methods';
export default function CashManagementPage() { const [store] = useStore(); return store?.idStore ? <CashManagementContent key={store.idStore} storeId={store.idStore} /> : <main className={styles.page}>Selecciona un comercio.</main>; }
function CashManagementContent({ storeId }: {
    storeId: string;
}) {
    const { sendNotification } = useContext(Context);
    const ctx = useCashContext(), response = ctx.data?.cashManagementContext, access = response?.storeId === storeId ? response : undefined;
    const enabled = access?.enabled === true && access.canRead;
    const registers = useCashRegisters(enabled), history = useCashSessions(enabled && access?.canAudit === true), methods = useFinancialPaymentMethods(enabled, false);
    const [tab, setTab] = useState<Tab>('operation'), [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>([]), [registerId, setRegisterId] = useState(''), [historyId, setHistoryId] = useState(''), [after, setAfter] = useState(0);
    const selected = registers.data?.getCashRegisters.find(x => x.id === registerId);
    const sessionQuery = useCurrentCashSession(registerId, enabled), s = sessionQuery.data?.getCurrentCashSession?.registerId === registerId ? sessionQuery.data.getCurrentCashSession : null;
    const previousFloat = usePreviousCashFloat(registerId, enabled && !s);
    const prevFloat = previousFloat.data?.getPreviousCashFloat;
    const reportId = tab === 'history' ? historyId : s?.id ?? '';
    const auditAllowed = enabled && access?.canAudit === true && !!reportId && !(s?.id === reportId && s.openedBy === access.actorId && s.blindCountRequired && !s.closingCountId);
    const report = useCashReconciliation(reportId, auditAllowed), moves = useCashMovements(reportId, auditAllowed, after), unlinked = useCashUnlinkedSales(reportId, auditAllowed);
    const [saveRegister] = useSaveCashRegister(), [open] = useOpenCashSession(), [record] = useRecordCashMovement(), [payout] = useRecordDeliveryCashPayout(), [reverse] = useReverseCashMovement(), [begin] = useBeginCashClose(), [submitCount] = useCashCount(), [recount] = useRecountCashClose(), [approve] = useApproveCashClose(), [close] = useCloseCashSession(), [setKind] = useSetPaymentFinancialKind();
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('tab') === 'methods') {
            setTab('methods');
        }
    }, []);
    const [editing, setEditing] = useState<CashRegister | null>(null), [form, setForm] = useState({ code: '', name: '', defaultFloat: '150000.00', minimumFloat: '0.00', closingTolerance: '1000.00', blindCountRequired: true, active: true });
    const [counts, setCounts] = useState(emptyCashCount), [source, setSource] = useState<OpeningSource>('TREASURY'), [previous, setPrevious] = useState(''), [reference, setReference] = useState(''), [notes, setNotes] = useState(''), [amount, setAmount] = useState(''), [deliveryReference, setDeliveryReference] = useState(''), [payoutConfirmed, setPayoutConfirmed] = useState(false), [movementType, setMovementType] = useState('MANUAL_IN'), [retain, setRetain] = useState('150000.00'), [destination, setDestination] = useState(''), [transferConfirmed, setTransferConfirmed] = useState(false), [action, setAction] = useState<'move' | 'count' | 'recount' | ''>(''), [zeroConfirmed, setZeroConfirmed] = useState(false), [selfConfirmed, setSelfConfirmed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''),
        [notice, setNotice] = useState('');
    // Suggest a retained float from counted cash, never more than the physical count.
    useEffect(() => {
        if (!s?.closingCountId || s.countAtCloseMinor == null || !selected) {
            return;
        }
        const counted = BigInt(s.countAtCloseMinor), suggested = BigInt(selected.defaultFloatMinor);
        setRetain(money((suggested < counted ? suggested : counted).toString()));
        setTransferConfirmed(false);
    }, [s?.closingCountId, selected?.id]);
    const distribution = (() => {
        try {
            if (s?.countAtCloseMinor == null || !/^\d+(?:\.\d{1,2})?$/.test(retain)) {
                return null;
            }
            const [w, f = ''] = retain.split('.'), keep = BigInt(w) * BigInt(100) + BigInt(f.padEnd(2, '0')), counted = BigInt(s.countAtCloseMinor);
            if (keep > counted || keep % BigInt(s.roundingUnitMinor) !== BigInt(0)) {
                return null;
            }
            return { transfer: (counted - keep).toString() };
        }
        catch {
            return null;
        }
    })();
    const running = useRef(false);
    const attempt = useRef<{
        operation: string;
        signature: string;
        id: string;
    } | null>(null);
    /**
     * Apollo puede resolver una mutación con data:null y errors cuando
     * errorPolicy='all'. Una promesa resuelta NO garantiza confirmación.
     */
    const run = async (operation: CashOperationName, variables: Record<string, unknown>, fn: (requestKey: string) => Promise<unknown>): Promise<boolean> => {
        if (running.current) { return false; }
        const signature = JSON.stringify(variables);
        if (attempt.current &&
            (attempt.current.operation !== operation || attempt.current.signature !== signature)) {
            const message = 'Hay una operación con resultado incierto. Verifica el turno o reintenta exactamente los mismos datos.';
            setError(message);
            sendNotification({ title: 'Verifica la operación', description: message, backgroundColor: 'warning' });
            return false;
        }
        const previousAttempt = attempt.current ?? { operation, signature, id: key() };
        attempt.current = previousAttempt;
        running.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const response = await fn(previousAttempt.id);
            // Importante: no afirmar éxito si Apollo retornó data:null con errors.
            assertCashMutationResult(operation, response);
            attempt.current = null;
            const successMessage = operation === 'open'
                ? 'La caja se abrió correctamente y los medios de pago quedaron guardados para este turno.'
                : operation === 'method'
                    ? 'La clasificación del medio de pago se actualizó correctamente.'
                    : 'La operación se registró correctamente.';
            setNotice(successMessage);
            sendNotification({
                title: operation === 'open' ? 'Caja abierta' : 'Operación confirmada',
                description: successMessage,
                backgroundColor: 'success'
            });
            // Una consulta secundaria fallida NO convierte la mutación exitosa en fallo.
            const settled = await Promise.allSettled([
                registers.refetch(),
                ...(registerId ? [sessionQuery.refetch()] : []),
                ...(access?.canAudit ? [
                    history.refetch(),
                    ...(auditAllowed ? [report.refetch(), moves.refetch(), unlinked.refetch()] : [])
                ] : []),
                methods.refetch()
            ]);
            if (settled.some(item => item.status === 'rejected')) {
                sendNotification({
                    title: 'Actualización pendiente',
                    description: 'Se guardó la operación, pero no se pudo actualizar toda la información. Usa Actualizar para sincronizar la pantalla.',
                    backgroundColor: 'warning'
                });
            }
            return true;
        }
        catch (cause) {
            const failure = describeCashError(cause);
            setError(failure.message);
            setNotice('');
            sendNotification({
                title: failure.knownRejection ? 'No se pudo completar' : 'Resultado por verificar',
                description: failure.message,
                backgroundColor: failure.knownRejection ? 'error' : 'warning'
            });
            // Rechazos de negocio confirmados permiten corregir el formulario.
            // Si la red se interrumpe y el resultado es incierto, conservamos
            // la clave idempotente para evitar dobles aperturas o movimientos.
            if (failure.knownRejection) { attempt.current = null; }
            return false;
        }
        finally {
            running.current = false;
            setBusy(false);
        }
    };
    const openingValidationError = (message: string) => {
        setError(message);
        setNotice('');
        sendNotification({ title: 'Revisa la apertura', description: message, backgroundColor: 'warning' });
    };
    const loadRegister = (r: CashRegister | null) => { setEditing(r); setForm(r ? { code: r.code, name: r.name, defaultFloat: money(r.defaultFloatMinor), minimumFloat: money(r.minimumFloatMinor), closingTolerance: money(r.closingToleranceMinor), blindCountRequired: r.blindCountRequired, active: r.active } : { code: '', name: '', defaultFloat: '150000.00', minimumFloat: '0.00', closingTolerance: '1000.00', blindCountRequired: true, active: true }); };
    const choose = (id: string) => { setError(''); setNotice(''); setSelectedPaymentIds([]); setRegisterId(id); setCounts(emptyCashCount()); setZeroConfirmed(false); setSelfConfirmed(false); setAction(''); setAfter(0); setNotes(''); setReference(''); setPrevious(''); setSource('TREASURY'); setTransferConfirmed(false); setDestination(''); };
    const previousRequired = Boolean(prevFloat && BigInt(prevFloat.retainedMinor) > BigInt(0));
    const effectiveSource: OpeningSource = previousRequired ? 'PREVIOUS_SESSION' : source;
    const openingInput = {
        registerId,
        selectedPaymentMethodIds: selectedPaymentIds,
        details: counts,
        source: effectiveSource,
        previousSessionId: effectiveSource === 'PREVIOUS_SESSION' ? (prevFloat?.id ?? previous) : null,
        reference: reference.trim() || null,
        notes: notes.trim() || null
    };
    const pending = report.data?.getCashSessionReconciliation?.session.id === reportId
        ? report.data.getCashSessionReconciliation : undefined;
    const actorOwn = !!s && s.openedBy === access?.actorId;
    const accountable = tab === 'history' ? pending?.session : s;
    const countForm = (phase: 'INTERMEDIATE' | 'CLOSING', session: CashSession, isRecount = false) => {
        const zero = String(countCashMinor(counts)) === '0';
        return <div className={styles.card}><h2>{isRecount ? 'Nuevo conteo de cierre' : phase === 'CLOSING' ? 'Arqueo de cierre' : 'Arqueo intermedio'}</h2><p>{isRecount ? 'El arqueo anterior se conserva. Cuenta físicamente de nuevo; no se ajustan ventas ni movimientos.' : session.blindCountRequired ? 'Conteo ciego: registra las cantidades físicas.' : 'Cuenta el dinero físicamente e indica cualquier novedad.'}</p><CashDenominationCounter value={counts} onChange={v => { setCounts(v); setZeroConfirmed(false); }} disabled={busy} />{zero && <label className={styles.check}><input type='checkbox' checked={zeroConfirmed} disabled={busy} onChange={e => setZeroConfirmed(e.target.checked)} />Confirmo que conté la caja y no hay efectivo físico.</label>}<label>{isRecount ? 'Motivo del reconteo' : 'Observaciones*'}<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label><button disabled={busy || (zero && !zeroConfirmed) || (isRecount && !notes.trim())} onClick={() => {
            if (isRecount) {
                const input = { sessionId: session.id, version: session.version, details: counts, reason: notes, confirmedZero: zeroConfirmed };
                void run('recount', input, key => recount({ variables: { input: { ...input, idempotencyKey: key } } })).then(ok => {
                    if (ok) {
                        setAction('');
                        setZeroConfirmed(false);
                    }
                });
            }
            else {
                const input = { sessionId: session.id, phase, version: session.version, details: counts, notes, confirmedZero: zeroConfirmed };
                void run('count', input, key => submitCount({ variables: { input: { ...input, idempotencyKey: key } } }));
            }
        }}>Confirmar {isRecount ? 'reconteo' : 'conteo'}</button>{isRecount && <button className={styles.secondary} disabled={busy} onClick={() => setAction('')}>Cancelar reconteo</button>}</div>;
    };
    if (ctx.loading && !access) {
        return <main className={styles.page} aria-busy='true'>Consultando caja…</main>;
    }
    if (ctx.error || !enabled) {
        return <main className={styles.page}><h1>Gestión de cajas</h1><p>{ctx.error?.message ?? (response && response.storeId !== storeId ? 'El comercio de la sesión no coincide con el seleccionado.' : 'Módulo no habilitado o sin permisos.')}</p><button onClick={() => void ctx.refetch()}>Actualizar</button></main>;
    }
    return <main className={styles.page}>
        <header className={styles.heading}>
            <div>
                <Text as='span' className={styles.eyebrow}>FINANZAS</Text>
                <Text as='h1' font='semibold'>Gestión de cajas</Text>
                <Text as='p' color='gray'>
                    Control de efectivo, arqueos y turnos de operación.
                </Text>
            </div>
            <Link href='/orders/reconciliation'>
                Conciliación de ventas <Icon icon='IconArrowUpRight' size={20} />
            </Link>
        </header>
        <nav className={styles.tabs} aria-label='Administración financiera'>
            {([['operation', 'Caja actual'], ['registers', 'Configuración'], ['history', 'Historial y conciliación'], ['methods', 'Medios de pago']] as [
                Tab,
                string
            ][]).filter(([k]) => k !== 'history' || access?.canAudit).filter(([k]) => k !== 'registers' && k !== 'methods' || access?.canManage).map(([k, label]) => <button type='button' key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => { setTab(k); setAfter(0); }}>{label}</button>)}</nav>
        {error && <div className={styles.error} role='alert'>{error}</div>}{notice && <div className={styles.notice} role='status'>{notice}</div>}
        {(registers.error || methods.error || sessionQuery.error || history.error || report.error || moves.error || previousFloat.error) && <div className={styles.error} role='alert'>{(registers.error ?? methods.error ?? sessionQuery.error ?? history.error ?? report.error ?? moves.error ?? previousFloat.error)?.message}</div>}
        {registers.loading && <p role='status'>Consultando cajas del establecimiento…</p>}
        {tab === 'registers' && <div className={styles.split}><section className={styles.card}><h2>Cajas físicas</h2>{registers.data?.getCashRegisters.map(r => <button key={r.id} className={styles.listButton} onClick={() => loadRegister(r)}><span>{r.name}<small>{r.code} · {r.active ? 'Activa' : 'Inactiva'}</small></span><strong>{formatCashMinor(r.defaultFloatMinor)}</strong></button>)}<button className={styles.secondary} onClick={() => loadRegister(null)}>Nueva caja</button></section><section className={styles.card}><h2>{editing ? 'Editar caja' : 'Crear caja'}</h2>{(['code', 'name', 'defaultFloat', 'minimumFloat', 'closingTolerance'] as const).map(k => <label key={k}>{({ code: 'Código', name: 'Nombre', defaultFloat: 'Base sugerida (COP)', minimumFloat: 'Base mínima (COP)', closingTolerance: 'Tolerancia (COP)' })[k]}<input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} inputMode={k === 'code' || k === 'name' ? 'text' : 'decimal'} /></label>)}<label className={styles.check}><input type='checkbox' checked={form.blindCountRequired} onChange={e => setForm({ ...form, blindCountRequired: e.target.checked })} />Arqueo ciego obligatorio</label><label className={styles.check}><input type='checkbox' checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />Caja activa</label><button disabled={busy} onClick={() => { const input = { ...form, id: editing?.id, expectedRevision: editing?.revision }; void run('register', input, () => saveRegister({ variables: { input } })); }}>Guardar configuración</button></section></div>}
        {tab === 'methods' && <CashPaymentSetup methods={methods.data?.getFinancialPaymentMethods ?? []} selectedIds={[]} onSelectedChange={() => { }} disabled={busy || !access?.canManage} mode='catalog' canClassify={Boolean(access?.canManage)} onClassify={(payId, financialKind) => {
            const v = { payId, financialKind };
            void run('method', v, () => setKind({ variables: v }));
        }} />}
        {tab === 'operation' && <><section className={styles.card}><label>Selecciona una caja física<select value={registerId} onChange={e => choose(e.target.value)} disabled={busy}><option value=''>Selecciona…</option>{registers.data?.getCashRegisters.filter(r => r.active).map(r => <option key={r.id} value={r.id}>{r.name} · {r.code}</option>)}</select></label>{s && <div className={styles.statusLine}><strong>{statusName[s.status]}</strong><span>Turno {s.businessDate} · {s.id.slice(0, 8)}</span><span>{actorOwn ? 'Tu sesión' : 'Sesión de otro operador'}</span></div>}</section>
            {selected && !s && !sessionQuery.loading && access?.canOpen && (<CashOpeningWizard key={selected.id} register={selected} counts={counts} onCountsChange={setCounts} methods={methods.data?.getFinancialPaymentMethods ?? []} selectedPaymentIds={selectedPaymentIds} onSelectedPaymentChange={setSelectedPaymentIds} canClassify={Boolean(access.canManage)} onClassify={(payId, financialKind) => {
                const variables = { payId, financialKind };
                void run('method', variables, () => setKind({ variables }));
            }} onManageMethods={() => { setTab('methods'); setError(''); setNotice(''); }} methodsReady={!methods.loading && !methods.error && Boolean(methods.data)} source={effectiveSource} onSourceChange={setSource} previousSessionId={prevFloat?.id ?? (previous || null)} previousRetainedMinor={prevFloat?.retainedMinor ?? null} previousReady={!previousFloat.loading && !previousFloat.error && previousFloat.data !== undefined} forcePrevious={previousRequired} reference={reference} onReferenceChange={setReference} notes={notes} onNotesChange={setNotes} disabled={!access.canOpen || Boolean(methods.error) || Boolean(previousFloat.error)} submitting={busy} serverError={error} onValidationError={openingValidationError} onSubmit={() => run('open', openingInput, requestKey => open({
                variables: {
                    input: { ...openingInput, idempotencyKey: requestKey }
                }
            }))} />)}
            {s && s.status === 'OPEN' && actorOwn && <><div className={styles.actions}>{access?.canMove && <button className={styles.secondary} onClick={() => setAction(action === 'move' ? '' : 'move')}>Entradas y salidas</button>}{access?.canClose && <><button className={styles.secondary} onClick={() => { setCounts(emptyCashCount()); setZeroConfirmed(false); setSelfConfirmed(false); setAction('count'); }}>Arqueo intermedio</button><button disabled={busy} onClick={() => {
                if (!window.confirm('El cierre bloqueará nuevos cobros en esta caja. ¿Continuar?')) {
                    return;
                }
                setCounts(emptyCashCount());
                setZeroConfirmed(false);
                setSelfConfirmed(false);
                const v = { sessionId: s.id, version: s.version };
                void run('begin', v, () => begin({ variables: v }));
            }}>Iniciar cierre</button></>}</div>{action === 'move' && <section className={styles.card}><h2>Registrar movimiento real</h2><label>Tipo<select value={movementType} onChange={e => setMovementType(e.target.value)}>{Object.entries(moveName).filter(([k]) => ['MANUAL_IN', 'MANUAL_OUT', 'EXPENSE', 'SUPPLIER_PAYMENT', 'CASH_DROP', 'DELIVERY_PAYOUT'].includes(k)).map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select></label>{movementType === 'DELIVERY_PAYOUT' && <><label>Referencia de venta<input value={deliveryReference} onChange={e => setDeliveryReference(e.target.value)} /></label><label className={styles.check}><input type='checkbox' checked={payoutConfirmed} onChange={e => setPayoutConfirmed(e.target.checked)} />Confirmo que entregué el efectivo al proveedor.</label></>}<label>Importe COP<input inputMode='decimal' placeholder='50000.00' value={amount} onChange={e => setAmount(e.target.value)} /></label><label>Motivo<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label><label>Destino / soporte<input value={reference} onChange={e => setReference(e.target.value)} /></label><button disabled={busy} onClick={() => {
                if (movementType === 'DELIVERY_PAYOUT') {
                    const v = { sessionId: s.id, saleReference: deliveryReference, amount, reason: notes, reference, confirmed: payoutConfirmed };
                    void run('payout', v, id => payout({ variables: { input: { ...v, idempotencyKey: id } } }));
                }
                else {
                    const v = { sessionId: s.id, type: movementType, amount, reason: notes, reference };
                    void run('movement', v, id => record({ variables: { input: { ...v, idempotencyKey: id } } }));
                }
            }}>Registrar movimiento</button></section>}{action === 'count' && countForm('INTERMEDIATE', s)}</>}
            {s?.status === 'CLOSING' && !s.closingCountId && actorOwn && access?.canClose && countForm('CLOSING', s)}
            {s?.closingCountId && s.status !== 'CLOSED' && action === 'recount' && actorOwn && countForm('CLOSING', s, true)}
            {s?.closingCountId && s.status !== 'CLOSED' && action !== 'recount' && <section className={styles.card}><h2>Verificación y cierre</h2>{actorOwn && access?.canClose && !s.approvedBy && <button type='button' className={styles.secondary} disabled={busy} onClick={() => { setCounts(emptyCashCount()); setZeroConfirmed(false); setNotes(''); setAction('recount'); }}>Volver a contar efectivo</button>}<CashVarianceSummary expected={s.expectedAtCountMinor} counted={s.countAtCloseMinor} variance={s.varianceMinor} />{s.status === 'PENDING_APPROVAL' ? <><p>{actorOwn && access?.allowSelfApproval ? 'Modo local de operador único: aprueba únicamente una diferencia real y documentada.' : 'La diferencia supera la tolerancia. Requiere un supervisor distinto del operador.'}</p>{access?.canApprove && (!actorOwn || access.allowSelfApproval) && <>{actorOwn && <label className={styles.check}><input type='checkbox' checked={selfConfirmed} onChange={e => setSelfConfirmed(e.target.checked)} />Confirmo que apruebo mi propio arqueo en modo local de operador único.</label>}<label>Justificación<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label><button disabled={busy || !notes.trim() || (actorOwn && !selfConfirmed)} onClick={() => { const v = { sessionId: s.id, version: s.version, reason: notes, confirmSelfApproval: actorOwn && selfConfirmed }; void run('approve', v, () => approve({ variables: { input: v } })); }}>Aprobar diferencia</button></>}</> : actorOwn && access?.canClose && <><label>Base retenida (COP)<input inputMode='decimal' value={retain} onChange={e => setRetain(e.target.value)} /></label><p>Excedente físico a trasladar: <strong>{distribution ? formatCashMinor(distribution.transfer) : 'Base inválida'}</strong></p><label>Destino de excedente<input value={destination} onChange={e => setDestination(e.target.value)} /></label><label>Justificación<textarea value={notes} onChange={e => setNotes(e.target.value)} /></label><label className={styles.check}><input type='checkbox' checked={transferConfirmed} onChange={e => setTransferConfirmed(e.target.checked)} />Confirmo el traslado físico del excedente (si existe).</label><button disabled={busy || !distribution || (distribution.transfer !== '0' && (!destination.trim() || !transferConfirmed)) || (s.varianceMinor !== '0' && !notes.trim() && !s.reason)} onClick={() => { const v = { sessionId: s.id, version: s.version, retained: retain, destination, reason: notes, confirmedTransfer: transferConfirmed }; void run('finalize', v, id => close({ variables: { input: { ...v, idempotencyKey: id } } })); }}>Cerrar caja definitivamente</button></>}</section>}
        </>}
        {tab === 'history' && <section className={styles.card}><h2>Sesiones registradas</h2><div className={styles.history}>{history.data?.getCashSessions.map(row => <button className={styles.listButton} key={row.id} onClick={() => { setHistoryId(row.id); setAfter(0); }}><span>{row.businessDate} · {statusName[row.status]}<small>{row.id}</small></span><strong>{formatCashMinor(row.countAtCloseMinor)}</strong></button>)}</div></section>}
        {access?.canAudit && accountable && pending && <section className={styles.card}><h2>Conciliación del turno</h2><div className={styles.metrics}><div><small>Saldo esperado reconstruido</small><strong>{formatCashMinor(pending.reconstructedMinor)}</strong></div><div><small>Diferencia de proyección</small><strong>{formatCashMinor(pending.projectionDriftMinor)}</strong></div><div><small>Base inicial</small><strong>{formatCashMinor(accountable.openingMinor)}</strong></div></div>{accountable.closingCountId && <CashVarianceSummary expected={accountable.expectedAtCountMinor} counted={accountable.countAtCloseMinor} variance={accountable.varianceMinor} />}<p>{pending.issues.length ? pending.issues.join(' · ') : 'Proyección y secuencia verificadas.'}</p>{pending.physicalRetainedMinor != null && <p>Efectivo retenido real: {formatCashMinor(pending.physicalRetainedMinor)}. El saldo reconstruido es teórico; no sustituye el efectivo contado.</p>}<h3>Historial de arqueos</h3>{pending.countsHistory?.map(c => <div key={c.id} className={styles.method}><span>{c.phase} · intento {c.attemptNumber} · {c.superseded ? 'Sustituido por reconteo' : c.selected ? 'Seleccionado' : 'Histórico'}<small>{c.notes}</small></span><strong>{formatCashMinor(c.countedMinor)}</strong></div>)}<h3>Ventas sin evidencia de pago en el intervalo del turno</h3>{unlinked.loading && !unlinked.data ? <p>Consultando evidencia…</p> : unlinked.error ? <p role='alert'>{unlinked.error.message}</p> : unlinked.data?.getCashUnlinkedSales?.sessionId === reportId && <><p>{unlinked.data.getCashUnlinkedSales.count} candidatas · {formatCashMinor(unlinked.data.getCashUnlinkedSales.knownPayableMinor)} de importe conocido. La fecha no prueba pertenencia a esta caja ni recepción de dinero.</p>{unlinked.data.getCashUnlinkedSales.candidates.map(row => <div className={styles.method} key={row.saleId}><a href={`/orders/${encodeURIComponent(row.reference)}`}>{row.reference} · {row.paymentName ?? 'Sin medio'}</a><strong>{formatCashMinor(row.payableMinor)}</strong></div>)}</>}<h3>Cobros registrados por medio</h3><p>{pending.confirmedPayments} pagos confirmados por operador · Registro en caja: {pending.paymentPostingVerification}</p>{pending.byPayment.map(p => <div className={styles.method} key={p.kind}><span>{kindName[p.kind]} · {p.count}</span><strong>{formatCashMinor(p.settledMinor)}</strong></div>)}<h3>Movimientos por naturaleza</h3>{pending.byType.map(r => <div className={styles.method} key={r.type}><span>{moveName[r.type] ?? r.type}</span><strong>{formatCashMinor(r.amountMinor)}</strong></div>)}<h3>Últimos movimientos (página de 100)</h3><div className={styles.tableWrap}><table><thead><tr><th>Secuencia</th><th>Movimiento</th><th>Importe</th><th>Referencia</th><th>Corrección</th></tr></thead><tbody>{moves.data?.getCashMovements.map(m => <tr key={m.id}><td>{m.sequence}</td><td>{moveName[m.type] ?? m.type}<small>{m.reason}</small></td><td>{m.direction === 'OUT' ? '− ' : ''}{formatCashMinor(m.amountMinor)}</td><td>{m.reference ?? '—'}</td><td>{tab === 'operation' && s?.status === 'OPEN' && actorOwn && access.canMove && ['MANUAL_IN', 'MANUAL_OUT', 'EXPENSE', 'SUPPLIER_PAYMENT', 'CASH_DROP'].includes(m.type) && <button className={styles.secondary} disabled={busy} onClick={() => {
            const reason = window.prompt('Motivo de corrección');
            if (!reason) {
                return;
            }
            const v = { sessionId: s.id, movementId: m.id, reason };
            void run('reverse', v, id => reverse({ variables: { input: { ...v, idempotencyKey: id } } }));
        }}>Revertir</button>}</td></tr>)}</tbody></table></div><div className={styles.actions}><button className={styles.secondary} onClick={() => setAfter(0)}>Primera página</button><button className={styles.secondary} disabled={(moves.data?.getCashMovements.length ?? 0) < 100} onClick={() => setAfter(moves.data?.getCashMovements.slice(-1)[0]?.sequence ?? after)}>Siguiente</button></div></section>}
    </main>;
}

