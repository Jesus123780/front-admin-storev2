import { getGlobalStyle, LateralModal } from 'pkg-components'
import React from 'react'

import OrderDetail from '@/container/orders/view/components/ViewOrder'

import { SaleResponse } from '../ViewOrder/OrderDetailClient'
import { OrderStatusType } from '@/container/orders/types'

interface IModalOrder {
  order: SaleResponse
  status: OrderStatusType | undefined
  onOpen: (code: string) => void
  onPrint: (code: string) => void
  onPdf: (code: string) => void
  busyPdf?: boolean
}

export const ModalOrder: React.FC<IModalOrder> = ({
state, statuses, onClose, onRetry, onPrint, onPdf, downloading,
}) => {
    // https://co.mileroticos.com/escorts/dulce-vip-blanquita-peli-negra-lista-para-estrenar/26212082/
    return (
    <LateralModal

  open={Boolean(state.open)}
  handleClose={onClose}
  direction="right"
  duration={400}
  style={{
    zIndex: getGlobalStyle('--z-index-modal'),
    top: 0,
    right: 0,
    width: 'min(100vw, 640px)',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }}
>

  <OrderDetail
    key={String(state?.order?.pCodeRef)}
    loading={false}
    order={state?.order}
    modalView={true}
    handlePrint={() => onPrint(String(state?.order?.pCodeRef))}
  />


</LateralModal>
    )
}
