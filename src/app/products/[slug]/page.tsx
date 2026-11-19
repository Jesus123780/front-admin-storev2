
'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { ROUTES } from 'pkg-components'

import { Product } from '@/container/product'
import { DisabledProductsContainer } from '@/container/product/disabled'
import ListProducts from '@/container/product/list'
import { Update } from '@/container/product/update'

import NotFound from '../../not-found'

const ProductsPage = () => {
  const { slug } = useParams()
  const searchParams = useSearchParams()

  const pId = searchParams.get('pId')
  const all = searchParams.get('all') === 'true'

  const components = {
    products: all ? <ListProducts /> : <Product />,
    create: <Product />,
    disabled: <DisabledProductsContainer />,
    edit: pId
      ? <Update id={pId} />
      : <NotFound redirectTo={ROUTES.dashboard} />,
    view: all ? <ListProducts /> : <Product />
  }

  return (
    components[slug as keyof typeof components] ??
    <NotFound redirectTo={ROUTES.dashboard} />
  )
}

export default ProductsPage
