'use client'


import {
 ApolloCache, DocumentNode, NormalizedCacheObject, 
 Unmasked
} from '@apollo/client'
import { Modifier } from '@apollo/client/cache'
import jwt, { decode } from 'jsonwebtoken'
import { ROUTES } from 'pkg-components'

// https://codesandbox.io/s/calculadora-de-salario-qi0ft?file=/src/index.js:293-298
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  domain: 'localhost:3001/',
  httpOnly: true,
  path: ROUTES.index,
  sameSite: true,
  // secure: !!process.env.ADMIN_URL.includes('https')
  secure: false
}
export const isNull = (dato: string | null | undefined) => {
  return !!(!dato || dato === '')
}

export const isNumeric = (dato: string | null | undefined) => {
  return !!(dato !== '' && dato !== undefined && dato !== null && Number.isNaN(Number(dato)))
}

export const isPassword = (dato: string | null | undefined) => {
  const validar = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/
  if (validar.test(dato ?? '') === true) {
    return false
  }
  return true
}

export const isCC = (dato: string | null | undefined) => {
  const validar = /^\d{6,10}/g
  if (validar.test(dato ?? '') === true) {
    return false
  } return true
}

export const valNit = (nit: string | null | undefined): boolean => {
  if (typeof nit !== 'string') { return false; }
  let add = 0;
  // Use concise regex, remove duplicates, and ensure nit is a string
  const match = /^(\d+)-([0-9kK])$/i.exec(nit);
  if (match) {
    // Extract numbers and check digit
    const numberPart = match[1];
    let checkDigit: number;
    if (match[2].toLowerCase() === 'k') {
      checkDigit = 10;
    } else {
      checkDigit = Number.parseInt(match[2], 10);
    }
    for (let i = 0; i < numberPart.length; i++) {
      add += (((i - numberPart.length) * -1) + 1) * Number.parseInt(numberPart[i], 10);
    }
    return ((11 - (add % 11)) % 11) === checkDigit;
  }
  return false;
}

export const onlyLetters = (dato: string | null | undefined) => {
  const validar = /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/g
  if (validar.test(dato ?? '') === false && dato !== '' && dato !== undefined && dato !== null) {
    return true
  } return false
}

export const rangeLength = (dato: string | null | undefined, min: number, max: number): boolean => {
  if (dato !== undefined && dato !== '' && dato !== null) {
    if ((dato.length < min) || (dato.length > max)) {
      return true
    } return false
  } return false
}

export const Match = (dato1: string | number | null | undefined, dato2: string | number | null | undefined): boolean => {
  if (dato1 !== dato2) {
    return true
  } return false
}

export const isEmail = (email: string | null | undefined) => {
  const validar = /^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i
  if (validar.test(email ?? '') === false && email !== '' && email !== undefined && email !== null) {
    return true
  } return false
}

export const passwordConfirm = (value: string | null | undefined, valueConfirm: string | null | undefined) => { return !(value === valueConfirm) }

export const numberFormat = (value: string | number | null | undefined) => { return value ? (parseInt(value as string) ? new Intl.NumberFormat('de-DE').format(parseFloat(`${value}`.replace(/\./g, ''))) : value) : (value) }

export const validationImg = (file: File) => { return (/\.(jpg|png|gif|jpeg)$/i).test(file.name) }

export const CalcularDigitoVerificacion = (value = '') => {
  if (value) {
    let x = 0; let y = 0; let i = 0; let myNit

    // Se limpia el Nit
    myNit = value.replace(/\s/g, '') // Espacios
    myNit = value.replace(/,/g, '') // Comas
    myNit = value.replace(/\./g, '') // Puntos
    myNit = value.replace(/-/g, '') // Guiones

    // Se valida el nit
    if (isNaN(Number(myNit))) {
      return ''
    }

    // Procedimiento
    const vpri = new Array(16)
    const z = myNit.length

    vpri[1] = 3
    vpri[2] = 7
    vpri[3] = 13
    vpri[4] = 17
    vpri[5] = 19
    vpri[6] = 23
    vpri[7] = 29
    vpri[8] = 37
    vpri[9] = 41
    vpri[10] = 43
    vpri[11] = 47
    vpri[12] = 53
    vpri[13] = 59
    vpri[14] = 67
    vpri[15] = 71

    for (i; i < z; i++) {
      y = Number(myNit.substr(i, 1))

      if (typeof vpri[z - i] !== 'undefined' && vpri[z - i] !== undefined) {
        x += (y * vpri[z - i]!)
      }
    }

    y = x % 11

    return (y > 1) ? 11 - y : y

  }
}

export const extFile = (filename: string): string | undefined => {
  if (/[.]/.exec(filename)) {
    const match = /[^.]+$/.exec(filename);
    return match ? match[0] : undefined;
  }
  return undefined;
}

/**
 * @description Funcion que valida los formularios, funciona para trabajar los errores con estados
 * @version 0.1.1
 * @param {array} elements elementos del formulario
 * @return {array} devuelve un array de bolleanos con el nombre identificador para cada estado en react.
 */
export const validationSubmitHooks = (elements: HTMLInputElement[]) => {
  let errorForm: { [key: string]: boolean } = {};
  for (const element of elements) {
    if (element.name) {
      if (element.type === 'text' || element.type === 'password' || element.type === 'email' || element.type === 'number' || element.type === 'hidden') {
        if (element.dataset.required === 'true') {
          if (!element.value) { errorForm = { ...errorForm, [element.name]: !element.value } }
          else { errorForm = { ...errorForm, [element.name]: !element.value } }
        } else {
          errorForm = { ...errorForm, [element.name]: false }
        }
      }
    }
  }
  return errorForm
}

/**
 * Filtra las claves de un objeto según un array de filtros.
 * @param data Objeto a filtrar.
 * @param filters Array de claves a comparar o excluir.
 * @param dataFilter Booleano para devolver los datos filtrados o no.
 * @returns Objeto con los datos filtrados.
 */
export const filterKeyObject = <T = unknown>(
  data: Record<string, T>,
  filters: string[],
  dataFilter: boolean
): Record<string, T> | { values: Record<string, T>; valuesFilter: Record<string, T> } => {
  let values: Record<string, T> = {};
  let valuesFilter: Record<string, T> = {};
  for (const elem in data) {
    let coincidence = false;
    for (const filter of filters) {
      if (elem === filter) {
        coincidence = true;
        break;
      }
    }

    if (coincidence) {
      valuesFilter = { ...valuesFilter, [elem]: data[elem] };
    } else {
      values = { ...values, [elem]: data[elem] };
    }
  }
  if (dataFilter) {
    return { values, valuesFilter };
  }
  return values;
}

interface CacheField {
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface UpdateCacheParams {
  cache: ApolloCache<NormalizedCacheObject>;
  query: DocumentNode;
  nameFun: string;
  dataNew?: Partial<CacheField> | null;
}

/**
 * Update Apollo cache by merging `dataNew` into a specific cache field
 * and syncing the result with `cache.writeQuery`.
 *
 * @template TQueryResult - GraphQL query result shape
 * @param {UpdateCacheParams<TQueryResult>} params
 * @returns {Promise<void>}
 */
export const updateCache = async <TQueryResult>({
  cache,
  query,
  nameFun,
  dataNew = null,
}: UpdateCacheParams): Promise<void> => {
  if (!cache?.modify) {
    throw new TypeError('Invalid Apollo cache provided.');
  }
  if (!query) {
    throw new TypeError('`query` is required.');
  }
  if (!nameFun) {
    throw new TypeError('`nameFun` must be a non-empty string.');
  }
  if (!dataNew) {return;}

  try {
    cache.modify({
      fields: {
        [nameFun]: (
          existing: import('@apollo/client').Reference | import('@apollo/client').StoreObject | undefined = {}
        ): import('@apollo/client').StoreObject => {
          // Try to treat existing as a StoreObject (plain object)
          const existingObj = (typeof existing === 'object' && existing !== null) ? existing as Record<string, unknown> : {};
          const merged: Record<string, unknown> = {
            ...existingObj,
            ...dataNew,
            data: {
              ...(existingObj.data as object ?? {}),
              ...(dataNew?.data as object ?? {}),
            },
          };

          cache.writeQuery({
            query,
            data: {
              [nameFun]: merged,
            } as Unmasked<TQueryResult>,
          });

          return merged as import('@apollo/client').StoreObject;
        },
      },
    });
  } catch (error) {
    throw new Error(
      `updateCache failed for field "${nameFun}": ${(error as Error).message}`
    );
  }
};


/**
 * Update multiple fields in Apollo cache safely.
 *
 * @param params.cache - Apollo cache instance
 * @param params.queries - Array of objects with `query`, `nameFun` (field name to modify) and optional `dataNew`
 * @returns void
 */
export const updateMultipleCache = async ({
  cache,
  queries,
}: {
  cache: ApolloCache<NormalizedCacheObject>
  queries: Array<{
    query: DocumentNode
    nameFun: string
    dataNew?: Partial<{ data?: Record<string, unknown> }> | null
  }>
}): Promise<void> => {
  if (!cache) {throw new Error('updateMultipleCache: cache is required')}
  if (!Array.isArray(queries)) {throw new Error('updateMultipleCache: queries must be an array')}

  type CacheField = { data?: Record<string, unknown> }
  type FieldModifier = Modifier<CacheField | undefined>

  const modifiedFields: Record<string, FieldModifier> = {}

  queries.forEach(({ query, nameFun, dataNew }) => {
    modifiedFields[nameFun] = (existing = {}) => {
      const merged: CacheField = {
        ...existing,
        data: { ...(existing?.data || {}), ...(dataNew?.data || {}) },
      }

      // try to keep a corresponding query in sync if provided
      try {
        cache.writeQuery({ query, data: merged as unknown as Record<string, unknown> })
      } catch {
        // writing might fail if query shape doesn't match — ignore to let modify handle the field update
      }

      return merged
    }
  })

  cache.modify({ fields: modifiedFields })
}


/**
 * Actualiza el cache de Apollo.
 * @param params Parámetros para actualizar el cache de Apollo.
 * @returns null
 */
export const updateCacheMod = async <TCache = unknown, TQuery = unknown, TDataNew = unknown>({
  cache,
  query,
  nameFun,
  dataNew,
  type,
  id,
}: {
  cache: {
    modify: (options: { fields: Record<string, (dataOld?: TCache) => unknown> }) => unknown;
    writeQuery: (options: { query: TQuery; data: unknown }) => unknown;
  };
  query: TQuery;
  nameFun: string;
  dataNew: TDataNew;
  type: number;
  id: string;
}): Promise<unknown> => {
  return cache.modify({
    fields: {
      [nameFun](dataOld: TCache = [] as unknown as TCache) {
        if (type === 1) {
          // For arrays, just spread dataOld and dataNew
          return cache.writeQuery({ query, data: [...((dataOld as unknown as Array<unknown>) ?? []), ...(Array.isArray(dataNew) ? dataNew : [dataNew])] });
        }
        if (type === 2) {
          // For objects, just spread dataOld and dataNew
          return cache.writeQuery({ query, data: { ...(dataOld as object), ...(dataNew as object) } });
        }
        if (type === 3) {
          // For filtering, avoid explicit any
          return cache.writeQuery({ query, data: (Array.isArray(dataOld) ? dataOld.filter((x) => x === id) : []) });
        }
      },
    },
  });
};
/**
 * obtiene el token del usuario lo guarda en el localStorage
 * @returns {null} no hay retorno
 */
const TOKEN = 'sma.sv1'
export function setToken(token: string | null) {
  if (token === null) { return false }
  else if (token !== null) { return JSON.parse }
}
/**
 * obtiene el token del usuario
 * @returns {null} no hay retorno
 */
export function getToken({ restaurant }: { restaurant?: string } = {}) {
  if (window.localStorage) {
    return window.localStorage.getItem(restaurant || TOKEN)
  }
}

// obtiene el token del usuario y lo descodifica
export function decodeToken(token: string) {
  return decode(token)
}

const now = Date.now().valueOf() / 1000

export function getTokenState(token: string) {
  try {
    if (!token) {
      return { valid: false, needRefresh: true }
    }
    const decoded = decode(token)
    if (!decoded) {
      return { valid: false, needRefresh: true }
    } else if (decoded.exp && jwt.decode(token)?.exp < now) {
      return { valid: true, needRefresh: true }
    } else {
      return { valid: true, needRefresh: false }
    }
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, needRefresh: true }
    }
    return {
      valid: false,
      needRefresh: true
    }
  }
}

// Obtiene el token y lo elimina
export function removeToken() {
  return localStorage.removeItem(TOKEN)
}
export const validateEmail = (email: string) => {
  const re = /^(([^<> ()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}
/**
 * Transforma una cadena de caracteres a todos mayuscula
 * @version 0.0.1
 * @param {string} value valor en numeros
 * @return {string} nuevo formato en teléfono
 */
export const upperCase = (value: string) => { return `${value || ''}`.toUpperCase() }

/**
 * Transforma un numero en formato de teléfono
 * @version 0.0.1
 * @param {string} value valor en numeros
 * @return {string} nuevo formato en teléfono
 */
//  export const phoneFormat = value => !!value && parsePhoneNumber(`${ value }`, 'US')?.formatNational()
/**
 * Calcula el dígito de verificación
 * @version 0.0.1
 * @param {string} value valor en números
 * @return {numeric} el dígito de verificación
 */
export const calculateCheckDigit = (value: string): number => {
  // variables necesarias
  let nit = `${value}`
  const vpri = [undefined, 3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]

  // Se limpia el Nit
  nit = nit.replace(/\s/g, '') // Espacios
  nit = nit.replace(/,/g, '') // Comas
  nit = nit.replace(/\./g, '') // Puntos
  nit = nit.replace(/-/g, '') // Guiones

  // Se valida el nit
  if (isNaN(nit as unknown as number)) { return 0 }

  // Procedimiento
  let x = 0
  let y = 0
  let i = 0
  const z = nit.length

  for (i; i < z; i++) {
    y = parseInt(nit.substring(i, i + 1), 10)

    if (typeof vpri[z - i] !== 'undefined' && vpri[z - i] !== undefined) {
      x += (y * vpri[z - i]!)
    }
  }

  y = x % 11

  return (y > 1) ? 11 - y : y
}

/**
 * Unidad en letra
 * @version 0.0.1
 * @param {number} value numero
 * @return {string} numero el letra
 */
const Unidades = (value: number): string => {
  switch (value) {
    case 1: return 'UN'
    case 2: return 'DOS'
    case 3: return 'TRES'
    case 4: return 'CUATRO'
    case 5: return 'CINCO'
    case 6: return 'SEIS'
    case 7: return 'SIETE'
    case 8: return 'OCHO'
    case 9: return 'NUEVE'
    default: return ''
  }
}

/**
 * Decena en letra
 * @version 0.0.1
 * @param {string} strSin numero en letra
 * @param {string} numUnit numero en letras
 * @return {string} concatena al cantidad
 */
const DecenasY = (strSin: string, numUnit: number) => {
  if (numUnit > 0) { return `${strSin} Y ${Unidades(numUnit)}` }
  return strSin
}

/**
 * Decena en letra
 * @version 0.0.1
 * @param {number} value numero
 * @return {string} cantidad en letra
 */
const Decenas = (value: number) => {
  const ten = Math.floor(value / 10)
  const Unit = value - (ten * 10)

  switch (ten) {
    case 1:
      switch (Unit) {
        case 0: return 'DIEZ'
        case 1: return 'ONCE'
        case 2: return 'DOCE'
        case 3: return 'TRECE'
        case 4: return 'CATORCE'
        case 5: return 'QUINCE'
        default: return `DIECI${Unidades(Unit)}`
      }
    case 2:
      switch (Unit) {
        case 0: return 'VEINTE'
        default: return `VEITI${Unidades(Unit)}`
      }
    case 3: return DecenasY('TREINTA', Unit)
    case 4: return DecenasY('CUARENTA', Unit)
    case 5: return DecenasY('CINCUENTA', Unit)
    case 6: return DecenasY('SESENTA', Unit)
    case 7: return DecenasY('SETENTA', Unit)
    case 8: return DecenasY('OCHENTA', Unit)
    case 9: return DecenasY('NOVENTA', Unit)
    case 0: return Unidades(Unit)
    default: return ''
  }
}
/**
 * Centenas en letra
 * @version 0.0.1
 * @param {number} value numero
 * @return {string} cantidad en letra
 */
const Centenas = (value: number) => {
  const hundreds = Math.floor(value / 100)
  const tens = value - (hundreds * 100)

  switch (hundreds) {
    case 1:
      if (tens > 0) { return `CIENTO${Decenas(tens)}` }
      return 'CIEN'
    case 2: return `DOSCIENTOS${Decenas(tens)}`
    case 3: return `TRESCIENTOS${Decenas(tens)}`
    case 4: return `CUATROCIENTOS${Decenas(tens)}`
    case 5: return `QUINIENTOS${Decenas(tens)}`
    case 6: return `SEISCIENTOS${Decenas(tens)}`
    case 7: return `SETECIENTOS${Decenas(tens)}`
    case 8: return `OCHOCIENTOS${Decenas(tens)}`
    case 9: return `NOVECIENTOS${Decenas(tens)}`
    default: return Decenas(tens)
  }
}

/**
 * Seccion en letra
 * @version 0.0.1
 * @param {number} value numero del valor
 * @param {number} divider numero de division
 * @param {string} strSingular numero en letras
 * @param {string} strPlural numero en letras
 * @return {string} cantidad en letra
 */
const Seccion = (value: number, divider: number, strSingular: string, strPlural: string) => {
  const hundreds = Math.floor(value / divider)
  const rest = value - (hundreds * divider)
  let letters = ''

  if (hundreds > 0) {
    if (hundreds > 1) { letters = `${Centenas(hundreds)} ${strPlural}` }
    else { letters = strSingular }
  }

  if (rest > 0) { letters += '' }

  return letters
}
/**
 * Miles en letra
 * @version 0.0.1
 * @param {number} value numero del valor
 * @return {string} cantidad en letra
 */
const Miles = (value: number) => {
  const divider = 1000
  const hundreds = Math.floor(value / divider)
  const rest = value - (hundreds * divider)
  const strThousands = Seccion(value, divider, 'UN MIL', 'MIL')
  const strhundreds = Centenas(rest)

  if (strThousands === '') { return strhundreds }

  return `${strThousands} ${strhundreds}`
}

/**
 * Millones en letra
 * @version 0.0.1
 * @param {number} value numero del valor
 * @return {string} cantidad en letra
 */
const Millones = (value: number) => {
  const divider = 1000000
  const hundreds = Math.floor(value / divider)
  const rest = value - (hundreds * divider)
  const strMillions = Seccion(value, divider, 'UN MILLON DE', 'MILLONES DE')
  const strThousands = Miles(rest)

  if (strMillions === '') { return strThousands }

  return `${strMillions} ${strThousands}`
}
/**
 * Formato de transformar numero a Letras
 * @version 0.0.1
 * @param {number} value numero del valor
 * @param {number} format activar formato de pesos
 * @return {string} cantidad en letra
 */
export const NumeroALetras = (value: number, format = false) => {
  const data = {
    number: value,
    integers: Math.floor(value),
    letterPennies: '',
    letterCoinPlural: format ? '' : 'PESOS COLOMBIANOS',
    letterCoinSingular: format ? '' : 'PESO COLOMBIANO',
    letterCoinPenniesPlural: 'CENTAVOS',
    letterCoinPennieSingular: 'CENTAVO',
    pennies: ((Math.round(value * 100)) - (Math.floor(value) * 100))
  }

  if (data.pennies > 0) {
    data.letterPennies = `CON ${(function () {
      if (data.pennies === 1) { return `${Millones(data.pennies)} ${data.letterCoinPennieSingular}` }
      return `${Millones(data.pennies)} ${data.letterCoinPenniesPlural}`
    })()
      }`
  }

  if (data.integers === 0) { return `CERO ${data.letterCoinPlural} ${data.letterPennies}` }
  if (data.integers === 1) { return `${Millones(data.integers)} ${data.letterCoinSingular} ${data.letterPennies}` }
  return `${Millones(data.integers)} ${data.letterCoinPlural} ${data.letterPennies}`
}

/**
 * Busca un valor aleatorio de 10 caracteres
 * @version 0.0.1
 * @return {string} Valor aleatorio
 */
export const valRand = () => {
  /** variables necesarias */
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  /** creación de codigo */
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}
// Te devuelve un valor en formato reducido en millones
export const numberFormatM = (param: number) => {
  let money = 0; let num = 0; let value = 0; let val = param
  if (val >= 1000000000) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`${num}000`)
    money += value
    val -= parseFloat(`${num}000000000`)
  }

  if (val >= 100000000) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`${num}00`)
    money += value
    val -= parseFloat(`${num}00000000`)
  }

  if (val >= 10000000) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`${num}0`)
    money += value
    val -= parseFloat(`${num}0000000`)
  }

  if (val >= 1000000) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`${num}`)
    money += value
    val -= parseFloat(`${num}000000`)
  }
  if (val >= 100000) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`0.${num}`)
    money += value
    val -= parseFloat(`${num}00000`)
  }
  if (val >= 10000) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`0.0${num}`)
    money += value
    val -= parseFloat(`${num}0000`)
  }
  if (val >= 1000) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`0.00${num}`)
    money += value
    val -= parseFloat(`${num}000`)
  }
  if (val >= 100) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`0.000${num}`)
    money += value
    val -= parseFloat(`${num}00`)
  }
  if (val >= 10) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`0.0000${num}`)
    money += value
    val -= parseFloat(`${num}0`)
  }
  if (val >= 1) {
    num = parseInt(`${val}`.charAt(0), 10)
    value = parseFloat(`0.00000${num}`)
    money += value
    val -= parseFloat(`${num}`)
  }

  return money.toFixed(2)
}

/* Método para eliminar el primer carácter */
// const str = '*plátano_'
// const newStr = str.slice(1, -1)

/* Método para eliminar el primer carácter */
// const string = '*plátano_'
// const newString = string.substring(1, str.length - 1)

export const mongoObjectId = function () {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16)
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function () {
    return (Math.random() * 16 | 0).toString(16)
  }).toLowerCase()
}

export const CalculateIva = (
  quantity: string | number,
  rate: string | number,
  iPercentage: string | number,
  state: string
) => {
  const rateNumber = Number.parseInt(rate as string)
  const PercentageNumber = Number.parseInt(iPercentage as string)
  const quantityNumber = Number.parseInt(quantity as string)
  let TotalIva
  const SubTotal = quantityNumber && rateNumber ? quantityNumber * rateNumber : 0
  if (state === 'INCLUSIVE') {
    TotalIva = SubTotal ? SubTotal / (100 + PercentageNumber) * PercentageNumber : 0
    return TotalIva
  } else if (state === 'EXCLUSIVE') {
    const PercentageNumber = Number.parseInt(iPercentage as string)
    TotalIva = SubTotal ? (SubTotal * PercentageNumber) / 100 : 0
    return TotalIva
  }
  TotalIva = 0
  return TotalIva

}
/**
 * Calcula el monto total a partir de la cantidad y la tasa.
 * @param quantity La cantidad (string o number).
 * @param rate La tasa (string o number).
 * @returns El cálculo amountTotal.
 */
export const CalculateAmount = (quantity: string | number, rate: string | number): number | string => {
  const quantityNumber = Number.parseFloat(quantity as string)
  const rateNumber = Number.parseFloat(rate as string)
  const amountTotal = quantityNumber && rateNumber ? quantityNumber * rateNumber : '00'
  return amountTotal
}
/**
 *
 * @param {*}
 * @returns {null} no hay retorno
 * @returns {date} date day
 */
const today = new Date()
export const dateNow = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

export const hiddenEmail = (email: string) => {
  const domain = email.replace(/.*@/, '')
  const username = email.replace(/@.*/, '')
  const sliceDomain = domain.slice(domain.indexOf('.'), domain.length)
  const sliceUsername = username.slice(0, 3)
  const lastChar = username.charAt(username.length - 1)
  const usernameLengthToHide =
    username.length - (sliceUsername.length + lastChar.length)
  const hideUsername = '*'.repeat(usernameLengthToHide)
  const domainLengthToHide = domain.length - sliceDomain.length
  const hideDomain = '*'.repeat(domainLengthToHide)
  const result = `${sliceUsername}${hideUsername}${lastChar}@${hideDomain}${sliceDomain}`
  return result
}

export const roundToTwo = (num: number) => {
  return (Math.round(Number(num + 'e+2')) + 'e-2')
}

export function RandomCode(length: number) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength))
  }
  return result
}

export const NewDateFormat = (date: string | Date) => {
  try {
    if (!date) { return }
    const parsedDate = new Date(date)
    const isValid = !Number.isNaN(parsedDate.getTime())
    return isValid
  } catch (error) {
    if (error) {
      return new Error('Ocurrió un error')
    }
    return new Error('Ocurrió un error')
  }
}

export const convertBase64 = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    if (file) {
      reader.readAsDataURL(file)
    }
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = error => {
      reject(error)
    }
  })
}
/**
 * OBTIENE EL TAMAÑO DE EL ARCHIVO
 */
export const getFileSizeByUnit = (
  file: { size?: number } | null | undefined,
  unit: string = 'B'
): [number, { unit: string }] => {
  const originFileSize = file?.size;
  if (!originFileSize) {
    return [0, { unit }];
  }
  const unitStr = unit.toUpperCase();
  type UnitKey = 'B' | 'KB' | 'MB' | 'GB' | 'TB';
  const unitFormula: Record<UnitKey, (size: number) => number> = {
    B: (size: number) => size,
    KB: (size: number) => size / 1024,
    MB: (size: number) => size / (1024 * 1024),
    GB: (size: number) => size / (1024 * 1024 * 1024),
    TB: (size: number) => size / (1024 * 1024 * 1024 * 1024)
  };
  return [
    unitFormula[unitStr as UnitKey]
      ? unitFormula[unitStr as UnitKey](originFileSize)
      : 0,
    { unit }
  ];
}

// const ratings = {
//     hotel_a : 1,
//     hotel_a : 1,
//     hotel_a : 1,
//     hotel_b : 4,
//     hotel_c : 5,
//     hotel_d : 5,
//     hotel_e : 5
//   };

//   // total number of stars
//   const starTotal = 5;

//   for(const rating in ratings) { 
//     const starPercentage = (ratings[rating] / starTotal) * 100;
//     const starPercentageRounded = `${(Math.round(starPercentage / 10) * 10)}%`;
//     console.log(starPercentageRounded)
//     // document.querySelector(`.${rating} .stars-inner`).style.width = starPercentageRounded; 
//   }
// push colors
// window.setInterval(() => {
//     console.log({
//       color: "#" + Math.floor(Math.random() * 16777215).toString(16)
//     });
//   }, 2000)

// Event
// .findAndCountAll({
//     include: [
//       {
//         model: Tag,
//         as: 'tags',
//         where: { id: {in: [1,2,3,4]} },
//       }
//     ],
//     order: order,
//     limit: pageSize,
//     offset: pageSize * (page - 1),
// })
// .success(function(result) {

//     ...
// });

export const cleanRut = (rut: string | null | undefined) => {
  return typeof rut === 'string'
    ? rut.replace(/^(0+|[^0-9kK]+)/g, '').toUpperCase()
    : ''
}

export const formatRut = (rut: string | null | undefined) => {
  rut = cleanRut(rut)
  if (rut.length === 0) {
    return ''
  }
  let result = rut.slice(-4, -1) + '-' + rut.slice(rut.length - 1)
  for (let i = 4; i < rut.length; i += 3) {
    result = rut.slice(-3 - i, -i) + '.' + result
  }
  return result
}

formatRut('https://www.facebook.com/messages/t/100017146501277')

export const toKebabCase = (string: string) => {
  return string
    .replace(/([A-Z])([A-Z])/g, '$1-$2')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Detect credit/debit card type based on card number prefixes.
 *
 * @version 1.0.0
 * @param {string} cardNum Card number as a string.
 * @returns {string} Detected card type or empty string if unknown.
 */
export const getCardType = (cardNum: string): string => {
  if (!cardNum || typeof cardNum !== 'string') { return '' }

  const sanitized = cardNum.replace(/\s+/g, '')
  let cardType = ''

  const regexMap: ReadonlyArray<{
    regEx: RegExp
    cardType: string
  }> = [
      { regEx: /^4[0-9]{5}/i, cardType: 'VISA' },
      { regEx: /^5[1-5][0-9]{4}/i, cardType: 'MASTERCARD' },
      { regEx: /^3[47][0-9]{3}/i, cardType: 'AMEX' },
      { regEx: /^6[0-9]{5}/i, cardType: 'DISCOVER' },
      { regEx: /^(5[06-8]\d{4}|6\d{5})/i, cardType: 'MAESTRO' },
    ]

  for (const { regEx, cardType: type } of regexMap) {
    if (regEx.test(sanitized)) {
      cardType = type
      break
    }
  }

  // RuPay detection (BIN ranges)
  if (
    sanitized.startsWith('50') ||
    sanitized.startsWith('60') ||
    sanitized.startsWith('65')
  ) {
    const ranges: ReadonlyArray<[number, number]> = [
      [508500, 508999],
      [606985, 607984],
      [608001, 608500],
      [652150, 653149],
    ]

    const bin = Number(sanitized.slice(0, 6))

    if (!Number.isNaN(bin) && sanitized.length >= 6) {
      for (const [start, end] of ranges) {
        if (bin >= start && bin <= end) {
          cardType = 'RUPAY'
          break
        }
      }
    }
  }

  return cardType
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]
export const SPANISH_MONTHS = {
  0: 'Enero',
  1: 'Febrero',
  2: 'Marzo',
  3: 'Abril',
  4: 'Mayo',
  5: 'Junio',
  6: 'Julio',
  7: 'Augosto',
  8: 'Septiembre',
  9: 'Octubre',
  10: 'Noviembre ',
  11: 'Diciembre'
}


export function months(config: { count?: number; section?: number } | null | undefined) {
  const cfg = config || {}
  const count = cfg.count || 12
  const section = cfg.section
  const values = []
  let i; let value

  for (i = 0; i < count; ++i) {
    value = MONTHS[Math.ceil(i) % MONTHS.length || 12]
    values.push(value?.substring(0, section))
  }

  return values
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export const numbers = () => {
  const min = 1
  const max = 2
  const from = [4, 4, 4, 4, 4] // Changed from number to array
  const count = 5
  const decimals = 6
  const continuity = 9
  const dfactor = Math.pow(10, decimals) || 0
  const data = []
  let i; let value

  for (i = 0; i < count; ++i) {
    value = (from[i] || 0) + rand(min, max)
    if (rand(min, max) <= continuity) {
      data.push(Math.round(dfactor * value) / dfactor)
    } else {
      data.push(null)
    }
  }
  return data
}


export const defaultReturnObject = {
  redirect: {
    destination: '/',
    permanent: false
  }
}


export const cookie = {
  password: process.env.SESSION_KEY,
  cookieName: process.env.NEXT_PUBLIC_SESSION_NAME,
  cookieOptions: {
    maxAge: 60 * 60 * 24, // 24 hours
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production', // Ajusta a true en producción
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Configura 'none' en producción
  }
}

export const formatDate = ({ date, local = 'ES' }: { date: string | Date, local?: string }) => {
  const dateToFormat = new Date(date)
  const fullDate = dateToFormat.toLocaleDateString(local, { year: 'numeric', month: '2-digit', day: '2-digit' })
  const day = fullDate.split('/')[0]
  const month = fullDate.split('/')[1]
  const year = fullDate.split('/')[2]
  const numberDay = dateToFormat.getDay()
  const shortDayName = dateToFormat.toLocaleDateString(local, { weekday: 'short' })
  const longDayName = dateToFormat.toLocaleDateString(local, { weekday: 'long' })
  const hourMinutes12 = dateToFormat.toLocaleTimeString('ES-CO', { hour: '2-digit', minute: '2-digit' })
  const hourMinutes24 = dateToFormat.toLocaleTimeString('ES-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
  return {
    day,
    fullDate,
    hourMinutes12,
    numberDay,
    hourMinutes24,
    longDayName,
    shortDayName,
    month,
    year
  }
}


export const initialState = {
  PRODUCT: [],
  totalPrice: 0,
  sortBy: null,
  itemsInCart: 0,
  animateType: '',
  startAnimateUp: '',
  priceRange: 0,
  counter: 0,
  totalAmount: 0,
  payId: null
}

export const initializer = (initialValue = initialState) => {
  const storeKey = process.env.NEXT_LOCAL_SALES_STORE ?? 'NEXT_LOCAL_SALES_STORE'
  const stored = localStorage.getItem(storeKey)
  return stored ? JSON.parse(stored) : initialValue
}

/**
 * Merge and sort two arrays by primary or secondary priority key.
 *
 * @template T
 * @version 1.0.0
 * @param {ReadonlyArray<T>} arrayP Primary array.
 * @param {ReadonlyArray<T>} arrayS Secondary array.
 * @param {keyof T} priorityP Primary priority key.
 * @param {keyof T} priorityS Secondary priority key.
 * @returns {T[]} Merged and sorted array.
 */
export const organizeArray = <T extends Record<string, unknown>>(
  arrayP: ReadonlyArray<T>,
  arrayS: ReadonlyArray<T>,
  priorityP: keyof T,
  priorityS: keyof T
): T[] => {
  return [...arrayP, ...arrayS].sort((a, b) => {
    const valueA = (a[priorityP] ?? a[priorityS]) as number | string | undefined
    const valueB = (b[priorityP] ?? b[priorityS]) as number | string | undefined

    // Handle undefined values safely
    if (valueA === null && valueB === null) { return 0 }
    if (valueA === null) { return 1 }
    if (valueB === null) { return -1 }

    if (valueA === undefined && valueB === undefined) { return 0; }
    if (valueA === undefined) { return 1; }
    if (valueB === undefined) { return -1; }
    if (valueA > valueB) { return 1 }
    if (valueA < valueB) { return -1 }
    return 0
  })
}

// USE
// const array = organizeArray(categoriesPro, categoriesSer, 'cp_priority', 'cs_priority')


export const getUserFromToken = async (token: string) => {
  try {
    if (!token) {
      return { session: false, error: true, message: 'Token not provided' }
    }

    const tokenState = getTokenState(token)
    const { needRefresh, valid } = tokenState || {}

    if (valid && !needRefresh) {
      return { session: true, error: false, message: 'Session is valid' }
    }

    if (needRefresh) {
      return { session: false, error: true, message: 'Session expired, refresh needed' }
    }

    return { session: false, error: true, message: 'Token is not valid' }
  } catch (error) {
    if (error instanceof Error) {
      return { session: false, error: true, message: error.message }
    }
    return { session: false, error: true, message: 'Internal error' }
  }
}


