'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useDeleteProductsFood, useUpdateCartCookie } from 'npm-pkg-hook'
import {
  CardProducts,
  EmptyData,
  Loading,
  Skeleton,
  Text,
  VirtualizedList
} from 'pkg-components'
import type { ProductFood } from 'pkg-components/stories/pages/GenerateSales/types'
import React, {
  useCallback,
  useMemo,
  useState
} from 'react'

import styles from './styles.module.css'

/**
 * Notification payload used by sendNotification prop.
 */
export type NotificationPayload = {
  title?: string
  description?: string
  backgroundColor?: string
  [key: string]: unknown
}

/**
 * Category shape expected by the component.
 */
export interface ProductCategory {
  carProId: string | number
  pName?: string
  productFoodsAll?: ProductFood[] | null
  [key: string]: unknown
}

/**
 * Props for ProductCategories component.
 */
export interface ProductCategoriesProps {
  data?: ProductCategory[]
  reference?: React.RefObject<HTMLDivElement> | null
  loadingCatProd?: boolean
  sendNotification?: (payload: NotificationPayload) => unknown
  handleGetOneProduct?: (food: ProductFood) => unknown
}

/**
 * Local loading state for delete actions.
 */
type LoadingProductState = {
  loading: boolean
  id: string | null
}

/**
 * ProductCategories
 *
 * Renders categories of products with cards. Lightweight validation:
 * - ensures `data` is an array
 * - provides safe defaults for optional callbacks
 *
 * @param {ProductCategoriesProps} props component props
 * @returns {JSX.Element}
 */
export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  data = [],
  reference = null,
  loadingCatProd = false,
  sendNotification = () => undefined,
  handleGetOneProduct = () => undefined
}) => {
  const { handleRemoveProductToCookieCart } = useUpdateCartCookie()
  const containerStyle = useMemo(() => ({ padding: '0px 30px 0' }), [])

  const router = useRouter()
  const { handleDelete, loading } = useDeleteProductsFood({ sendNotification })
  const [isLoadingProduct, setIsLoadingProduct] = useState<LoadingProductState>({
    loading: false,
    id: null
  })

  /**
   * Handle delete click for a given product.
   * - marks local loading state
   * - removes from cookie cart (optimistic)
   * - calls remote delete and clears loading state
   *
   * @param {ProductFood} food product to remove
   */
  const handleClickDelete = useCallback(
    async (food: ProductFood) => {
      const pId = food?.pId ?? null
      const pState = food?.pState

      if (!pId) {
        sendNotification({
          description: 'Missing product id.',
          title: 'Error',
          backgroundColor: 'error'
        })
        return
      }

      setIsLoadingProduct({ loading: true, id: String(pId) })
      try {
        // remove locally (optimistic)
        handleRemoveProductToCookieCart(food)
        // remote delete
        await handleDelete({ pId, pState })
      } catch (err) {
        // revert / report error
        sendNotification({
          description: err instanceof Error ? err.message : 'Failed to delete product.',
          title: 'Delete error',
          backgroundColor: 'error'
        })
      } finally {
        setIsLoadingProduct({ loading: false, id: null })
      }
    },
    [handleDelete, handleRemoveProductToCookieCart, sendNotification]
  )

  if (loadingCatProd) {
    return (
      <div>
        <Skeleton height={200} numberObject={6} />
      </div>
    )
  }

  // defensive: ensure `data` is an array
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={containerStyle}>
        <Text color='gray-dark' size='lg'>No categories found.</Text>
        <Skeleton height={170} numberObject={2} />
      </div>
    )
  }

  return (
    <>
      {loading && <Loading />}
      <div style={containerStyle}>
        <VirtualizedList
          items={data}
          viewHeight="auto"
          grid={true}
          columns={1}  // Si no quieres calcular columnas automáticamente, mantén esto.
          minColumnWidth={130} // Esto asegura un ancho mínimo para las tarjetas.
          columnGap={15}  // Espacio entre columnas
          itemHeight={250}  // Fijo o dinámico si se requiere.
          observeResize={true}  // Autoajuste del grid con ResizeObserver
          className={styles.content__categories}
          emptyComponent={<EmptyData height={250} width={250} />}
          render={(category, index) => {
            const keyId = category.carProId ?? `cat-${index}`
            const categoryName = category.pName ?? ''
            return (
              <div key={String(keyId)}>
                <div>
                  <div id={String(index)} data-category-name={categoryName}>
                    <div className={styles.content_search}>
                      <Text color='gray-dark' size='5xl'>
                        {categoryName}
                      </Text>
                    </div>
                  </div>

                  <div className={styles.container_carrusel}>
                    {(Array.isArray(category.productFoodsAll) && category.productFoodsAll.length > 0)
                      ? category.productFoodsAll.map((food) => {
                        const ProImage = food?.ProImage ?? ''
                        const image = ProImage?.startsWith?.('/images/placeholder-image.webp')
                          ? '/images/placeholder-image-big-card.webp'
                          : `/api/images/${ProImage}`

                        return (
                          <CardProducts
                            food={food}
                            handleDelete={() => handleClickDelete(food)}
                            image={
                              <Image
                                alt={String(image)}
                                blurDataURL={String(image)}
                                height={300}
                                layout='responsive'
                                objectFit='cover'
                                src={String(image)}
                                width={300}
                              />
                            }
                            isEdit={true}
                            isVisible={true}
                            key={String(food.pId)}
                            loading={isLoadingProduct.loading && isLoadingProduct.id === food.pId}
                            onClick={() => handleGetOneProduct(food)}
                            redirect={() => {
                              if (!food.pId) {
                                return sendNotification({
                                  description: 'Lo sentimos, no encontramos tu producto.',
                                  title: 'Error',
                                  backgroundColor: 'error'
                                })
                              }
                              return router.push(`/products/edit?pId=${encodeURIComponent(food.pId)}`)
                            }}
                          />
                        )
                      })
                      : <Skeleton height={170} numberObject={2} />}
                  </div>
                </div>

                {index === data.length - 1 && (
                  <div ref={reference} style={{ height: '100px', marginTop: '100px' }} />
                )}
              </div>
            )
          }}
        />
      </div>
    </>
  )
}

/**
 * Memoized export to avoid unnecessary re-renders.
 */
export const StickyBoundaryCategories = React.memo(ProductCategories)