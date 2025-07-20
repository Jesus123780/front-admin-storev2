import { AwesomeModal, BarcodeScanner } from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React from 'react'

export const ModalScanner = ({
    show = false,
    onHide = () => { }
}) => {
    return (
        <AwesomeModal
            size={MODAL_SIZES.medium}
            show={show}
            onHide={onHide}
            footer={false}
            title={`Escanear ${show} del producto`}
            height='min-content'
            customHeight='min-content'
        >
            <BarcodeScanner />
        </AwesomeModal>
    )
}
