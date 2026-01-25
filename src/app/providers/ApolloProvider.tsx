'use client';

import { ApolloProvider } from '@apollo/client';

import { useApollo } from '../../../apollo/apolloClient'

interface ApolloClientProviderProps {
  children: React.ReactNode
  initialApolloState?: any
}

export default function ApolloClientProvider({ children, initialApolloState }: ApolloClientProviderProps) {
  const apolloClient = useApollo(initialApolloState)

  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  )
}
