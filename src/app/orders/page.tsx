import React from 'react'
import { Orders } from '../../container/orders'
import type { Metadata } from 'next'

const orders = () => {
  return (
    <Orders />
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
