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
  /** Additional product details shown in the "Ver productos" modal. */
  pCode?: string | null
  stock?: number | string | null
  manageStock?: boolean | null
  ProQuantity?: number | string | null
  ProUniDisponibles?: string | null
  ProWeight?: string | number | null
  ProWidth?: string | number | null
  ProHeight?: string | number | null
  ProLength?: string | number | null
  ProVoltaje?: string | null
  ValueDelivery?: number | string | null
  vat?: number | string | null
  ProStar?: number | null
  ProDelivery?: number | null
  ProOutstanding?: number | null
  ProProtegido?: number | null
  ProAssurance?: string | null
  pState?: number | null
  sTateLogistic?: number | null
  createdAt?: string | null
  updatedAt?: string | null
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
  pCode = null,
  stock = null,
  manageStock = null,
  ProQuantity = null,
  ProUniDisponibles = null,
  ProWeight = null,
  ProWidth = null,
  ProHeight = null,
  ProLength = null,
  ProVoltaje = null,
  ValueDelivery = null,
  vat = null,
  ProStar = null,
  ProDelivery = null,
  ProOutstanding = null,
  ProProtegido = null,
  ProAssurance = null,
  pState = null,
  sTateLogistic = null,
  createdAt = null,
  updatedAt = null,
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
  // Local floor for the stock. It mirrors the persisted `currentStock`, but it
  // also moves up locally after a successful restock so the operator can never
  // go back below the newly reached stock even if the parent data hasn't
  // refreshed yet. Lowering stock is NOT allowed from this flow.
  const [stockFloor, setStockFloor] = useState<number>(Number(currentStock) || 0)
  // Local target the operator wants to reach. Starts at (and never goes below)
  // the stock floor — only increases are allowed (restock/entry).
  const [targetStock, setTargetStock] = useState<number>(Number(currentStock) || 0)
  const [restocking, setRestocking] = useState<boolean>(false)

  useEffect(() => {
    const floor = Number(currentStock) || 0
    setStockFloor(floor)
    // Keep the target at or above the floor at all times.
    setTargetStock((prev) => Math.max(Number(prev) || 0, floor))
  }, [currentStock])

  // Whether lowering is blocked: the target is already at (or below) the floor.
  const canLower = targetStock > stockFloor

  const onRestock = async () => {
    // Guard: never submit a non-increasing target. Lowering is not allowed.
    if (targetStock <= stockFloor) return
    setRestocking(true)
    try {
      const success = await handleRestockProduct(targetStock)
      if (success) {
        // Raise the local floor so the operator cannot go back below the
        // stock just reached, regardless of parent refetch timing.
        setStockFloor(targetStock)
      }
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
          onClick={() => setModal()}
          primary
          size='small'
          iconName='IconPlus'
          iconPosition='left'
        >
          Añadir Adicionales
        </Button>

        <Button
          onClick={() => setShowDessert(!showDessert)}
          primary
          size='small'
          iconName='IconBox'
          iconPosition='left'
        >
          Añadir Sobremesa
        </Button>

        <Button
          onClick={() => {
            if (pId) {
              return router.push(`/products/edit?pId=${pId}`)
            }

            return null
          }}
          size='small'
          iconName='IconEdit'
          iconPosition='left'
        >
          Editar
        </Button>

        <Button
          onClick={() => setAlertModal(true)}
          size='small'
          iconName='IconDelete'
          iconPosition='left'
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

          {/* DETALLES DEL PRODUCTO */}
          {(() => {
            const formatState = (value?: number | null): string | null => {
              if (value === null || value === undefined) { return null }
              return Number(value) === 1 ? 'Sí' : 'No'
            }

            const details: Array<{ label: string, value: React.ReactNode }> = [
              { label: 'Código', value: pCode },
              {
                label: 'Valor de envío',
                value: ValueDelivery ? numberFormat(ValueDelivery) : null
              },
              {
                label: 'IVA',
                value: vat === null || vat === undefined ? null : `${vat}%`
              },
              { label: 'Calificación', value: ProStar },
              { label: 'Envío disponible', value: formatState(ProDelivery) },
              { label: 'Estado del producto', value: formatState(pState) },
            ]

            const visibleDetails = details.filter(({ value }) => {
              return value !== null &&
                value !== undefined &&
                value !== '' &&
                String(value).trim() !== ''
            })

            if (visibleDetails.length === 0) { return null }

            return (
              <Column style={{ gap: getGlobalStyle('--spacing-s') }}>
                <Text color='black' size='xl' as='h3'>
                  Detalles del producto
                </Text>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: getGlobalStyle('--spacing-m')
                  }}
                >

                  {visibleDetails.map(({ label, value }) => {
                    return (
                      <Column key={label} style={{ gap: '2px' }}>
                        <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
                        <Text color='gray-light' size='sm'>
                          {label}
                        </Text>
                        <Text color='gray-dark' size='md'>
                          {String(value)}
                        </Text>
                      </Column>
                    )
                  })}
                </div>
              </Column>
            )
          })()}

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
            <Column>
              <label className='dish-observation-form__label'>
                ¿Algún comentario?
              </label>
              <label className='dish-observation-form__label'>
                N/A
              </label>

            </Column>

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
                  {`Stock actual: ${stockFloor}`}
                </Text>
                <AlertInfo
                  message='Solo puedes aumentar el stock (entrada de inventario). Para disminuirlo usa una venta o un ajuste de inventario.'
                  type='warning'
                />
                <Column alignItems='flex-start' style={{ gap: getGlobalStyle('--spacing-m') }}>
                  <QuantityButton
                    handleDecrement={() => {
                      // Clamp at the floor: never allow the target below the
                      // current persisted/reached stock.
                      setTargetStock((prev) => Math.max((Number(prev) || stockFloor) - 1, stockFloor))
                    }}
                    handleIncrement={() => {
                      setTargetStock((prev) => Math.max(Number(prev) || stockFloor, stockFloor) + 1)
                    }}
                    showNegativeButton={!canLower}
                    quantity={targetStock}
                  />
                  <RippleButton
                    disabled={restocking || !canLower}
                    onClick={onRestock}
                    fullWidth={true}
                  >
                    {`Agregar entrada (+${Math.max(targetStock - stockFloor, 0)})`}
                  </RippleButton>
                </Column>
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
