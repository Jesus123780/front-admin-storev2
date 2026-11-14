import type { Metadata } from 'next'

import SalesReconciliation from '@/container/orders/reconciliation'
export const metadata: Metadata = { title:'Conciliación financiera | Venty',description:'Auditoría de ventas registradas' }
export default function Page(){return <SalesReconciliation/>}
