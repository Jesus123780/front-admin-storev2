'use client'

import {
  AwesomeModal,
  Button,
  Column,
  getGlobalStyle,
  Icon,
  Row,
  Text
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React, { useState } from 'react'

import styles from './styles.module.css'

export interface ProductNotFoundDialogProps {
  /** Visible cuando hay un código escaneado sin producto asociado. */
  show: boolean
  /** Código de barras detectado (ya normalizado por el backend). */
  barcode: string
  /** El usuario acepta crear el producto con este código. */
  onConfirmCreate: (barcode: string) => void
  /** El usuario decide seguir escaneando (no crea nada). */
  onCancel: () => void
}

/**
 * Diálogo que aparece cuando el escáner detecta un código válido pero el
 * backend no encuentra el producto. No es un error: es una oportunidad de
 * crear el producto sin salir del flujo de ventas. Muestra el código de forma
 * legible y permite copiarlo.
 */
export const ProductNotFoundDialog: React.FC<ProductNotFoundDialogProps> = ({
  show,
  barcode,
  onConfirmCreate,
  onCancel
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(barcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard no disponible: no es crítico, el código ya se ve en pantalla.
    }
  }

  return (
    <AwesomeModal
      borderRadius={getGlobalStyle('--border-radius-md')}
      btnCancel={false}
      btnConfirm={false}
      customHeight="auto"
      footer={false}
      header={true}
      onCancel={onCancel}
      onHide={onCancel}
      padding={getGlobalStyle('--spacing-xl')}
      question={false}
      show={show}
      size={MODAL_SIZES.small}
      title="Producto no encontrado"
      zIndex={getGlobalStyle('--z-index-99999')}
    >
      <Column style={{ gap: getGlobalStyle('--spacing-lg') }}>
        <Text as="p" color="gray-dark" size="md">
          No encontramos ningún producto asociado al código de barras detectado.
        </Text>

        <Column className={styles.codeBox} role="group" aria-label="Código detectado">
          <Text as="span" color="gray-light" size="sm">
            Código detectado
          </Text>
          <Row alignItems="center" style={{ justifyContent: 'space-between', gap: getGlobalStyle('--spacing-m') }}>
            <Text as="span" size="2xl" weight="bold" style={{ letterSpacing: '0.05em' }}>
              {barcode}
            </Text>
            <Button
              border="none"
              onClick={handleCopy}
              aria-label="Copiar código de barras"
              title="Copiar código"
            >
              <Icon icon="IconCopy" size={20} />
            </Button>
          </Row>
          {copied && (
            <Text as="span" color="green" size="sm" aria-live="polite">
              Código copiado
            </Text>
          )}
        </Column>

        <Text as="p" weight="bold" size="lg">
          ¿Deseas crear un producto con este código de barras?
        </Text>

        <Row style={{ justifyContent: 'flex-end', gap: getGlobalStyle('--spacing-m') }}>
          <Button onClick={onCancel} aria-label="No, continuar escaneando">
            No, seguir escaneando
          </Button>
          <Button
            primary
            onClick={() => onConfirmCreate(barcode)}
            iconName="IconPlus"
            iconPosition="left"
            aria-label="Sí, crear producto"
          >
            Sí, crear producto
          </Button>
        </Row>
      </Column>
    </AwesomeModal>
  )
}

ProductNotFoundDialog.displayName = 'ProductNotFoundDialog'
