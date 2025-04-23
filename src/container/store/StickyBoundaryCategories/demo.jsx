import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'
import {
  CardProducts,
  Skeleton,
  DropdownMenuHeader,
  SearchBar,
  Loading
} from 'pkg-components'
import {
  ContainerCarrusel,
  ContentSearch,
  Title
} from '../styledStore'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { BGColor } from '@/public/colors'
import { useDeleteProductsFood } from 'npm-pkg-hook'
import { useSticky } from './helpers'

/**
 * @param {Object} props
 * @param {Array} props.data
 * @param {Function} props.sendNotification
 * @param {Function} props.handleGetOneProduct
 * @param {Function} props.setAlertBox
 * @param {boolean} props.loadingCatProd
 * @param {any} props.reference
 */
export const ProductCategories = ({
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
  const containerStyle = {
    position: 'relative',
    padding: '0px 30px 0'
  }
  const router = useRouter()
  const { handleDelete, loading } = useDeleteProductsFood({ sendNotification })

  const handleClickDelete = async ({ pId, pState }) => {
    await handleDelete({
      pId,
      pState
    })
  }
  const [currentTitle, setCurrentTitle] = useState(null)
  const observer = useRef(null)

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 1.0
    }

    observer.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!entry.target.textContent) return
          setCurrentTitle(entry.target.textContent)
        }
      })
    }, options)

    const targets = document.querySelectorAll('.content-search')
    targets.forEach((target) => {return observer.current.observe(target)})

    return () => {
      targets.forEach((target) => {return observer.current.unobserve(target)})
    }
  }, [data])
  const elementRef = useRef(null)
  const isSticky = useSticky({ elementRef, data })

  if (loadingCatProd) return (
    <ContainerCarrusel>
      <Skeleton height={200} numberObject={6} />
    </ContainerCarrusel>
  )
  const array = data?.map((cat) => {
    return cat.pName || ''
  })

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
          index={currentTitle || null}
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
        as='main'
        ref={elementRef}
        style={containerStyle}
      >
        {data?.map((x, key) => {
          return (
            <div key={x.carProId}>
              <div
                key={key}
              >
                <div
                  as='h3'
                  id={key}
                  name={x?.pName}
                >
                  <ContentSearch className='content-search' data-title={x.pName}>
                    <Title color={BGColor} size='.9em' >{x?.pName}</Title>
                  </ContentSearch>
                </div>
                <ContainerCarrusel>
                  {x.productFoodsAll?.length > 0 ? x.productFoodsAll?.map(food => {
                    return (
                      <CardProducts
                        food={food}
                        handleDelete={() => { return handleClickDelete(food) }}
                        image={
                          <Image
                            alt={food?.ProDescription || '/images/DEFAULTBANNER.png'}
                            blurDataURL='/images/DEFAULTBANNER.png'
                            layout='fill'
                            objectFit='cover'
                            src={'/images/DEFAULTBANNER.png' ?? food.ProImage}
                          />
                        }
                        isVisible={true}
                        key={food.pId}
                        onClick={() => { return handleGetOneProduct(food) }}
                        redirect={() => { return router.push(`products/create/${food.pId}`) }}
                        setAlertBox={setAlertBox}
                      />
                    )
                  }) : <Skeleton height={200} numberObject={2} />}
                </ContainerCarrusel>
              </div>
              {(key === data?.length - 1) &&
                <div ref={reference} style={{ height: '100px', marginTop: '100px' }} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )}

ProductCategories.propTypes = {
  data: PropTypes.array,
  handleChange: PropTypes.func,
  handleGetOneProduct: PropTypes.func,
  isMobile: PropTypes.bool,
  loadingCatProd: PropTypes.bool,
  placeholder: PropTypes.string,
  reference: PropTypes.any,
  sendNotification: PropTypes.func,
  setAlertBox: PropTypes.func,
  setValueProductName: PropTypes.func
}
export const StickyBoundaryCategories = React.memo(ProductCategories)
