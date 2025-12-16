'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useDeleteProductsFood, useUpdateCartCookie } from 'npm-pkg-hook'
import {
  CardProducts,
  Loading,
  Skeleton,
  Text
} from 'pkg-components'
import PropTypes from 'prop-types'
import React, { useMemo, useState } from 'react'

import styles from './styles.module.css'

export const ProductCategories = ({
  data = [],
  reference = null,
  loadingCatProd = false,
  sendNotification = (args) => { return args },
  handleGetOneProduct = (food) => { return food }
}) => {
  const { handleRemoveProductToCookieCart } = useUpdateCartCookie()
  const containerStyle = useMemo(() => {
    return {
      padding: '0px 30px 0'
    }
  }, [])

  const router = useRouter()
  const { handleDelete, loading } = useDeleteProductsFood({ sendNotification })
  const [isLoadingProduct, setIsLoadingProduct] = useState({
    loading: false,
    id: null
  })

  const handleClickDelete = async ({ pId, pState, ...res }) => {
    setIsLoadingProduct({ loading: true, id: pId })
    handleRemoveProductToCookieCart({ pId, pState, ...res })
    await handleDelete({
      pId,
      pState
    })
    setIsLoadingProduct({ loading: false, id: null })
  }

  if (loadingCatProd) {return (
    <div>
      <Skeleton height={200} numberObject={6} />
    </div>
  )}

  return (
    <>
      {loading && <Loading />}
      <div style={containerStyle}>
        {data?.map((x, key) => {
          return (
            <div key={x.carProId}>
              <div key={key}>
                <div
                  id={key}
                  name={x?.pName}
                >
                  <div className={styles.content_search}>
                    <Text color='gray-dark' size='.9em' >
                      {x?.pName}
                    </Text>
                  </div>
                </div>
                <div className={styles.container_carrusel}>
                  {(x.productFoodsAll?.length > 0) ? x.productFoodsAll?.map(food => {
                    const { ProImage } = food
                    const image = ProImage?.startsWith('/images/placeholder-image.webp') ? '/images/placeholder-image-big-card.webp' : `/api/images/${ProImage}`

                    return (
                      <CardProducts
                        food={food}
                        handleDelete={() => { return handleClickDelete(food) }}
                        image={
                          <Image
                            alt={`${image}`}
                            blurDataURL={`${image}`}
                            height={300}
                            layout='responsive'
                            objectFit='cover'
                            src={`${image}`}
                            width={300}
                          />
                        }
                        isEdit={true}
                        isVisible={true}
                        key={food.pId}
                        loading={isLoadingProduct.loading && isLoadingProduct.id === food.pId}
                        onClick={() => { return handleGetOneProduct(food) }}
                        redirect={() => {
                          if (!food.pId) {return sendNotification({
                            description: 'Lo sentimos, no encontramos tu producto.',
                            title: 'Error',
                            backgroundColor: 'error'
                          })}
                          return router.push(`products/create/${food.pId}`)
                        }}
                      />
                    )
                  }) : <Skeleton height={200} numberObject={2} />}
                </div>
              </div>
              {(key === data.length - 1) &&
                <div ref={reference} style={{ height: '100px', marginTop: '100px' }} />
              }
            </div>
          )
        })}
      </div>
    </>
  )
}

ProductCategories.propTypes = {
  data: PropTypes.array,
  handleGetOneProduct: PropTypes.func,
  reference: PropTypes.any,
  loadingCatProd: PropTypes.bool,
  sendNotification: PropTypes.func
}
export const StickyBoundaryCategories = React.memo(ProductCategories)
