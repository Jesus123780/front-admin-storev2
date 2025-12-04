import { getGlobalStyle, LateralModal } from 'pkg-components'
import React from 'react'

import OrderDetail from '@/container/orders/view/components/ViewOrder'

import { SaleResponse } from '../ViewOrder/OrderDetailClient'

interface IModalOrder {
    onCloseLateralMenu: () => void
    showModalComponent: boolean
    handleClickPrint: (pCodeRef: string) => void
    data: SaleResponse
    loading: boolean
}

export const ModalOrder: React.FC<IModalOrder> = ({
    onCloseLateralMenu,
    handleClickPrint,
    showModalComponent,
    loading,
    data
}) => {
    // https://co.mileroticos.com/escorts/dulce-vip-blanquita-peli-negra-lista-para-estrenar/26212082/
    return (
        <div>
            <LateralModal
                handleClose={onCloseLateralMenu}
                open={Boolean(showModalComponent)}
                style={{
                    zIndex: getGlobalStyle('--z-index-modal'),
                    height: '100%',
                    borderRadius: '5px',
                } as React.CSSProperties}
                direction='right'
                key='modal-order'
            >
                <OrderDetail
                    loading={loading}
                    order={data?.getOneSalesStore?.data}
                    handlePrint={async () => await handleClickPrint(String(data?.getOneSalesStore?.data?.pCodeRef))}
                    totals={{ totals: data?.getOneSalesStore?.data?.totals ?? [] }}
                    key='modal-order-detail'
                    modalView={true}
                />
            </LateralModal>
        </div>
    )
}
