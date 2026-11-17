import type { FinancialMethod } from 'npm-pkg-hook';
export type OpeningSource = 'PREVIOUS_SESSION' | 'TREASURY' | 'OTHER_DOCUMENTED';
export type OpeningStep = 0 | 1 | 2;
export interface OpeningDraft {
    registerId: string;
    minimumFloatMinor: string;
    countedMinor: string;
    methods: ReadonlyArray<Pick<FinancialMethod, 'payId' | 'state' | 'financialKind'>>;
    selectedPaymentMethodIds: string[];
    source: OpeningSource;
    previousSessionId: string | null;
    previousRetainedMinor: string | null;
    reference: string;
    notes: string;
    catalogReady: boolean;
    previousReady: boolean;
}
export interface OpeningIssue {
    step: OpeningStep;
    field: 'count' | 'methods' | 'source' | 'reference' | 'notes';
    message: string;
}
function safeMinor(value: string): bigint | null {
    try {
        return /^\d+$/.test(value) ? BigInt(value) : null;
    }
    catch {
        return null;
    }
}
export function validateCashOpening(draft: OpeningDraft): OpeningIssue | null {
    const total = safeMinor(draft.countedMinor);
    const minimum = safeMinor(draft.minimumFloatMinor);
    if (!draft.registerId || total === null || minimum === null) {
        return { step: 0, field: 'count', message: 'Selecciona una caja y comprueba el conteo de efectivo.' };
    }
    if (total < minimum) {
        return { step: 0, field: 'count', message: 'La base contada es menor que el mínimo de esta caja.' };
    }
    if (!draft.catalogReady) {
        return { step: 1, field: 'methods', message: 'Espera a que termine la consulta del catálogo de pagos.' };
    }
    const ids = draft.selectedPaymentMethodIds;
    if (!ids.length || new Set(ids).size !== ids.length) {
        return { step: 1, field: 'methods', message: 'Selecciona al menos un medio de pago sin repetir.' };
    }
    const available = new Set(draft.methods.filter(m => m.state === 'active' && m.financialKind !== 'UNKNOWN').map(m => m.payId));
    if (!ids.every(id => available.has(id))) {
        return { step: 1, field: 'methods', message: 'Hay un medio inactivo o sin clasificar. Revisa la selección.' };
    }
    if (!draft.previousReady) {
        return { step: 2, field: 'source', message: 'Espera a que se verifique el fondo anterior.' };
    }
    if (draft.source === 'PREVIOUS_SESSION') {
        if (!draft.previousSessionId || draft.previousRetainedMinor == null) {
            return { step: 2, field: 'source', message: 'Selecciona el fondo válido del turno anterior.' };
        }
        if (draft.previousRetainedMinor !== draft.countedMinor && !draft.notes.trim()) {
            return { step: 2, field: 'notes', message: 'Explica la diferencia entre el fondo anterior y el efectivo contado.' };
        }
    }
    else if (!draft.reference.trim()) {
        return { step: 2, field: 'reference', message: 'Documenta el origen del dinero con el número de recibo o comprobante.' };
    }
    return null;
}

