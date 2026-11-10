
'use client'

import {
  ProductStatus,
  useDeleteProductsFood,
  useFilterConfigs,
  useProductsFood,
  useUpdateStatusProduct
} from 'npm-pkg-hook'
import { DisabledProducts } from 'pkg-components'
import React, {
  useCallback,
  useContext,
  useState
} from 'react'

import { Context } from '../../../context/Context'

const DISABLED_STATE = 0
const MIN_SEARCH_LENGTH = 4

interface AppliedFilters {
  categories?: string[]
  orderBy?: string[]
  priceMin?: number | null
  priceMax?: number | null
}

interface RestoreProductInput {
  pId: string
  pState: number
}

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

  useDeleteProductsFood({
    sendNotification,
    onSuccess: () => {
      refetch({ page: currentPage })
    }
  })

  const [
    updateStatusProduct
   ]= useUpdateStatusProduct()

  const handlePageChange = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber)
    refetch({ page: pageNumber })
  }, [refetch])

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const handleApplyFilters = useCallback((
    selection: Record<string, Set<string>>
  ) => {
    const variables = buildVariables(selection)

    const next: AppliedFilters = {
      categories: variables.categories ?? [],
      orderBy: variables.orderBy ?? [],
      priceMin: typeof variables.priceMin === 'number'
        ? variables.priceMin
        : null,
      priceMax: typeof variables.priceMax === 'number'
        ? variables.priceMax
        : null
    }

    setAppliedFilters(next)
    setCurrentPage(1)

    refetch({
      ...next,
      page: 1,
      pState: DISABLED_STATE
    })
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

  /**
   * Restore a disabled product.
   */
  const handleRestore = useCallback(async (
    product: RestoreProductInput
  ) => {
    const { pId } = product ?? {}

    if (!pId) {
      sendNotification({
        title: 'Error',
        description: 'No se encontró el identificador del producto',
        backgroundColor: 'error'
      })
      return
    }

    setRestoringId(pId)

    try {
      const response = await updateStatusProduct({
        pId,
        pState: ProductStatus.ACTIVE
      })

      // Capture the backend response.
      if (!response?.success) {
        sendNotification({
          title: 'No se pudo restaurar',
          description: response?.message ?? 'Ocurrió un error al restaurar el producto',
          backgroundColor: 'error'
        })
        return
      }

      sendNotification({
        title: 'Producto restaurado',
        description: response.message || 'El producto fue activado exitosamente',
        backgroundColor: 'success'
      })

      // Refresh the disabled products listing.
      await refetch({
        page: currentPage,
        pState: DISABLED_STATE
      })

    } catch (error) {
      console.error(
        'DisabledProductsContainer.handleRestore:',
        error
      )

      sendNotification({
        title: 'Error al restaurar',
        description: error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado al restaurar el producto',
        backgroundColor: 'error'
      })
    } finally {
      setRestoringId(null)
    }
  }, [
    currentPage,
    refetch,
    sendNotification,
    updateStatusProduct
  ])

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
