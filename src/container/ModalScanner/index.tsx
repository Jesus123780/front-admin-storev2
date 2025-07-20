import { AwesomeModal, BarcodeScanner, getGlobalStyle } from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React from 'react'

export const ModalScanner = ({
    show = false,
    onHide = () => { }
}) => {
    return (
        <AwesomeModal
            borderRadius='4px'
            btnCancel={true}
            btnConfirm={false}
            customHeight='60vh'
            footer={false}
            header={true}
            height='60vh'
            size={MODAL_SIZES.medium}
            onCancel={() => {
                return false
            }}
            onHide={onHide}
            padding={0}
            question={false}
            show={show}
            title={`Escanear ${show} del producto`}
            zIndex={getGlobalStyle('--z-index-99999')}
        >
            <BarcodeScanner />
        </AwesomeModal>
    )
}
