/**
 * Check whether value is a plain object (not null, not array).
 * @param value - value to check
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)


/**
 * Deep equality for primitives, arrays and plain objects.
 * Lightweight and fast for normalized cache structures.
 * @param a - first value
 * @param b - second value
 */
const deepArrayEqual = (a: unknown[], b: unknown[]): boolean => {
    if (a.length !== b.length) {return false;}
    return a.every((item, i) => deepEqual(item, b[i]));
};

const deepObjectEqual = (a: Record<string, unknown>, b: Record<string, unknown>): boolean => {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {return false;}
    for (const k of aKeys) {
        if (!Object.hasOwn(b, k)) {return false;}
        if (!deepEqual(a[k], b[k])) {return false;}
    }
    return true;
};

export const deepEqual = (a: unknown, b: unknown): boolean => {
    if (a === b) {return true;}
    if (typeof a !== typeof b) {return false;}

    if (Array.isArray(a) && Array.isArray(b)) {
        return deepArrayEqual(a, b);
    }

    if (isPlainObject(a) && isPlainObject(b)) {
        return deepObjectEqual(a, b);
    }

    // fallback (functions, symbols) - compare by strict equality already handled
    return false;
};