// app/orders/[orderId]/page.tsx
import type { Metadata } from 'next'

import OrderDetailClient from '@/container/orders/view/components/ViewOrder/OrderDetailClient'


type Props = { params: { orderId: string } }


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Order ${params.orderId} • Details` }
}

export default function Page({ params }: Props) {
  return <OrderDetailClient orderId={params.orderId} />
}