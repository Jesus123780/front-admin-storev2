import type { Metadata } from 'next'
import React from 'react'

import { OrdersView } from '@/container/orders/view'

const orders = () => {
  return (
    <OrdersView />
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
