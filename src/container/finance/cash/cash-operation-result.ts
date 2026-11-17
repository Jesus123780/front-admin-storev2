/**
 * GraphQL mutations may resolve with { errors, data: null } under
 * errorPolicy: 'all'. A resolved promise is NOT proof of success.
 * Keep this module framework-independent for unit testing.
 */
export type CashOperationName = 'register' | 'open' | 'method' | 'movement' | 'payout' | 'reverse' | 'begin' | 'count' | 'recount' | 'approve' | 'finalize';
const RESPONSE_FIELD: Record<CashOperationName, string> = {
    register: 'saveCashRegister',
    open: 'openCashSession',
    method: 'setPaymentFinancialKind',
    movement: 'recordCashMovement',
    payout: 'recordDeliveryCashPayout',
    reverse: 'reverseCashMovement',
    begin: 'beginCashClose',
    count: 'submitCashCount',
    recount: 'recountCashClose',
    approve: 'approveCashClose',
    finalize: 'finalizeCashClose'
};
export interface CashFailure {
    message: string;
    code?: string;
    knownRejection: boolean;
}
type GraphQLErrorLike = {
    message?: string;
    extensions?: {
        code?: string;
    };
};
type GraphQLResultLike = {
    data?: Record<string, unknown> | null;
    errors?: GraphQLErrorLike[] | null;
    error?: unknown;
};
export class CashOperationError extends Error {
    constructor(message: string, readonly code?: string, readonly knownRejection = false) {
        super(message);
        this.name = 'CashOperationError';
    }
}
const BUSINESS_MESSAGES: Record<string, string> = {
    SOURCE_REQUIRED: 'Indica la referencia del fondo. Por ejemplo, el número del recibo o el comprobante de tesorería.',
    PAYMENT_METHODS_REQUIRED: 'Selecciona al menos un medio de pago para este turno.',
    INVALID_PAYMENT_SELECTION: 'Hay medios de pago inválidos o repetidos. Revísalos antes de continuar.',
    INVALID_SOURCE: 'Revisa el origen del dinero y su documentación.',
    PREVIOUS_FLOAT_REQUIRED: 'Debes seleccionar el fondo del turno anterior.',
    BELOW_MINIMUM: 'La base contada está por debajo del mínimo configurado para esta caja.',
    OPENING_VARIANCE: 'El conteo no coincide con el fondo anterior. Explica la diferencia en observaciones.'
};
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function firstGraphQLError(input: unknown): GraphQLErrorLike | null {
    if (!isRecord(input))
        return null;
    const errors = Array.isArray(input.errors) ? input.errors :
        Array.isArray(input.graphQLErrors) ? input.graphQLErrors : [];
    const first = errors.find(isRecord);
    return first ? first as GraphQLErrorLike : null;
}
export function describeCashError(input: unknown): CashFailure {
    if (input instanceof CashOperationError) {
        return {
            message: input.code && BUSINESS_MESSAGES[input.code] || input.message,
            code: input.code,
            knownRejection: input.knownRejection
        };
    }
    const source = isRecord(input) ? input : {};
    const graphQLError = firstGraphQLError(source);
    const code = graphQLError?.extensions?.code ??
        (typeof source.code === 'string' ? source.code : undefined);
    const rawMessage = graphQLError?.message ??
        (input instanceof Error ? input.message : undefined) ??
        'No pudimos confirmar esta operación. Consulta el estado de la caja antes de reintentar.';
    // GraphQL application errors prove that the mutation was rejected.
    // Network failures / unknown server outcomes do NOT.
    const knownRejection = Boolean(code &&
        !['INTERNAL_SERVER_ERROR', 'CASH_OPERATION_FAILED', 'NETWORK_ERROR'].includes(code));
    return { message: code && BUSINESS_MESSAGES[code] || rawMessage, code, knownRejection };
}
/**
 * Throws if GraphQL rejects the request, returns an unverified result,
 * or resolves with partial data that does not contain the expected mutation.
 */
export function assertCashMutationResult(operation: CashOperationName, response: unknown): Record<string, unknown> {
    if (!isRecord(response)) {
        throw new CashOperationError('El servidor no devolvió un resultado verificable. Verifica el turno antes de reintentar.');
    }
    const result = response as GraphQLResultLike;
    const graphError = firstGraphQLError(result);
    if (graphError) {
        const code = graphError.extensions?.code;
        throw new CashOperationError(graphError.message || 'El servidor rechazó la operación.', code, Boolean(code && !['INTERNAL_SERVER_ERROR', 'CASH_OPERATION_FAILED'].includes(code)));
    }
    // Some Apollo versions expose one combined `error` field.
    if (result.error) {
        const failure = describeCashError(result.error);
        throw new CashOperationError(failure.message, failure.code, failure.knownRejection);
    }
    const field = RESPONSE_FIELD[operation];
    const payload = result.data?.[field];
    if (!isRecord(payload)) {
        throw new CashOperationError(`No se recibió una confirmación válida de ${field}. Verifica la caja antes de reintentar.`);
    }
    if (payload.success === false) {
        throw new CashOperationError(typeof payload.message === 'string' ? payload.message : 'La operación fue rechazada.', typeof payload.code === 'string' ? payload.code : 'BAD_USER_INPUT', true);
    }
    // Every cash mutation in the existing schema returns an entity with an id,
    // except financial methods which return payId.
    const entityId = operation === 'method' ? payload.payId : payload.id;
    if (typeof entityId !== 'string' || !entityId.trim()) {
        throw new CashOperationError(`La respuesta de ${field} no contiene el identificador de confirmación. Verifica la operación antes de reintentar.`);
    }
    return payload;
}

