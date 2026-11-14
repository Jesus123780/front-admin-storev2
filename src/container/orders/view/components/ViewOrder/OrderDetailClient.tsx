'use client'

import { useGetSale, usePrintSaleTicket } from 'npm-pkg-hook'
import { Loading } from 'pkg-components'
import { useContext, useEffect, useRef, useState } from 'react'

import OrderDetail from '@/container/orders/view/components/ViewOrder'
import type { Order } from '../types/order'
import { Context } from '@/context/Context'

type Props = { orderId: string }

export interface SaleResponse {
  getOneSalesStore: { data: Order | null }
}

/** Adaptador de datos. El diseño y el estado de la vista viven en OrderDetail. */
export default function OrderDetailClient({ orderId }: Props) {
  const [data, setData] = useState<SaleResponse | null>(null)
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(true)
  const { handleGetSale, loading } = useGetSale()
  const [handlePrintSale] = usePrintSaleTicket()
  const { sendNotification } = useContext(Context)

  // Evita solicitar nuevamente la orden si el hook expone una función no memorizada.
  const getSaleRef = useRef(handleGetSale)
  useEffect(() => { getSaleRef.current = handleGetSale }, [handleGetSale])

  useEffect(() => {
    let current = true
    setData(null)
    setError('')
    setFetching(true)

    void (async () => {
      try {
        const response = await getSaleRef.current(orderId)
        if (!current) return
        const next = response?.data as SaleResponse | undefined
        if (!next?.getOneSalesStore?.data) {
          setError('No encontramos la información de esta orden.')
          return
        }
        setData(next)
      } catch {
        if (current) setError('Ocurrió un error al consultar la orden.')
      } finally {
        if (current) setFetching(false)
      }
    })()

    return () => { current = false }
  }, [orderId])

  const order = data?.getOneSalesStore?.data ?? null

  const handleClickPrint = async () => {
    const code = order?.pCodeRef?.trim()
    if (!code) return
    try {
      const response = await handlePrintSale(code)
      const success = Boolean(response?.success)
      sendNotification({
        description: response?.message ?? 'No se pudo conectar con el servidor',
        title: success ? 'Impresión enviada' : 'Error al imprimir',
        backgroundColor: success ? 'success' : 'error'
      })
      // Permite que OrderActions gestione la señal de error sin notificar éxito.
      if (!success) throw new Error('La impresión fue rechazada')
    } catch (error) {
      if (error instanceof Error && error.message === 'La impresión fue rechazada') throw error
      sendNotification({
        description: 'Ocurrió un error al solicitar la impresión.',
        title: 'Error al imprimir',
        backgroundColor: 'error'
      })
      throw error
    }
  }

  if ((fetching || loading) && !data) return <Loading />
  if (error) return <div role="alert" style={{ padding: 24 }}>{error}</div>

  return (
    <OrderDetail
      order={order}
      loading={loading}
      modalView={false}
      handlePrint={handleClickPrint}
      totals={{ totals: order?.totals ?? [] }}
    />
  )
}
