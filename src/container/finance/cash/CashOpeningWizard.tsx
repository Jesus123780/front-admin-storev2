'use client';
import React, { useId, useMemo, useState } from 'react';
import type { CashRegister, FinancialKind, FinancialMethod } from 'npm-pkg-hook';
import { CashDenominationCounter, countCashMinor, formatCashMinor, Stepper, Text } from 'pkg-components';
import { CashPaymentSetup } from './CashPaymentSetup';
import { validateCashOpening, type OpeningSource, type OpeningStep } from './cash-opening-validation';
import styles from './styles.module.css';
type Counts = React.ComponentProps<typeof CashDenominationCounter>['value'];
interface CashOpeningWizardProps {
    register: CashRegister;
    counts: Counts;
    onCountsChange: (counts: Counts) => void;
    methods: FinancialMethod[];
    selectedPaymentIds: string[];
    onSelectedPaymentChange: (ids: string[]) => void;
    canClassify: boolean;
    onClassify: (payId: string, kind: FinancialKind) => void;
    onManageMethods: () => void;
    methodsReady: boolean;
    source: OpeningSource;
    onSourceChange: (value: OpeningSource) => void;
    previousSessionId: string | null;
    previousRetainedMinor: string | null;
    previousReady: boolean;
    forcePrevious?: boolean;
    reference: string;
    onReferenceChange: (value: string) => void;
    notes: string;
    onNotesChange: (value: string) => void;
    disabled?: boolean;
    submitting?: boolean;
    serverError?: string;
    onValidationError: (message: string) => void;
    onSubmit: () => Promise<unknown> | void;
}
const STEPS = ['Contar efectivo', 'Medios de pago', 'Origen y confirmar'];
export function CashOpeningWizard({ register, counts, onCountsChange, methods, selectedPaymentIds, onSelectedPaymentChange, canClassify, onClassify, onManageMethods, methodsReady, source, onSourceChange, previousSessionId, previousRetainedMinor, previousReady, forcePrevious = false, reference, onReferenceChange, notes, onNotesChange, disabled = false, submitting = false, serverError, onValidationError, onSubmit }: CashOpeningWizardProps) {
    const titleId = useId();
    const [step, setStep] = useState<OpeningStep>(0);
    const [attempted, setAttempted] = useState(false);
    const countedMinor = String(countCashMinor(counts));
    const availableNames = useMemo(() => {
        const ids = new Set(selectedPaymentIds);
        return methods.filter(m => ids.has(m.payId)).map(m => m.name);
    }, [methods, selectedPaymentIds]);
    const draft = {
        registerId: register.id,
        minimumFloatMinor: register.minimumFloatMinor,
        countedMinor,
        methods,
        selectedPaymentMethodIds: selectedPaymentIds,
        source,
        previousSessionId,
        previousRetainedMinor,
        reference,
        notes,
        catalogReady: methodsReady,
        previousReady
    };
    const validation = validateCashOpening(draft);
    const visibleIssue = attempted && validation?.step === step ? validation : null;
    const moveTo = (requested: number) => {
        if (disabled || submitting || requested < 0 || requested > 2)
            return;
        if (requested <= step) {
            setStep(requested as OpeningStep);
            setAttempted(false);
            return;
        }
        const error = validateCashOpening(draft);
        if (error && error.step < requested) {
            setStep(error.step);
            setAttempted(true);
            onValidationError(error.message);
            return;
        }
        setStep(requested as OpeningStep);
        setAttempted(false);
    };
    const submit = () => {
        if (disabled || submitting)
            return;
        const error = validateCashOpening(draft);
        if (error) {
            setStep(error.step);
            setAttempted(true);
            onValidationError(error.message);
            return;
        }
        void onSubmit();
    };
    return (<section className={styles.openingWizard} aria-labelledby={titleId} aria-busy={submitting}>
      <div className={styles.openingHeading}>
        <div>
          <Text as='span' className={styles.eyebrow}>APERTURA GUIADA</Text>
          <Text as='h2' id={titleId} className={styles.openingTitle} font='semibold'>Abrir {register.name}</Text>
          <Text as='p' className={styles.mutedText}>
            Tres pasos para registrar la base y definir cómo cobrarás en este turno.
          </Text>
        </div>
        <span className={styles.openingProgress}>Paso {step + 1} de 3</span>
      </div>

      <div className={styles.stepper} aria-label='Progreso de apertura de caja'>
        <Stepper mode='line' active={step} steps={STEPS} onClick={moveTo}/>
      </div>

      {step === 0 && (<div className={styles.stepContent}>
          <div className={styles.stepIntro}>
            <Text as='h3' font='semibold'>Cuenta el dinero real</Text>
            <Text as='p' color='gray'>No copies la base sugerida: registra las cantidades de billetes y monedas que tienes físicamente.</Text>
          </div>
          <div className={styles.countSummary}>
            <div><Text as='span' color='gray'>Base mínima</Text><strong>{formatCashMinor(register.minimumFloatMinor)}</strong></div>
            <div><Text as='span' color='gray'>Base sugerida</Text><strong>{formatCashMinor(register.defaultFloatMinor)}</strong></div>
            <div><Text as='span' color='gray'>Total contado</Text><strong>{formatCashMinor(countedMinor)}</strong></div>
          </div>
          <div className={styles.denominationContainer}>
            <CashDenominationCounter value={counts} onChange={onCountsChange} disabled={disabled || submitting}/>
          </div>
        </div>)}

      {step === 1 && (<div className={styles.stepContent}>
          <CashPaymentSetup methods={methods} selectedIds={selectedPaymentIds} onSelectedChange={onSelectedPaymentChange} mode='opening' disabled={disabled || submitting || !methodsReady} canClassify={canClassify} onClassify={onClassify} onManageMethods={onManageMethods}/>
        </div>)}

      {step === 2 && (<div className={styles.stepContent}>
          <div className={styles.stepIntro}>
            <Text as='h3' font='semibold'>Documenta el origen de la base</Text>
            <Text as='p' color='gray'>Este dinero no es una venta. Para mantener trazabilidad, registra de dónde proviene.</Text>
          </div>
          <div className={styles.originGrid}>
            <div className={styles.originFields}>
              <label className={styles.formField}>
                <Text as='span' font='semibold'>Procedencia del fondo</Text>
                <select value={source} disabled={disabled || submitting || forcePrevious} onChange={e => onSourceChange(e.target.value as OpeningSource)}>
                  <option value='TREASURY'>Tesorería / caja fuerte</option>
                  <option value='PREVIOUS_SESSION' disabled={!previousSessionId}>Base del turno anterior</option>
                  <option value='OTHER_DOCUMENTED'>Otro origen documentado</option>
                </select>
              </label>
              {forcePrevious && <p className={styles.previousHint}>El turno anterior conserva efectivo. Debes verificar esa base antes de abrir una nueva caja.</p>}
                            {source === 'PREVIOUS_SESSION' && (<div className={styles.previousInfo} role='status'>
                  <Text as='span' color='gray'>Fondo anterior registrado</Text>
                  <strong>{formatCashMinor(previousRetainedMinor)}</strong>
                  <Text as='small'>Si el conteo es diferente, explica el motivo en observaciones.</Text>
                </div>)}
              {source !== 'PREVIOUS_SESSION' && (<label className={styles.formField}>
                  <Text as='span' font='semibold'>Referencia del fondo <span aria-hidden='true'>*</span></Text>
                  <input required maxLength={200} value={reference} disabled={disabled || submitting} aria-invalid={visibleIssue?.field === 'reference'} aria-describedby={`${titleId}-reference-help`} placeholder='Ej.: Recibo de tesorería 0045' onChange={e => onReferenceChange(e.target.value)}/>
                  <small id={`${titleId}-reference-help`}>Obligatorio para Tesorería u Otro origen documentado.</small>
                </label>)}
              <label className={styles.formField}>
                <Text as='span' font='semibold'>Observaciones {source === 'PREVIOUS_SESSION' && previousRetainedMinor !== countedMinor ? '(obligatorias)' : '(opcionales)'}</Text>
                <textarea value={notes} rows={3} maxLength={1000} disabled={disabled || submitting} onChange={e => onNotesChange(e.target.value)} placeholder='Información adicional sobre la apertura'/>
              </label>
            </div>
            <div className={styles.openingReview}>
              <Text as='h3' font='semibold'>Resumen del turno</Text>
              <dl>
                <div><dt>Caja</dt><dd>{register.name}</dd></div>
                <div><dt>Fondo inicial</dt><dd>{formatCashMinor(countedMinor)}</dd></div>
                <div><dt>Medios habilitados</dt><dd>{availableNames.length} seleccionados</dd></div>
              </dl>
              <ul className={styles.reviewMethods}>
                {availableNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}
              </ul>
              <Text as='p' color='gray'>Esta selección se guardará en la sesión. Solo los medios elegidos aparecerán en el POS.</Text>
            </div>
          </div>
        </div>)}

      {visibleIssue && <p className={styles.validationBanner} role='alert'>{visibleIssue.message}</p>}
      {serverError && <p className={styles.validationBanner} role='alert'>{serverError}</p>}
      <div className={styles.wizardActions}>
        <button type='button' className={styles.secondary} onClick={() => moveTo(step - 1)} disabled={step === 0 || disabled || submitting}>
          Volver
        </button>
        <Text as='small' color='gray'>Los datos se conservan al cambiar de paso.</Text>
        {step < 2 ? (<button type='button' onClick={() => moveTo(step + 1)} disabled={disabled || submitting}>
            Continuar
          </button>) : (<button type='button' onClick={submit} disabled={disabled || submitting}>
            {submitting ? 'Registrando apertura…' : `Confirmar apertura · ${formatCashMinor(countedMinor)}`}
          </button>)}
      </div>
    </section>);
}

