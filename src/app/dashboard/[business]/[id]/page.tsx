'use client'

import { useParams } from 'next/navigation'

import { Store } from '@/container/store';

export default function BusinessDetailPage() {
  const { business, id } = useParams()
  return <Store />
}
