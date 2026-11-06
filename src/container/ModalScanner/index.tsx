import { AwesomeModal, BarcodeScanner, getGlobalStyle } from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React from 'react'

interface ModalScannerProps {
    show?: boolean | string | number
    onHide?: () => void
    /** Called with each scanned barcode so the parent can add the product. */
    onScan?: (code: string) => void
    /** Allow the same code to be scanned repeatedly (useful in a POS). */
    continuous?: boolean
}

export const ModalScanner = ({
    show = false,
    onHide = () => { },
    onScan,
    continuous = true
}: ModalScannerProps) => {
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
            show={Boolean(show)}
            title='Escanear código de barras del producto'
            zIndex={getGlobalStyle('--z-index-99999')}
        >
            {Boolean(show) && (
                <BarcodeScanner continuous={continuous} onScan={onScan} />
            )}
        </AwesomeModal>
    )
}
