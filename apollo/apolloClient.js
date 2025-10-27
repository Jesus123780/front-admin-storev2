'use client'

import {
  ApolloClient,
  ApolloLink,
  split
} from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createUploadLink } from 'apollo-upload-client'
import merge from 'deepmerge'
import { createClient } from 'graphql-ws'
import isEqual from 'lodash/isEqual'
import { Cookies, SERVICES } from 'npm-pkg-hook'
import { useMemo } from 'react'

import { cache } from './cache'
import { removeDoubleQuotes } from './helpers'
import { typeDefs } from './schema'
import { URL_ADMIN } from './urls'

export const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__'

let apolloClient

/**
 * 🔑 Build Auth headers
 */
const buildAuthHeaders = () => {
  try {
    if (typeof window !== 'undefined') {
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
function createHttpLink(service) {
  let uri = `${process.env.NEXT_PUBLIC_URL_BACK_SERVER}/graphql`

  if (service === SERVICES.ADMIN_STORE) {uri = `${URL_ADMIN}graphql`}
  if (service === SERVICES.WEB_SOCKET_CHAT)
    {uri = `${process.env.NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET}/graphql`}
  if (service === SERVICES.ADMIN_SERVER)
    {uri = `${process.env.NEXT_PUBLIC_URL_ADMIN_SERVER_HTTPS}`}

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
  if (typeof window === 'undefined') {return null}

  const url = process.env.NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET

  if (!url) {return null}

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

export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient()

  if (initialState) {
    const existingCache = _apolloClient.extract()
    const data = merge(initialState, existingCache, {
      arrayMerge: (dest, src) => [
        ...src,
        ...dest.filter((d) => src.every((s) => !isEqual(d, s))),
      ],
    })
    _apolloClient.cache.restore(data)
  }

  if (typeof window === 'undefined') {return _apolloClient}
  if (!apolloClient) {apolloClient = _apolloClient}
  return _apolloClient
}

export function addApolloState(client, pageProps) {
  if (pageProps?.props) {
    pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract()
  }
  return pageProps
}

export function useApollo(initialState) {
  return useMemo(() => initializeApollo(initialState), [initialState])
}
