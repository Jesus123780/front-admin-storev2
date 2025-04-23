'use client'

import PropTypes from 'prop-types'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  AmountInput,
  InputHooks,
  RippleButton
} from 'pkg-components'
import { generateStoreURL, useAmountInput } from 'npm-pkg-hook'
import styled from 'styled-components'

export const Form = ({
  alt = '',
  src = '',
  loading = false,
  errorForm = {
    ProDescription: false,
    ProDescuento: false,
    ProPrice: false,
    ValueDelivery: false,
    pName: false
  },
  getStore = {
    city: {
      cName: {
        toLocaleLowerCase: () => { return }
      }
    },
    department: {
      dName: {
        toLocaleLowerCase: () => { return }
      }
    },
    idStore: '',
    storeName: ''
  },
  fileInputRef,
  dataForm = {
    ProDescription: '',
    ProDescuento: '',
    ProPrice: '',
    ValueDelivery: '',
    pName: ''
  },
  onFileInputChange = (event) => { return event },
  handleForm = (event) => { return event },
  handleChange = () => { return },
  onTargetClick = (event) => { return event }
}) => {
  const {
    city,
    department,
    storeName,
    idStore
  } = getStore || {
    city: { cName: '' },
    department: { dName: '' },
    storeName: '',
    idStore: ''
  }
  const urlStore = generateStoreURL({ city, department, storeName, idStore })

  return (
    <form onSubmit={(e) => { return handleForm(e) }}>
      <ContentImage >
        <Image
          alt={alt}
          height={320}
          objectFit='contain'
          onClick={(e) => { return onTargetClick(e) }}
          src={src}
          width={400}
        />
        <Inputdeker
          accept='.jpg, .png'
          id='iFile'
          onChange={(event) => { return onFileInputChange(event) }}
          ref={fileInputRef}
          type='file'
        />
      </ContentImage>
      <InputHooks
        error={errorForm?.pName}
        info='Nombre del producto que se mostrará en la tienda'
        name='pName'
        onChange={handleChange}
        required
        title='Nombre del Producto'
        value={dataForm?.pName}
      />
      <AmountInput
        allowDecimals={true}
        decimalSeparator=','
        decimalsLimit={2}
        defaultValue={dataForm?.ProPrice}
        disabled={false}
        groupSeparator='.'
        label='Precio del producto*'
        name='ProPrice'
        onChange={(value) => {
          handleChange({
            target: {
              name: 'ProPrice',
              value: value
            }
          })
        }}
        placeholder='$ 0.00'
        prefix='$'
        useAmountInput={useAmountInput}
        value={dataForm?.ProPrice}
      />

      <AmountInput
        allowDecimals={true}
        decimalSeparator=','
        decimalsLimit={2}
        defaultValue={dataForm?.ProDescuento}
        disabled={false}
        label='Descuento'
        name='ProDescuento'
        onChange={(value) => {
          handleChange({
            target: {
              name: 'ProDescuento',
              value: value
            }
          })
        }}
        placeholder='$ 0.00'
        prefix='$'
        useAmountInput={useAmountInput}
        value={dataForm?.ProDescuento}
      />
      <AmountInput
        allowDecimals={true}
        decimalSeparator=','
        decimalsLimit={2}
        defaultValue={dataForm?.ValueDelivery}
        disabled={false}
        label='Costo de envío'
        name='ValueDelivery'
        onChange={(value) => {
          handleChange({
            target: {
              name: 'ValueDelivery',
              value: value
            }
          })
        }}
        placeholder='$ 0.00'
        prefix='$'
        useAmountInput={useAmountInput}
        value={dataForm?.ValueDelivery}
      />
      <InputHooks
        error={errorForm?.ProDescription}
        info='Descripción del producto que se mostrará en la tienda - Máximo 700 caracteres'
        name='ProDescription'
        onChange={handleChange}
        range={{ min: 0, max: 180 }}
        title='Descripción'
        typeTextarea={true}
        value={dataForm?.ProDescription}
        width='100%'
      />
      {getStore &&
        // <DisRestaurant>
          <Link href={urlStore} target='_blank'>
            {getStore?.storeName}
          </Link>
        // </DisRestaurant>
      }
      <RippleButton
        disabled={loading}
        margin='20px auto'
        type='submit'
        widthButton='100%'
      >
        Guardar
      </RippleButton>
    </form>
  )
}

Form.propTypes = {
  alt: PropTypes.string,
  loading: PropTypes.bool,
  dataForm: PropTypes.shape({
    ProDescription: PropTypes.any,
    ProDescuento: PropTypes.any,
    ProPrice: PropTypes.any,
    ValueDelivery: PropTypes.any,
    pName: PropTypes.any
  }),
  errorForm: PropTypes.shape({
    ProDescription: PropTypes.any,
    ProDescuento: PropTypes.any,
    ProPrice: PropTypes.any,
    ValueDelivery: PropTypes.any,
    pName: PropTypes.string
  }),
  fileInputRef: PropTypes.any,
  getStore: PropTypes.shape({
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
    idStore: PropTypes.string,
    storeName: PropTypes.string
  }),
  handleChange: PropTypes.func,
  handleForm: PropTypes.func,
  onFileInputChange: PropTypes.func,
  onTargetClick: PropTypes.func,
  src: PropTypes.string
}

const Inputdeker = styled.input`
    padding: 30px;
    border: 1px solid;
    display: none;
`
export const ContentImage = styled.div`
    display: flex;
    width: 100%;
    && > img {
        height: 300px; 
        min-height: 300px; 
        object-fit: cover;
        max-height: 300px; 
        width: 100%; 
    }
`