'use client'

import React from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Product } from '@/container/product'
import { Update } from '@/container/product/update'
import NotFound from '../../not-found'
import { ROUTES } from 'pkg-components'

const ProductsPage = () => {
  const { slug } = useParams  ()
  const searchParams = useSearchParams()
  const pId = searchParams.get('pId')

    const components = {
        products: <Product />,
        create: <Product />,
        disabled: <Product />,
        edit: pId ? <Update id={pId} /> : <NotFound redirectTo={ROUTES.dashboard} />, 
        view: <Product />,
    }
    return components[slug as keyof typeof components]
   
}

export default ProductsPage