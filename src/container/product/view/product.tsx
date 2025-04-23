'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Column,
  DaySelector,
  Button,
  OptionalExtraProducts,
  AwesomeModal,
  Tag,
  Text,
  Divider,
  Row,
  numberFormat,
  LoaderSubItem,
  AlertInfo,
  BarCodes,
  getGlobalStyle,
  ToggleSwitch
} from 'pkg-components'
import PropTypes from 'prop-types'
import { generateStoreURL } from 'npm-pkg-hook'
import styles from './styles.module.css'
import { ExtrasProductsItems } from '../extras/ExtrasProductsItems'

export const ProductView = ({
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
  handleCheckStock = () => {
    return
  },
  dissertProps = {},
  propsExtra = {},
  ...props
}) => {
  const router = useRouter()
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
    <div {...props} style={{ height: '100%', overflow: 'hidden' }}>
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
            if (pId) return router.push(`products/edit?pId=${pId}`)
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
      <div>
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
        </div>
        <div>
          
          <Column>
            <Text size='5xl'>
              {pName}
            </Text>
          </Column>
          <Divider marginTop='0.625rem' />
          <Text color='gray-dark' size='md'>
            {ProDescription}
          </Text>
          <Divider marginTop='0.625rem' />
          <Row>
            <Text
              className={styles.text_prices}
              color='default'
              size='xxl'
            >
              {numberFormat(ProPrice)}
            </Text>
            <Divider marginTop='0.625rem' />
            <Text className={[styles.text_prices, styles.text_prices__discount]} size='md'>
              {numberFormat(ProDescuento)}
            </Text>
          </Row>
          <Divider marginTop='0.625rem' />
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
          </Column>
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
              <Divider marginTop='0.625rem' />
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
        {tag?.nameTag !== null ? (
          <div>
            <Text color='gray-dark' size='sm'>
              Tag descripción del producto
            </Text>
            <div>{tag?.nameTag ? <Tag label={tag.nameTag} /> : null}</div>
          </div>
        ) : null}
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

ProductView.propTypes = {
  ProDescription: PropTypes.string,
  ProDescuento: PropTypes.string,
  ProImage: PropTypes.string,
  ProPrice: PropTypes.string,
  dataExtra: PropTypes.shape({
    ExtProductFoodsAll: PropTypes.array
  }),
  dataOptional: PropTypes.shape({
    ExtProductFoodsOptionalAll: PropTypes.array
  }),
  days: PropTypes.array,
  dissertProps: PropTypes.object,
  handleDaySelection: PropTypes.func,
  handleCheckStock: PropTypes.func,
  checkStock: PropTypes.bool,
  handleDelete: PropTypes.func,
  modal: PropTypes.bool,
  loading: PropTypes.bool,
  nameStore: PropTypes.shape({
    replace: PropTypes.func
  }),
  onHideDessert: PropTypes.func,
  pId: PropTypes.any,
  pName: PropTypes.string,
  propsExtra: PropTypes.object,
  selectedDays: PropTypes.array,
  setAlertModal: PropTypes.func,
  setModal: PropTypes.func,
  setShowDessert: PropTypes.func,
  showDessert: PropTypes.func,
  store: PropTypes.shape({
    city: PropTypes.shape({
      cName: PropTypes.shape({
        toLocaleLowerCase: PropTypes.func
      })
    }),
    department: PropTypes.shape({
      dName: PropTypes.shape({
        toLocaleLowerCase: PropTypes.func
      })
    }),
    idStore: PropTypes.any
  }),
  storeName: PropTypes.string,
  tag: PropTypes.object
}
