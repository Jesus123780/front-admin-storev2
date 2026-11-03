'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { generateStoreURL, useImageUploaderProduct } from 'npm-pkg-hook'
import {
  AlertInfo,
  AwesomeModal,
  BarCodes,
  Button,
  Column,
  DaySelector,
  Divider,
  getGlobalStyle,
  ImageProductEdit,
  LoaderSubItem,
  numberFormat,
  OptionalExtraProducts,
  PercentBadge,
  QuantityButton,
  RippleButton,
  Row,
  Tag,
  Text,
  ToggleSwitch
} from 'pkg-components'
import React, { useEffect, useState } from 'react'

import { ExtrasProductsItems } from '../extras/ExtrasProductsItems'
import styles from './styles.module.css'

interface IProductViewProps {
  dataExtra?: Array<any>
  dataOptional?: Array<any>
  days?: Array<any>
  selectedDays?: Array<any>
  modal?: boolean
  loading?: boolean
  nameStore?: string
  pName?: string
  ProDescription?: string
  ProDescuento?: string
  ProPrice?: string
  ProImage?: string
  store?: {
    city: {
      cName: string
    }
  }
  tag?: {
    nameTag: string | null
  }
  storeName?: string
  showDessert?: boolean
  propsUploadProductImage?: ReturnType<typeof useImageUploaderProduct>
  setModal?: (boolean?: boolean) => void
  onHideDessert?: () => void
  setShowDessert?: (boolean: boolean) => void
  handleDaySelection?: (day: string) => void
  setAlertModal?: (boolean: boolean) => void
  pId?: number | null
  ProBarCode?: string | null
  checkStock?: boolean
  /** Current persisted stock of the product (floor for restock). */
  currentStock?: number
  /**
   * Registers an inventory ENTRY (RESTOCK) raising stock to the target. Only
   * increases are applied; the backend never lowers stock from here.
   */
  handleRestockProduct?: (targetStock: number) => Promise<boolean> | boolean
  handleUpdateImageProduct?: () => void
  handleCheckStock?: () => void
  dissertProps?: Parameters<typeof OptionalExtraProducts>[0]
  propsExtra?: Record<string, unknown>
}
export const ProductView: React.FC<IProductViewProps> = ({
  dataExtra = [],
  dataOptional = [],
  days = [],
  selectedDays = [],
  modal = false,
  loading = false,
  nameStore = '',
  pName = '',
  ProDescription = '',
  ProDescuento = '',
  ProPrice = '',
  ProImage = '',
  store = {
    city: {
      cName: ''
    },
    department: {
      dName: ''
    },
    idStore: ''
  },
  tag = {
    nameTag: ''
  },
  storeName = '',
  showDessert,
  propsUploadProductImage,
  setModal = () => {
    return
  },
  onHideDessert = () => {
    return
  },
  setShowDessert = (boolean) => {
    return boolean
  },
  handleDaySelection = () => {
    return
  },
  setAlertModal = (boolean) => {
    return boolean
  },
  pId = null,
  ProBarCode = null,
  checkStock = false,
  currentStock = 0,
  handleRestockProduct = () => {
    return false
  },
  handleUpdateImageProduct = () => {
    return
  },
  handleCheckStock = () => {
    return
  },
  dissertProps = {},
  propsExtra = {},
  ...props
}) => {
  const router = useRouter()
  // Local target the operator wants to reach. Starts at (and never goes below)
  // the current stock — only increases are allowed (restock/entry).
  const [targetStock, setTargetStock] = useState<number>(Number(currentStock) || 0)
  const [restocking, setRestocking] = useState<boolean>(false)

  useEffect(() => {
    setTargetStock(Number(currentStock) || 0)
  }, [currentStock])

  const onRestock = async () => {
    if (targetStock <= Number(currentStock)) return
    setRestocking(true)
    try {
      await handleRestockProduct(targetStock)
    } finally {
      setRestocking(false)
    }
  }
  const {
    city,
    department,
    idStore
  } = store
  const urlStore = generateStoreURL({
    city,
    department,
    storeName,
    idStore
  })


  return (
    <div {...props} style={{ height: '100%' }}>
      <Row>
        <Button
          onClick={() => {
            return setModal()
          }}
          primary
        >
          Añadir Adicionales
        </Button>
        <Button
          onClick={() => {
            return setShowDessert(!showDessert)
          }}
          primary
        >
          Añadir Sobremesa
        </Button>
        <Button
          onClick={() => {
            if (pId) { return router.push(`/products/edit?pId=${pId}`) }
            return null
          }}
        >
          Editar
        </Button>
        <Button
          onClick={() => {
            return setAlertModal(true)
          }}
        >
          Eliminar
        </Button>
      </Row>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
        gap: '1rem',
        alignItems: 'start',
        padding: '1rem',
      }}
      >
        <div>
          <Image
            alt={ProDescription || 'img'}
            blurDataURL='data:...'
            className='store_image'
            height={440}
            objectFit='contain'
            placeholder='blur'
            src={ProImage?.startsWith('/images/placeholder-image.webp') ? '/images/placeholder-image.webp' : `/api/images/${ProImage}`}
            width={440}
          />
          <ImageProductEdit {...propsUploadProductImage} />
          <Button onClick={handleUpdateImageProduct} primary={true}>
            Guardar imagen
          </Button>
        </div>
        <div>

          <Column>
            <Text size='5xl'>
              {pName}
            </Text>
          </Column>
          <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
          <Column>
            <Text color='gray-dark' size='md'>
              {ProDescription}
            </Text>

            <Row style={{
              flexWrap: 'wrap',
              justifyContent: 'space-between'
            }}>
              <Text
                className={styles.text_prices}
                color='default'
                size='xxl'
                as='h2'
                style={{
                  width: 'min-content'
                }}
              >
                {numberFormat(ProPrice)}
              </Text>

              <Text className={[styles.text_prices, styles.text_prices__discount]} size='md'>
                {numberFormat(ProDescuento)}
              </Text>
            </Row>

            {Boolean(ProDescuento) &&
              <PercentBadge
                baseValue={ProDescuento}
                compareValue={ProPrice}
                precision={0}
              />
            }
          </Column>

          <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
          <div>
            {store && !!nameStore && (
              <Link
                href={urlStore}
                passHref
                replace
                shallow
              >
                {/* <Text size='lg'>{storeName  !== null ? storeName : ''}</Text> */}
              </Link>
            )}
            <div className='dish-restaurant__divisor'></div>
            <label className='dish-observation-form__label'>
              ¿Algún comentario?
            </label>
            <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
          </div>
          <Column>
            {ProBarCode !== null && <BarCodes value={ProBarCode} />}
          </Column>
          <Column>
            <ToggleSwitch
              checked={checkStock}
              id='stock'
              label='Gestionado por stock'
              onChange={() => {
                return handleCheckStock()
              }}
              style={{ marginBottom: getGlobalStyle('--spacing-2xl') }}
              successColor='green'
            />
            {checkStock && (
              <Column style={{ gap: getGlobalStyle('--spacing-s'), marginBottom: getGlobalStyle('--spacing-2xl') }}>
                <Text color='gray-dark' size='sm'>
                  {`Stock actual: ${Number(currentStock) || 0}`}
                </Text>
                <AlertInfo
                  message='Solo puedes aumentar el stock (entrada de inventario). Para disminuirlo usa una venta o un ajuste de inventario.'
                  type='warning'
                />
                <Row alignItems='center' style={{ gap: getGlobalStyle('--spacing-m') }}>
                  <QuantityButton
                    handleDecrement={() => {
                      setTargetStock((prev) => (prev > Number(currentStock) ? prev - 1 : Number(currentStock) || 0))
                    }}
                    handleIncrement={() => {
                      setTargetStock((prev) => (Number(prev) || Number(currentStock) || 0) + 1)
                    }}
                    showNegativeButton={targetStock <= (Number(currentStock) || 0)}
                    quantity={targetStock}
                  />
                  <RippleButton
                    disabled={restocking || targetStock <= (Number(currentStock) || 0)}
                    onClick={onRestock}
                    widthButton='min-content'
                  >
                    {`Agregar entrada (+${Math.max(targetStock - (Number(currentStock) || 0), 0)})`}
                  </RippleButton>
                </Row>
              </Column>
            )}
          </Column>
          {tag?.nameTag !== null ? (
            <div>
              <Text color='gray-dark' size='sm'>
                Tag descripción del producto
              </Text>
              <div>
                {tag?.nameTag ? <Tag label={tag.nameTag} /> : null}
              </div>
            </div>
          ) : null}
          <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
          {loading ? (
            <LoaderSubItem />
          ) : (
            <ExtrasProductsItems
              dataExtra={dataExtra || []}
              dataOptional={dataOptional || []}
              editing={true}
              modal={modal}
              pId={pId}
              propsExtra={propsExtra}
            />
          )}
        </div>
        <div>
          <Text color='gray-dark' size='lg'>
            Días de la semana disponibles
          </Text>
          {selectedDays?.length > 0 ? (
            <Column>
              <div style={{ display: 'flex' }}>
                <DaySelector
                  days={days}
                  handleDaySelection={handleDaySelection}
                  selectedDays={selectedDays}
                />
              </div>
              <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
              <AlertInfo message='Estos son los días de la semana en que el producto estará disponible' type='warning' />
            </Column>
          ) : (
            <div>
              <Text color='gray-dark' size='sm'>
                Disponible toda la semana
              </Text>
            </div>
          )}
        </div>
      </div>
      <AwesomeModal
        customHeight='calc(100vh - 100px)'
        footer={false}
        header={true}
        height='100%'
        onHide={() => {
          return onHideDessert()
        }}
        show={showDessert}
        size='100vw'
        zIndex='999999999'
      >
        <div>
          <OptionalExtraProducts {...dissertProps} />
        </div>
      </AwesomeModal>
    </div>
  )
}
