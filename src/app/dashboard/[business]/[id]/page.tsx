'use client'

import { Store } from '@/container/store';
import { useParams } from 'next/navigation'

export default function BusinessDetailPage() {
  const { business, id } = useParams()
  return <Store />
}
