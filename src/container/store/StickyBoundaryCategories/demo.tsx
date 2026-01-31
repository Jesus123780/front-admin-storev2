import Image from 'next/image'
import { useRouter } from 'next/router'
import { useDeleteProductsFood } from 'npm-pkg-hook'
import {
  CardProducts,
  DropdownMenuHeader,
  Loading,
  SearchBar,
  Skeleton
} from 'pkg-components'
import PropTypes from 'prop-types'
import React, {
  useEffect, useRef, useState
} from 'react'

const BGColor = '#f5f5f5' // Replace with your color

// Removed styled imports

import { useSticky } from './helpers'

interface ProductFood {
  pId: string
  ProDescription?: string
  ProImage?: string
  [key: string]: any
}

interface Category {
  carProId: string
  pName: string
  productFoodsAll: ProductFood[]
}

interface ProductCategoriesProps {
  data?: Category[]
  reference?: React.RefObject<HTMLDivElement>
  loadingCatProd?: boolean
  placeholder?: string
  isMobile?: boolean
  sendNotification?: () => void
  handleGetOneProduct?: (food: ProductFood) => void
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  setAlertBox?: (msg: any) => void
}

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  data = [],
  reference = null,
  loadingCatProd = false,
  placeholder = '',
  isMobile = false,
  sendNotification = () => { return },
  handleGetOneProduct = () => { return },
  handleChange = () => { return },
  setAlertBox = () => { return }
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    padding: '0px 30px 0'
  }
  const router = useRouter()
  const { handleDelete, loading } = useDeleteProductsFood({ sendNotification })

  const handleClickDelete = async (food: ProductFood) => {
    await handleDelete({
      pId: food.pId,
      pState: food.pState
    })
  }
  const [currentTitle, setCurrentTitle] = useState<string | null>(null)
  const observer = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 1
    }

    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!entry.target.textContent) { return }
          setCurrentTitle(entry.target.textContent)
        }
      })
    }, options)

    const targets = document.querySelectorAll('.content-search')
    targets.forEach((target) => observer.current?.observe(target))

    return () => {
      targets.forEach((target) => observer.current?.unobserve(target))
    }
  }, [data])
  const elementRef = useRef<HTMLDivElement>(null)
  const isSticky = useSticky({ elementRef, data })

  if (loadingCatProd) {
    return (
      <div style={{ width: '100%', overflowX: 'auto', display: 'flex', gap: 16 }}>
        <Skeleton height={200} numberObject={6} />
      </div>
    )
  }
  const array = data?.map((cat) => cat.pName || '')

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      {loading && <Loading />}
      {isSticky && <div
        style={{
          top: '75px',
          position: 'fixed',
          display: 'flex',
          padding: '20px 30px 0',
          borderBottom: '1px solid #e6e6e6',
          height: '64px',
          right: 0,
          alignItems: 'center',
          zIndex: 999,
          width: isMobile ? '100%' : 'calc(100vw - 210px)',
          backgroundColor: 'var(--color-base-white)'
        }}
      >
        {!!currentTitle && <DropdownMenuHeader
          array={array}
          index={currentTitle}
        />}
        <SearchBar
          border='none'
          handleChange={handleChange}
          margin='0 0 0 20px'
          padding='0'
          placeholder={placeholder}
          width='50%'
        />
      </div>}
      <div
        ref={elementRef}
        style={containerStyle}
      >
        {data?.map((x) => {
          return (
            <div key={x.carProId}>
              <div>
                <div
                  id={x.carProId}
                  // name is not a valid div prop, so removed
                >
                  <div
                    className='content-search'
                    data-title={x.pName}
                    style={{ marginBottom: 8 }}
                  >
                    <span style={{ color: BGColor, fontSize: '.9em', fontWeight: 600 }}>{x?.pName}</span>
                  </div>
                </div>
                <div style={{ width: '100%', overflowX: 'auto', display: 'flex', gap: 16 }}>
                  {x.productFoodsAll?.length > 0 ? x.productFoodsAll?.map(food => {
                    return (
                      <CardProducts
                        food={food}
                        handleDelete={() => handleClickDelete(food)}
                        image={
                          <Image
                            alt={food?.ProDescription || 'DEFAULTBANNER'}
                            blurDataURL='/images/DEFAULTBANNER.png'
                            layout='fill'
                            objectFit='cover'
                            src={food.ProImage || '/images/DEFAULTBANNER.png'}
                          />
                        }
                        isVisible={true}
                        key={food.pId}
                        onClick={() => handleGetOneProduct(food)}
                        redirect={() => router.push(`products/create/${food.pId}`)}
                        setAlertBox={setAlertBox}
                      />
                    )
                  }) : <Skeleton height={200} numberObject={2} />}
                </div>
              </div>
              {(data && x === data[data.length - 1]) &&
                <div ref={reference} style={{ height: '100px', marginTop: '100px' }} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

ProductCategories.propTypes = {
  data: PropTypes.array,
  handleChange: PropTypes.func,
  handleGetOneProduct: PropTypes.func,
  isMobile: PropTypes.bool,
  loadingCatProd: PropTypes.bool,
  placeholder: PropTypes.string,
  reference: PropTypes.any,
  sendNotification: PropTypes.func,
  setAlertBox: PropTypes.func
}
export const StickyBoundaryCategories = React.memo(ProductCategories)
