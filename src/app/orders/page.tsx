import type { Metadata } from 'next'
import { EOrderQueryParams } from 'pkg-components/stories/organisms/ModalDetailOrder/type'
import React from 'react'

import { OrdersView } from '@/container/orders/view'

const orders = () => {
  return (
    <OrdersView query={EOrderQueryParams.ALL} />
  )
}

export const metadata: Metadata = {
  title: 'Ordenes de compra',
  description: 'Ordenes de compra',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico'
  },
}

export default orders
