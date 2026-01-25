'use client'

import type { ApolloClient as ApolloClientType, NormalizedCacheObject } from '@apollo/client'
import {
  ApolloClient,
  ApolloLink,
  split
} from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createUploadLink } from 'apollo-upload-client'
import { createClient } from 'graphql-ws'
import { Cookies, SERVICES } from 'npm-pkg-hook'
import { useMemo } from 'react'

import { cache } from './cache'
import { removeDoubleQuotes } from './helpers'
import { deepEqual, isPlainObject } from './helpers/apollo-client.helpers'
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
      const token = Cookies.get('session')
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
 * 🔌 GraphQL over HTTP (queries & mutations)
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

/**
 * 🔌 GraphQL over WS (subscriptions)
 */
function createWsLink() {
  if (globalThis.window === undefined) { return null }

  const url = process.env.NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET

  if (!url) { return null }

  return new GraphQLWsLink(
    createClient({
      url: `${url}/graphql`,
      connectionParams: () => buildAuthHeaders(),
      retryAttempts: 5,
      shouldRetry: () => true,
      on: {
        connected: () => console.log('✅ WS connected'),
        closed: (e) => console.log('❌ WS closed', e),

        error: (err) => console.error('⚠️ WS error:', err),
      },
    })
  )
}

function createApolloClient() {
  const ssrMode = typeof window === 'undefined'
  const wsLink = createWsLink()

  const httpLink = new ApolloLink((operation, forward) => {
    const service = operation.getContext().clientName
    const link = createHttpLink(service)
    return link.request(operation, forward)
  })

  // 👇 Split: subscriptions → WS | queries/mutations → HTTP
  const splitLink = !ssrMode && wsLink
    ? split(
      ({ query }) => {
        const def = getMainDefinition(query)
        return (
          def.kind === 'OperationDefinition' &&
          def.operation === 'subscription'
        )
      },
      wsLink,
      httpLink
    )
    : httpLink

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
