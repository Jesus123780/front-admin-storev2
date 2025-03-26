"use client"

import { useMemo } from 'react'
import { getMainDefinition } from '@apollo/client/utilities'
import {
  ApolloClient,
  ApolloLink,
  split
} from '@apollo/client'
import { createUploadLink } from 'apollo-upload-client'
import merge from 'deepmerge'
import isEqual from 'lodash/isEqual'
import { URL_ADMIN } from './urls'
import { typeDefs } from './schema'
import { cache } from './cache'
import { WebSocketLink } from '@apollo/client/link/ws'
import { Cookies, SERVICES } from 'npm-pkg-hook'
import { removeDoubleQuotes } from './helpers'

export const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__'

let apolloClient


const authLink = async () => {
  try {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('session')
      const restaurant = removeDoubleQuotes(Cookies.get('restaurant'))
      return {
        authorization: token ? `Bearer ${token}` : 'Bearer',
        restaurant: restaurant ?? '',
        deviceid: ''
      }
    }

    return {
      authorization: 'Bearer',
      restaurant: '',
      deviceid: ''
    }
  } catch (error) {
    return {
      authorization: 'Bearer',
      restaurant: '',
      deviceid: ''
    }

  }
}

function getWebSocketHeaders() {
  try {
    const token = Cookies.get('session')
    const restaurant = removeDoubleQuotes(Cookies.get('restaurant'))

    if (!token || !restaurant) {
      throw new Error('Authentication tokens are missing')
    }

    return {
      authorization: `Bearer ${token}`,
      restaurant: restaurant
    }
  } catch (error) {
    return {
      authorization: `Bearer`,
      restaurant: ''
    }
  }
}

function getWebSocketConnectionParams() {
  return {
    credentials: 'include',
    headers: getWebSocketHeaders()
  }
}

const wsLink = typeof window !== 'undefined' ? new WebSocketLink({
  uri: `${process.env.URL_ADMIN_SERVER_SOCKET}/graphql`,
  options: {
    reconnect: true,
    lazy: true,
    inactivityTimeout: 30000,
    timeout: 10000,
    connectionCallback: handleWebSocketConnectionCallback,
    connectionParams: getWebSocketConnectionParams()
  }
}) : null

const graphqlUrlChat = `${process.env.URL_WEB_SOCKET_CHAT}/graphql`


const wsLink2 = typeof window !== 'undefined' ? new WebSocketLink({
  uri: `${graphqlUrlChat.replace('https', 'wss')}`,
  options: {
    reconnect: true,
    lazy: true,
    inactivityTimeout: 30000,
    timeout: 10000,
    connectionCallback: handleWebSocketConnectionCallback,
    connectionParams: getWebSocketConnectionParams()
  }
}) : null


function handleWebSocketConnectionCallback(res) {
  console.log('WebSocket connected:', res)
}

function createApolloClient() {
  const ssrMode = typeof window === 'undefined'

  const getLink = async (operation) => {
    const headers = await authLink()
    const service = operation.getContext().clientName
    let uri = `${process.env.URL_BACK_SERVER}/graphql`
    if (service === SERVICES.MAIN) uri = `${process.env.URL_BACK_SERVER}/graphql`
    if (service === SERVICES.ADMIN_STORE) uri = `${URL_ADMIN}graphql`
    if (service === SERVICES.WEB_SOCKET_CHAT) uri = `${process.env.URL_WEB_SOCKET_CHAT}/graphql`
    if (service === SERVICES.ADMIN_SERVER) uri = `${process.env.URL_ADMIN_SERVER_SOCKET_HTTPS}`
    const token = Cookies.get('session')
    const context = operation.getContext()
    const { headers: ctx } = context || {}
    const { restaurant } = ctx || {}
    operation.setContext({
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
        client: 'front-admin'
      }
    })

    const link = createUploadLink({
      uri,
      credentials: 'same-origin',
      authorization: service === 'admin-server' || service === 'subscriptions' ? `Bearer ${token}` : `${restaurant}`,

      headers: {
        ...headers
      }
    })
    return link.request(operation)
  }
  const defaultOptions = {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first'
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first'
    },
    mutate: {
      errorPolicy: 'all'
    }
  }

  const allWsLinks = [wsLink2, wsLink].filter(Boolean) // Filtra los enlaces que no sean nulos

  const combinedWsLink = allWsLinks.length > 0 ? ApolloLink.concat(...allWsLinks) : null

   
  const link = ssrMode
    ? ApolloLink.split(() => {return true}, operation => {return getLink(operation)})
    : split(
      operation => {
        const definition = getMainDefinition(operation.query)
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
      },
      combinedWsLink || ApolloLink.empty(),
      ApolloLink.split(() => {return true}, operation => {return getLink(operation)})
    )
  return new ApolloClient({
    connectToDevTools: true,
    ssrMode,
    link: link,
    defaultOptions,
    typeDefs,
    cache
  })
}
export function initializeApollo(initialState = null) {
  const _apolloClient = apolloClient ?? createApolloClient()
  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract()
    // Merge the existing cache into data passed from getStaticProps/getServerSideProps
    const data = merge(initialState, existingCache, {
      // combine arrays using object equality (like in sets)
      arrayMerge: (destinationArray, sourceArray) => {
        return [
          ...sourceArray,
          ...destinationArray.filter(d => { return sourceArray.every(s => { return !isEqual(d, s) }) }
          )
        ]
      }
    })
    // Restore the cache with the merged data
    _apolloClient.cache.restore(data)
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient
  return _apolloClient
}
export function addApolloState(client, pageProps) {
  console.log('Apollo State:', client.cache.extract())
  if (pageProps?.props) {
    pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract()
  }
  return pageProps
}
export function useApollo(initialState) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}
