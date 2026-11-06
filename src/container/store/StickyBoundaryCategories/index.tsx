'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  useDeleteProductsFood,
  useUpdateCartCookie
} from 'npm-pkg-hook'
import {
  CardProducts,
  EmptyData,
  Loading,
  Skeleton,
  Text
} from 'pkg-components'
import type { ProductFood } from 'pkg-components/stories/pages/GenerateSales/types'
import React, { useCallback, useState } from 'react'

import styles from './styles.module.css'

export type NotificationPayload = {
  title?: string
  description?: string
  backgroundColor?: string
  [key: string]: unknown
}

export interface ProductCategory {
  carProId: string | number
  pName?: string
  productFoodsAll?: ProductFood[] | null
  [key: string]: unknown
}

export interface ProductCategoriesProps {
  data?: ProductCategory[]
  reference?: React.RefObject<HTMLDivElement> | null
  loadingCatProd?: boolean
  enablePagination?: boolean
  sendNotification?: (payload: NotificationPayload) => unknown
  handleGetOneProduct?: (food: ProductFood) => unknown
}

type LoadingProductState = {
  loading: boolean
  id: string | null
}

const PLACEHOLDER_IMAGE = '/images/placeholder-image-big-card.webp'

const getProductImage = (productImage?: string | null): string => {
  if (!productImage) { return PLACEHOLDER_IMAGE }

  if (productImage.startsWith('/images/placeholder-image.webp')) {
    return PLACEHOLDER_IMAGE
  }

  if (/^https?:\/\//i.test(productImage) || productImage.startsWith('/')) {
    return productImage
  }

  return `/api/images/${productImage}`
}

/**
 * Displays product categories using a natural-height CSS grid.
 * Categories contain a variable number of products, so this component
 * intentionally does not use VirtualizedList with a fixed itemHeight.
 */
export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  data = [],
  reference = null,
  loadingCatProd = false,
  enablePagination = true,
  sendNotification = () => undefined,
  handleGetOneProduct = () => undefined
}) => {
  const router = useRouter()
  const { handleRemoveProductToCookieCart } = useUpdateCartCookie()
  const { handleDelete, loading } = useDeleteProductsFood({ sendNotification })

  const [isLoadingProduct, setIsLoadingProduct] = useState<LoadingProductState>({
    loading: false,
    id: null
  })

  const handleClickDelete = useCallback(
    async (food: ProductFood): Promise<void> => {
      const pId = food?.pId ?? null

      if (pId == null) {
        sendNotification({
          description: 'No encontramos el identificador del producto.',
          title: 'Error',
          backgroundColor: 'error'
        })
        return
      }

      setIsLoadingProduct({ loading: true, id: String(pId) })

      try {
        // Mantiene el comportamiento optimista que ya tenía el componente.
        handleRemoveProductToCookieCart(food)
        await handleDelete({ pId, pState: food.pState })
      } catch (error) {
        sendNotification({
          description: error instanceof Error
            ? error.message
            : 'No fue posible eliminar el producto.',
          title: 'Error al eliminar',
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
      <div className={styles.loading}>
        <Skeleton height={200} numberObject={6} />
      </div>
    )
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className={styles.empty}>
        <EmptyData height={250} width={250} />
        <Text color='gray-dark' size='lg'>
          No encontramos categorías o productos.
        </Text>
      </div>
    )
  }

  return (
    <>
      {loading && <Loading />}

      <div className={styles.content__categories}>
        {data.map((category, index) => {
          const categoryId = category.carProId ?? `category-${index}`
          const categoryName = category.pName ?? ''
          const products = Array.isArray(category.productFoodsAll)
            ? category.productFoodsAll
            : []

          return (
            <section
              className={styles.category}
              key={String(categoryId)}
            >
              <div
                id={`category-${String(categoryId)}`}
                data-category-name={categoryName}
                className={styles.content_search}
              >
                <Text color='gray-dark' size='5xl'>
                  {categoryName}
                </Text>
              </div>

              {products.length > 0 ? (
                <div className={styles.container_carrusel}>
                  {products.map((food, productIndex) => {
                    const productId = food?.pId
                    const image = getProductImage(food?.ProImage)
                    const productKey = productId == null
                      ? `${String(categoryId)}-product-${productIndex}`
                      : `${String(categoryId)}-${String(productId)}`

                    return (
                      <div
                        className={styles.product_item}
                        key={productKey}
                      >
                        <CardProducts
                          food={food}
                          handleDelete={() => {
                            void handleClickDelete(food)
                          }}
                          image={
                            <Image
                              alt={food?.pName ?? 'Producto'}
                              blurDataURL={image}
                              height={300}
                              layout='responsive'
                              objectFit='cover'
                              src={image}
                              width={300}
                            />
                          }
                          isEdit
                          isVisible
                          loading={
                            isLoadingProduct.loading &&
                            isLoadingProduct.id === String(productId)
                          }
                          onClick={() => handleGetOneProduct(food)}
                          redirect={() => {
                            if (productId == null) {
                              sendNotification({
                                description: 'Lo sentimos, no encontramos tu producto.',
                                title: 'Error',
                                backgroundColor: 'error'
                              })
                              return
                            }

                            router.push(
                              `/products/edit?pId=${encodeURIComponent(String(productId))}`
                            )
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={styles.emptyCategory}>
                  <Text color='gray-dark' size='sm'>
                    No hay productos en esta categoría.
                  </Text>
                </div>
              )}

              {/* El sentinel solo se observa cuando no hay una búsqueda activa. */}
              {enablePagination && index === data.length - 1 && (
                <div
                  ref={reference}
                  className={styles.sentinel}
                  aria-hidden='true'
                />
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}

export const StickyBoundaryCategories = React.memo(ProductCategories)

export default StickyBoundaryCategories
