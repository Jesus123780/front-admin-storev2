
 // app/orders/[orderId]/page.tsx
import type { Metadata } from 'next'

import OrderDetailClient from '@/container/orders/view/components/ViewOrder/OrderDetailClient'

type Props = {
  params: Promise<{
    orderId: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params

  return {
    title: `Order ${orderId} • Details`,
    description: `View details for order ${orderId}.`,
  }
}

export default async function Page({ params }: Props) {
  const { orderId } = await params

  return <OrderDetailClient orderId={orderId} />
}
