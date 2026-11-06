'use client'

import {
  useDeleteProductsFood,
  useFilterConfigs,
  useProductsFood
} from 'npm-pkg-hook'
import { DisabledProducts } from 'pkg-components'
import React, { useCallback, useContext, useState } from 'react'

import { Context } from '../../../context/Context'

/** pState value that identifies disabled products. */
const DISABLED_STATE = 0
const MIN_SEARCH_LENGTH = 4

interface AppliedFilters {
  categories?: string[]
  orderBy?: string[]
  priceMin?: number | null
  priceMax?: number | null
}

/**
 * Container for /products/disabled.
 * Fetches disabled products (pState = 0), wires filters, search, pagination
 * and the restore action into the DisabledProducts page component.
 */
export const DisabledProductsContainer = () => {
  const { sendNotification } = useContext(Context)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({})
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const {
    data: dataFilter,
    loading: loadingFilter,
    error: errorFilter,
    buildVariables
  } = useFilterConfigs()

  const [products, { loading, pagination, refetch }] = useProductsFood({
    search: search.length >= MIN_SEARCH_LENGTH ? search : '',
    categories: appliedFilters.categories ?? [],
    priceMin: appliedFilters.priceMin ?? null,
    priceMax: appliedFilters.priceMax ?? null,
    orderBy: appliedFilters.orderBy ?? [],
    pState: DISABLED_STATE,
    max: 100,
    min: 0,
    callback: () => undefined
  })

  const { handleDelete } = useDeleteProductsFood({
    sendNotification,
    onSuccess: () => {
      refetch({ page: currentPage })
    }
  })

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber)
    refetch({ page: pageNumber })
  }, [refetch])

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const handleApplyFilters = useCallback((selection: Record<string, Set<string>>) => {
    const variables = buildVariables(selection)
    const next: AppliedFilters = {
      categories: variables.categories ?? [],
      orderBy: variables.orderBy ?? [],
      priceMin: typeof variables.priceMin === 'number' ? variables.priceMin : null,
      priceMax: typeof variables.priceMax === 'number' ? variables.priceMax : null
    }
    setAppliedFilters(next)
    setCurrentPage(1)
    // pState is always forced to DISABLED_STATE: this view only lists disabled products.
    refetch({ ...next, page: 1, pState: DISABLED_STATE })
  }, [buildVariables, refetch])

  const handleClearFilters = useCallback(() => {
    setAppliedFilters({})
    setCurrentPage(1)
    refetch({
      page: 1,
      categories: [],
      orderBy: [],
      priceMin: null,
      priceMax: null,
      pState: DISABLED_STATE
    })
  }, [refetch])

  const handleRestore = useCallback(async (product: { pId: string | null }) => {
    if (!product?.pId) return
    setRestoringId(product.pId)
    try {
      // The mutation toggles the state: 0 (disabled) -> 1 (active).
      await handleDelete({ pId: product.pId, pState: DISABLED_STATE } as any)
    } finally {
      setRestoringId(null)
    }
  }, [handleDelete])

  return (
    <DisabledProducts
      products={products}
      pagination={{
        currentPage: pagination?.currentPage ?? currentPage,
        totalPages: pagination?.totalPages ?? 0
      }}
      loading={loading}
      restoringId={restoringId}
      dataFilter={dataFilter as any}
      loadingFilter={loadingFilter}
      errorFilter={errorFilter}
      handlePageChange={handlePageChange}
      handleSearch={handleSearch}
      onApplyFilters={handleApplyFilters}
      onClearFilters={handleClearFilters}
      handleRestore={handleRestore}
      sendNotification={sendNotification}
    />
  )
}
