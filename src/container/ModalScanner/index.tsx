import {
 AwesomeModal, BarcodeScanner, Button, getGlobalStyle, Row, Text 
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React from 'react'

interface ModalScannerProps {
    show?: boolean | string | number
    onHide?: () => void
    /** Called with each scanned barcode so the parent can add the product. */
    onScan?: (code: string) => void
    /** Allow the same code to be scanned repeatedly (useful in a POS). */
    continuous?: boolean
    /** Current sound preference (controlled by the parent via useScanFeedback). */
    soundEnabled?: boolean
    /** Toggles the scan sound preference. */
    onToggleSound?: () => void
    /** Scanner mode: 'barcode' (default) or 'qr'. */
    mode?: 'barcode' | 'qr'
}

export const ModalScanner = ({
    show = false,
    onHide = () => { },
    onScan,
    continuous = true,
    soundEnabled = true,
    onToggleSound,
    mode = 'barcode'
}: ModalScannerProps) => {
    const title = mode === 'qr'
        ? 'Escanear código QR del producto'
        : 'Escanear código de barras del producto'
    return (
        <AwesomeModal
            btnCancel={true}
            btnConfirm={false}
            footer={false}
            header={true}
            size={MODAL_SIZES.small}
            onCancel={() => {
                return false
            }}
            onHide={onHide}
            padding={0}
            question={false}
            show={Boolean(show)}
            title={title}
            zIndex={getGlobalStyle('--z-index-99999')}
        >
            {Boolean(show) && (
                <>
                    {typeof onToggleSound === 'function' && (
                        <Row
                            style={{
                                justifyContent: 'flex-end',
                                padding: getGlobalStyle('--spacing-s')
                            }}
                        >
                            <Button
                                border='none'
                                onClick={onToggleSound}
                                aria-pressed={soundEnabled}
                                aria-label={soundEnabled ? 'Desactivar sonido de escaneo' : 'Activar sonido de escaneo'}
                                title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
                            >
                                <Text as='span' size='sm'>
                                    {soundEnabled ? '🔊 Sonido' : '🔇 Sonido'}
                                </Text>
                            </Button>
                        </Row>
                    )}
                    <BarcodeScanner continuous={continuous} onScan={onScan} mode={mode} />
                </>
            )}
        </AwesomeModal>
    )
}
