'use client';
import React, { useMemo, useState } from 'react';
import type { FinancialKind, FinancialMethod } from 'npm-pkg-hook';
import { Text } from 'pkg-components';
import styles from './CashPaymentSetup.module.css';
export type PaymentSetupMethod = Pick<FinancialMethod, 'payId' | 'name' | 'financialKind' | 'state'>;
export const FINANCIAL_KINDS: Array<{
    value: FinancialKind;
    label: string;
    help: string;
}> = [
    { value: 'CASH', label: 'Efectivo', help: 'Entra físicamente a la caja y puede requerir vuelto.' },
    { value: 'BANK_TRANSFER', label: 'Transferencia', help: 'Llega a una cuenta; no suma efectivo físico.' },
    { value: 'CARD', label: 'Tarjeta', help: 'Pago procesado por datáfono o pasarela.' },
    { value: 'DIGITAL_WALLET', label: 'Billetera digital', help: 'Pago recibido por una billetera electrónica.' },
    { value: 'OTHER', label: 'Otro', help: 'Otro medio con origen financiero identificado.' },
    { value: 'UNKNOWN', label: 'Sin clasificar', help: 'Debes clasificarlo antes de poder cobrar.' }
];
interface CashPaymentSetupProps {
    methods: PaymentSetupMethod[];
    selectedIds: string[];
    onSelectedChange: (ids: string[]) => void;
    onClassify: (payId: string, kind: FinancialKind) => void;
    disabled?: boolean;
    canClassify?: boolean;
    mode?: 'opening' | 'catalog';
    onManageMethods?: () => void;
}
export function CashPaymentSetup({ methods, selectedIds, onSelectedChange, onClassify, disabled = false, canClassify = true, mode = 'opening', onManageMethods }: CashPaymentSetupProps) {
    const [showExample, setShowExample] = useState(false);
    const eligible = useMemo(() => methods.filter(m => m.state === 'active' && m.financialKind !== 'UNKNOWN'), [methods]);
    const selection = useMemo(() => new Set(selectedIds), [selectedIds]);
    const unclassified = methods.filter(m => m.financialKind === 'UNKNOWN');
    const invalidSelected = selectedIds.some(id => !eligible.some(m => m.payId === id));
    const isOpening = mode === 'opening';
    const toggle = (payId: string) => {
        if (disabled)
            return;
        onSelectedChange(selection.has(payId)
            ? selectedIds.filter(id => id !== payId)
            : [...selectedIds, payId]);
    };
    return (<section className={styles.panel} aria-label={isOpening ? 'Medios que recibirá esta caja' : 'Clasificación de medios de pago'}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <Text as='h3' font='semibold' className={styles.title}>
              {isOpening ? 'Selecciona los medios de cobro' : 'Clasifica los medios disponibles'}
            </Text>
            <Text as='p' color='gray' className={styles.description}>
              {isOpening
            ? 'Marca los medios que aceptarás durante esta sesión. Los demás no aparecerán al cobrar.'
            : 'La clasificación explica cómo se recibió el dinero; no cambia el nombre del medio.'}
            </Text>
          </div>
          {isOpening && <span className={styles.counter} aria-live='polite'>{eligible.filter(m => selection.has(m.payId)).length} de {eligible.length}</span>}
        </div>
      </header>

      {methods.length === 0 && (<p className={styles.notice} role='status'>No hay medios registrados. Comprueba el catálogo financiero antes de continuar.</p>)}
      {unclassified.length > 0 && (<div className={styles.notice} role='status'>
          <strong>{unclassified.length} medio{unclassified.length === 1 ? '' : 's'} sin clasificar</strong>
          <Text as='p' color='gray'>Para habilitarlos, define primero su tipo en Finanzas → Medios de pago.</Text>
          {isOpening && onManageMethods && canClassify && (<button type='button' className={styles.textButton} onClick={onManageMethods} disabled={disabled}>Ir a clasificar</button>)}
        </div>)}

      <div className={styles.items}>
        {methods.map(method => {
            const valid = method.state === 'active' && method.financialKind !== 'UNKNOWN';
            const chosen = isOpening && selection.has(method.payId);
            const kind = FINANCIAL_KINDS.find(x => x.value === method.financialKind);
            return (<div className={styles.item} key={method.payId} data-selected={chosen} data-eligible={valid}>
              <div className={styles.itemMain}>
                {isOpening && (<input type='checkbox' className={styles.checkbox} aria-label={`Aceptar ${method.name} en este turno`} checked={chosen} disabled={disabled || (!valid && !chosen)} onChange={() => toggle(method.payId)}/>)}
                <div className={styles.itemInfo}>
                  <Text as='strong' font='semibold'>{method.name}</Text>
                  <Text as='small' color='gray'>{kind?.help ?? 'Clasificación desconocida'}</Text>
                </div>
              </div>
              {isOpening ? (<span className={styles.kindTag} data-invalid={!valid}>
                  {method.state !== 'active' ? 'Inactivo' : kind?.label ?? 'No disponible'}
                </span>) : (<label className={styles.kindControl}>
                  <span>Tipo financiero</span>
                  <select value={method.financialKind} disabled={disabled || !canClassify} onChange={e => onClassify(method.payId, e.target.value as FinancialKind)}>
                    {FINANCIAL_KINDS.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                </label>)}
            </div>);
        })}
      </div>
      {isOpening && (<div className={styles.footer}>
          {invalidSelected && <p role='alert' className={styles.error}>Hay medios seleccionados que dejaron de estar disponibles. Desmárcalos.</p>}
          <button type='button' className={styles.secondary} disabled={disabled || eligible.length === 0} onClick={() => onSelectedChange(eligible.map(m => m.payId))}>
            Seleccionar todos los disponibles
          </button>
          <Text as='small' color='gray'>Para cambiar los medios aceptados, será necesario abrir un nuevo turno.</Text>
        </div>)}
      {!isOpening && (<div className={styles.footer}>
          <button type='button' className={styles.secondary} aria-expanded={showExample} onClick={() => setShowExample(x => !x)}>
            {showExample ? 'Ocultar' : 'Ver'} ejemplos
          </button>
          {showExample && <p className={styles.description}>Efectivo → Efectivo · Visa → Tarjeta · Transferencia bancaria → Transferencia.</p>}
        </div>)}
    </section>);
}

