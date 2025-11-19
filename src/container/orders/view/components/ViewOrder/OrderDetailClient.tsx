'use client'

import { useGetSale, usePrintSaleTicket } from 'npm-pkg-hook'
import { Loading } from 'pkg-components'
import {
  useContext,
  useEffect,
  useState
} from 'react'

import OrderDetail, { PropsOrderDetail } from '@/container/orders/view/components/ViewOrder'
import { Context } from '@/context/Context'

type Props = { orderId: string }
interface SaleResponse {
  getOneSalesStore: {
    data: PropsOrderDetail['order']
  }
}

export default function OrderDetailClient({ orderId }: Props) {
  const [data, setData] = useState<SaleResponse>()
  const { handleGetSale, loading } = useGetSale()
  const [handlePrintSale] = usePrintSaleTicket()
  const { sendNotification } = useContext(Context)

  useEffect(() => {
    (async () => {
      const response = await handleGetSale(orderId)
      setData(response.data as SaleResponse)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const handleClickPrint = async (pCodeRef: string) => {
    const response = await handlePrintSale(pCodeRef)
    const { success, message } = response ?? {
      success: false,
      message: 'No se pudo conectar con el servidor'
    }
    return sendNotification({
      description: message,
      title: success ? 'Impresión exitosa' : 'Error al imprimir',
      backgroundColor: success ? 'success' : 'error'
    })
  }
  if (loading || !data) { return <Loading /> }

  return <OrderDetail
    order={data.getOneSalesStore.data}
    handlePrint={async () => await handleClickPrint(String(data?.getOneSalesStore?.data?.pCodeRef))}
    totals={data?.getOneSalesStore?.data.totals}
  />
}
