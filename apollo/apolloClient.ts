'use client'

import type { ApolloClient as ApolloClientType, NormalizedCacheObject } from '@apollo/client'
import {
  ApolloClient,
  ApolloLink,
  Observable,
  fromPromise,
  split
} from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createUploadLink } from 'apollo-upload-client'
import { createClient } from 'graphql-ws'
import { print } from 'graphql'
import {
  Cookies,
  SERVICES
} from 'npm-pkg-hook'
import { useMemo } from 'react'

import { cache } from './cache'
import { removeDoubleQuotes } from './helpers'
import { deepEqual, isPlainObject } from './helpers/apollo-client.helpers'
import { isLoggedVar } from './helpers/is-logged-var'
import {
  getAccessToken,
  refreshSession
} from './helpers/session-token'
import { typeDefs } from './schema'
import { URL_ADMIN } from './urls'

export const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__'

let apolloClient: ApolloClientType<NormalizedCacheObject>

/**
 * 🔑 Build Auth headers
 */
const buildAuthHeaders = () => {
  try {
    if (globalThis.window !== undefined) {
      // Prefer the in-memory access token (kept fresh by proactive/reactive
      // refresh); falls back to the session cookie after a reload.
      const token = getAccessToken()
      const restaurant = removeDoubleQuotes(Cookies.get('restaurant'))
      return {
        authorization: token ? `Bearer ${token}` : 'Bearer',
        restaurant: restaurant ?? '',
        deviceid: '',
      }
    }
    return { authorization: 'Bearer', restaurant: '', deviceid: '' }
  } catch {
    return { authorization: 'Bearer', restaurant: '', deviceid: '' }
  }
}

/**
 * Standardized GraphQL error codes shared with the backend.
 */
const ERROR_CODES = {
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN'
} as const

/**
 * Extracts the GraphQL error code (uppercased) from an error entry.
 */
const getErrorCode = (error: { extensions?: { code?: unknown } }): string =>
  String(error?.extensions?.code ?? '').toUpperCase()

/**
 * A refreshable error is ONLY an expired access token (SESSION_EXPIRED). An
 * expired message without an explicit FORBIDDEN/UNAUTHENTICATED code is also
 * treated as refreshable for backward compatibility with older responses.
 */
const isRefreshableError = (error: {
  message?: string
  extensions?: { code?: unknown }
}): boolean => {
  const code = getErrorCode(error)
  if (code === ERROR_CODES.FORBIDDEN || code === ERROR_CODES.UNAUTHENTICATED) {
    return false
  }
  if (code === ERROR_CODES.SESSION_EXPIRED) { return true }

  const message = String(error?.message ?? '').toLowerCase()
  return (
    message.includes('session expired') ||
    (message.includes('sesión') && message.includes('expir'))
  )
}

/**
 * A hard auth failure (invalid token / forbidden / unauthenticated) that must
 * end the session without attempting a refresh.
 */
const isHardAuthError = (error: {
  extensions?: { code?: unknown }
}): boolean => {
  const code = getErrorCode(error)
  return code === ERROR_CODES.FORBIDDEN || code === ERROR_CODES.UNAUTHENTICATED
}

/**
 * Marks the session as expired so the UI (Auth.tsx) performs the real logout.
 * Guarded so a burst of errors only triggers it once.
 */
let isHandlingSessionExpiration = false
const markSessionExpired = (message?: string): void => {
  if (globalThis.window === undefined) { return }
  if (isHandlingSessionExpiration) { return }
  isHandlingSessionExpiration = true
  isLoggedVar({
    state: false,
    expired: true,
    message: message ?? 'La sesión ha expirado',
    code: 403
  })
}

/**
 * 🚨 Error link: reactive token refresh.
 *
 * - SESSION_EXPIRED: refresh the access token (single-flight) and retry the
 *   original operation transparently. If refresh fails, end the session.
 * - FORBIDDEN / UNAUTHENTICATED: do NOT refresh; end the session.
 *
 * The refresh request itself is a plain fetch (see refreshSession), so it can
 * never re-enter this GraphQL error link, preventing refresh retry loops.
 */
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (!graphQLErrors?.length) { return }

  const hardAuthError = graphQLErrors.find((err) => isHardAuthError(err))
  if (hardAuthError) {
    markSessionExpired(hardAuthError.message)
    return
  }

  const refreshable = graphQLErrors.find((err) => isRefreshableError(err))
  if (!refreshable) { return }

  // Attempt a single-flight refresh, then retry the original operation with
  // the updated Authorization header.
  return fromPromise(
    refreshSession().catch(() => null)
  ).flatMap((newToken) => {
    if (!newToken) {
      // Refresh failed -> the refresh token is invalid/expired/revoked.
      markSessionExpired('La sesión ha expirado')
      // Returning an empty observable lets the original error propagate.
      return fromPromise(Promise.resolve()).flatMap(() => forward(operation))
    }

    // Update the operation's Authorization header with the new access token.
    operation.setContext((prev: { headers?: Record<string, string> }) => ({
      headers: {
        ...(prev?.headers ?? {}),
        authorization: `Bearer ${newToken}`
      }
    }))

    return forward(operation)
  })
})

/**
 *  GraphQL over HTTP (queries & mutations)
 */
function createHttpLink(service: string) {
  let uri = `${process.env.NEXT_PUBLIC_URL_BACK_SERVER}/graphql`

  if (service === SERVICES.ADMIN_STORE) { uri = `${URL_ADMIN}graphql` }
  if (service === SERVICES.WEB_SOCKET_CHAT) { uri = `${process.env.NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET}/graphql` }
  if (service === SERVICES.ADMIN_SERVER) { uri = `${process.env.NEXT_PUBLIC_URL_ADMIN_SERVER_HTTPS}` }

  return createUploadLink({
    uri,
    credentials: 'include',
    headers: buildAuthHeaders(),
  })
}

/** Normalize either an HTTP base URL or an explicit WebSocket endpoint. */
function socketUrl(raw?: string): string | undefined {
  if (!raw) return undefined
  const base = raw.trim().replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:').replace(/\/+$/, '')
  if (!/^wss?:\/\//i.test(base)) return undefined
  return base.endsWith('/graphql') ? base : `${base}/graphql`
}

function createWsLink(raw: string | undefined, label: string) {
  if (typeof window === 'undefined') return null
  const url = socketUrl(raw)
  if (!url) return null
  return new GraphQLWsLink(createClient({
    url,
    lazy: true,
    keepAlive: 15_000,
    retryAttempts: 10,
    connectionAckWaitTimeout: 10_000,
    connectionParams: () => buildAuthHeaders(),
    on: {
      connected: () => console.info(`[${label}] Connected`),
      closed: event => console.info(`[${label}] Closed`, event.code),
      error: error => console.error(`[${label}] WebSocket error`, error)
    }
  }))
}

const BACKEND_SUBSCRIPTIONS = new Set([
  'newStoreOrder', 'StockUpdatedById', 'StockUpdatedAll',
  'reportJobUpdated', 'greetings', 'increment'
])

function isBackendSubscription(query: Parameters<typeof getMainDefinition>[0]): boolean {
  const def = getMainDefinition(query)
  return def.kind === 'OperationDefinition' &&
    def.operation === 'subscription' &&
    def.selectionSet.selections.some(selection =>
      selection.kind === 'Field' && BACKEND_SUBSCRIPTIONS.has(selection.name.value)
    )
}

function unavailableWs(label: string): ApolloLink {
  return new ApolloLink(() => new Observable(observer => {
    observer.error(new Error(`${label}: WebSocket endpoint unavailable`))
  }))
}

/** Decode only for client-side scope checks, never for authorization. */
function cashTokenClaims(authorization: string): {sub?: string; exp?: number} {
  try {
    const part = authorization.split(' ')[1].split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')))
  } catch { return {} }
}

/** Each cash stream binds auth headers and tenant to its own operation. */
function createCashWsLink() {
  return new ApolloLink(operation => new Observable(observer => {
    const url = socketUrl(process.env.NEXT_PUBLIC_CASH_WS_URL || process.env.NEXT_PUBLIC_URL_BACK_SERVER)
    if (!url || typeof window === 'undefined') { observer.error(new Error('Cash WebSocket unavailable')); return }
    let disposed = false
    let stop: (() => void) | undefined
    let monitor: ReturnType<typeof setInterval> | undefined
    void (async () => {
      let headers = buildAuthHeaders()
      if (headers.restaurant !== operation.variables.storeId) throw new Error('Cash tenant changed')
      const claims = cashTokenClaims(headers.authorization)
      if (claims.exp && claims.exp * 1000 <= Date.now() + 30000) {
        await refreshSession()
        headers = buildAuthHeaders()
      }
      if (disposed) return
      if (headers.restaurant !== operation.variables.storeId || !cashTokenClaims(headers.authorization).sub) throw new Error('Cash auth scope missing')
      const client = createClient({ url, lazy: true, retryAttempts: 0, connectionParams: () => headers, connectionAckWaitTimeout: 10000 })
      const unsubscribe = client.subscribe({ query: print(operation.query), variables: operation.variables, operationName: operation.operationName }, {
        next: result => observer.next(result as any), error: error => observer.error(error), complete: () => observer.complete()
      })
      stop = () => { unsubscribe(); void client.dispose() }
      if (disposed) { stop(); return }
      // No HTTP polling: compare in-memory credentials only. Restart stream on rotation/logout.
      monitor = setInterval(() => {
        const current = buildAuthHeaders()
        if (current.authorization !== headers.authorization || current.restaurant !== headers.restaurant) observer.error(new Error('Cash credentials changed'))
      }, 1000)
    })().catch(error => { if (!disposed) observer.error(error) })
    return () => { disposed = true; if (monitor) clearInterval(monitor); stop?.() }
  }))
}

function createApolloClient() {
  const ssrMode = typeof window === 'undefined'
  const legacyWsLink = createWsLink(process.env.NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET, 'AdminWS') ?? unavailableWs('AdminWS')
  const backendWsLink = createWsLink(
    process.env.NEXT_PUBLIC_CASH_WS_URL || process.env.NEXT_PUBLIC_URL_BACK_SERVER,
    'BackendWS'
  ) ?? unavailableWs('BackendWS')
  const cashWsLink = createCashWsLink()

  const httpLink = new ApolloLink((operation, forward) => {
    const { clientName: service, cashScope } = operation.getContext()
    if (cashScope) {
      const headers = buildAuthHeaders()
      if (headers.restaurant !== cashScope.storeId || cashTokenClaims(headers.authorization).sub !== cashScope.actorId) {
        return new Observable(observer => { observer.error(new Error('Cash auth scope changed')) })
      }
    }
    const link = createHttpLink(service)
    return link.request(operation, forward)
  })

  // Route subscriptions by their actual GraphQL root field (not operation name).
  // Explicit BACKEND_REALTIME also supports the updated order hook.
  const subscriptionsLink = split(
    operation => {
      const def = getMainDefinition(operation.query)
      return def.kind === 'OperationDefinition' && def.operation === 'subscription' &&
        (operation.getContext().clientName === 'CASH_REALTIME' ||
          def.selectionSet.selections.some(selection => selection.kind === 'Field' && selection.name.value === 'cashManagementChanged'))
    },
    cashWsLink,
    split(
      operation => operation.getContext().clientName === 'BACKEND_REALTIME' || isBackendSubscription(operation.query),
      backendWsLink,
      legacyWsLink
    )
  )

  const splitLink = split(
    ({ query }) => {
      const def = getMainDefinition(query)
      return def.kind === 'OperationDefinition' && def.operation === 'subscription'
    },
    subscriptionsLink,
    ApolloLink.from([errorLink, httpLink])
  )

  return new ApolloClient({
    ssrMode,
    connectToDevTools: true,
    link: splitLink,
    cache,
    typeDefs,
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
      },
      query: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  })
}


/**
 * Merge two arrays preferring `source` items first then unique `target` items.
 * Mirrors the original merge behavior:
 * result = [ ...source, ...target.filter(t => source.every(s => !isEqual(t,s))) ]
 * @param target - initialState array
 * @param source - existingCache array
 */
const mergeArraysUnique = (target: unknown[], source: unknown[]): unknown[] => {
  const result: unknown[] = []
  // push source items first
  for (const s of source) { result.push(s) }
  // push target items only if not deeply equal to any source item
  for (const t of target) {
    const existsInSource = source.some((s) => deepEqual(s, t))
    if (!existsInSource) { result.push(t) }
  }
  return result
}

/**
 * Deep merge two normalized cache objects.
 * - If both values are arrays -> mergeArraysUnique
 * - If both are plain objects -> recurse
 * - Otherwise take `source` value (existingCache) over `target` (initialState)
 *
 * @param target - initialState (may be null)
 * @param source - existingCache
 */
const mergeDeep = (
  target: Record<string, unknown> | null,
  source: Record<string, unknown>
): Record<string, unknown> => {
  if (!target) { return { ...source } }
  const out: Record<string, unknown> = { ...target }

  for (const key of Object.keys(source)) {
    const sVal = source[key]
    const tVal = out[key]

    if (Array.isArray(tVal) && Array.isArray(sVal)) {
      out[key] = mergeArraysUnique(tVal, sVal)
    } else if (isPlainObject(tVal) && isPlainObject(sVal)) {
      out[key] = mergeDeep(tVal, sVal)
    } else {
      // prefer source (existingCache) to override target (initialState)
      out[key] = sVal
    }
  }

  return out
}

/**
 * Initialize or reuse an Apollo Client, merging an optional initial state
 * into the client's cache. Works both server-side (returns a fresh client)
 * and client-side (singleton).
 *
 * @param initialState - GraphQL normalized cache object (or null)
 * @returns ApolloClient<NormalizedCacheObject>
 *
 * @throws TypeError if initialState is not null and not a plain object
 */
export const initializeApollo = (
  initialState: Record<string, unknown> | null = null
): ApolloClient<NormalizedCacheObject> => {
  // create or reuse local client variable (do not mutate module-level before creation)
  const _apolloClient = apolloClient ?? createApolloClient()

  try {
    if (initialState !== null && !isPlainObject(initialState)) {
      throw new TypeError('initializeApollo: initialState must be null or a plain object')
    }

    if (initialState) {
      const existingCache = _apolloClient.extract()
      const merged = mergeDeep(initialState, existingCache)
      // restore expects NormalizedCacheObject; cast is safe if data shape is correct
      _apolloClient.cache.restore(merged as NormalizedCacheObject)
    }

    // On server, always return a new client instance (per-request).
    if (globalThis.window === undefined) { return _apolloClient }

    // On client, create the singleton once.
    if (!apolloClient) { apolloClient = _apolloClient }

    return _apolloClient
  } catch (error) {
    // Keep behavior deterministic: in case of merge errors, return a fresh client and log.
    // Avoid silently swallowing exceptions that could break app state merging.
    // eslint-disable-next-line no-console
    console.error('initializeApollo error:', error)
    const fallback = createApolloClient()
    if (globalThis.window !== undefined) { apolloClient = fallback }
    return fallback
  }
}

interface PagePropsWithProps {
  props?: Record<string, unknown>;
}

export function addApolloState(
  client: ApolloClientType<NormalizedCacheObject>,
  pageProps: PagePropsWithProps
): PagePropsWithProps {
  if (pageProps?.props) {
    pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract()
  }
  return pageProps
}

export type UseApolloReturn = (initialState: Record<string, unknown> | null) => ApolloClientType<NormalizedCacheObject>;

export function useApollo(initialState: Record<string, unknown> | null): ApolloClientType<NormalizedCacheObject> {
  return useMemo(() => initializeApollo(initialState), [initialState])
}
