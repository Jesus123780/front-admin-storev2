'use client'

import { AwesomeModal, getGlobalStyle } from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React from 'react'

import { Product } from '../../../product'

export interface CreateProductDrawerProps {
  /** Visible cuando el operador decidió crear el producto escaneado. */
  show: boolean
  /** Código de barras detectado, para precargar el formulario. */
  barcode: string
  /** Cierra el drawer sin crear nada. */
  onClose: () => void
  /**
   * Invocado con el producto recién creado. El contenedor de ventas lo usa
   * para agregarlo automáticamente al carrito (AC-10) y cerrar el drawer.
   */
  onProductCreated: (product: Record<string, unknown>) => void
}

/**
 * Drawer de creación de producto embebido en la pantalla de ventas.
 *
 * Reutiliza el formulario REAL de creación (`<Product />` → `FoodComponent`)
 * sin duplicar su lógica: solo lo monta dentro de un modal lateral, le precarga
 * el código de barras y le pasa el callback `onProductCreated`. Así el operador
 * crea el producto sin abandonar la venta y el producto queda listo para
 * agregarse al carrito.
 */
export const CreateProductDrawer: React.FC<CreateProductDrawerProps> = ({
  show,
  barcode,
  onClose,
  onProductCreated
}) => {
  return (
    <AwesomeModal
      customHeight="90vh"
      footer={false}
      header={true}
      onCancel={onClose}
      onHide={onClose}
      padding={0}
      question={false}
      show={show}
      size={MODAL_SIZES.large}
      title="Crear producto escaneado"
      zIndex={getGlobalStyle('--z-index-99999')}
    >
      {show && (
        <Product
          barcode={barcode}
          onProductCreated={onProductCreated}
        />
      )}
    </AwesomeModal>
  )
}

CreateProductDrawer.displayName = 'CreateProductDrawer'
