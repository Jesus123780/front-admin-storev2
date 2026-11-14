
'use client'

import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { Loader } from '../index'

interface LoadingContextValue {
  isLoading: boolean
  startLoading: () => () => void
  withLoading: <T>(
    operation: () => Promise<T>
  ) => Promise<T>
}

const LoadingContext =
  createContext<LoadingContextValue | null>(null)

export function LoadingProvider({
  children
}: {
  children: ReactNode
}) {
  const [pendingCount, setPendingCount] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)

  const startLoading = useCallback(() => {
    let finished = false

    setPendingCount(count => count + 1)

    return () => {
      if (finished) {return}

      finished = true

      setPendingCount(count =>
        Math.max(0, count - 1)
      )
    }
  }, [])

  const withLoading = useCallback(
    async <T,>(
      operation: () => Promise<T>
    ): Promise<T> => {
      const finish = startLoading()

      try {
        return await operation()
      } finally {
        finish()
      }
    },
    [startLoading]
  )

  useEffect(() => {
    if (pendingCount === 0) {
      setShowOverlay(false)
      return
    }

    // Evita mostrar un loader en operaciones
    // demasiado rápidas.
    const timer = window.setTimeout(() => {
      setShowOverlay(true)
    }, 180)

    return () => window.clearTimeout(timer)
  }, [pendingCount])

  const value = useMemo(
    () => ({
      isLoading: pendingCount > 0,
      startLoading,
      withLoading
    }),
    [pendingCount, startLoading, withLoading]
  )

  return (
    <LoadingContext.Provider value={value}>
      {children}

      <Loader
        label='Procesando información...'
        exiting={!showOverlay}
      />
    </LoadingContext.Provider>
  )
}

export function useVentyLoading() {
  const context = useContext(LoadingContext)

  if (!context) {
    throw new Error(
      'useVentyLoading debe usarse dentro de LoadingProvider'
    )
  }

  return context
}
