'use client'

import Image from 'next/image'
import Link from 'next/link'
import { generateStoreURL } from 'npm-pkg-hook'
import {
  AmountInput,
  Divider,
  getGlobalStyle,
  ImageProductEdit,
  InputHooks,
  RippleButton
} from 'pkg-components'
import React from 'react'
import styled from 'styled-components'

interface FormProps {
  alt?: string
  src?: string
  loading?: boolean
  errorForm?: {
    ProDescription?: boolean
    ProDescuento?: boolean
    ProPrice?: boolean
    ValueDelivery?: boolean
    pName?: boolean
  }
  getStore?: {
    city?: {
      cName?: string
    }
    department?: {
      dName?: string
    }
    idStore?: string
    storeName?: string
  }
  fileInputRef: React.RefObject<HTMLInputElement>
  dataForm?: {
    ProDescription?: string
    ProDescuento?: string
    ProPrice?: string
    ValueDelivery?: string
    pName?: string
  }
  onFileInputChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleForm?: (event: React.FormEvent<HTMLFormElement>) => void
  handleChange?: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  onTargetClick?: (event: React.MouseEvent<HTMLImageElement>) => void
}

export const FormMemo: React.FC<FormProps> = ({
  alt = '',
  src = '',
  loading = false,
  propsImageEdit,
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
  const urlStore = generateStoreURL({
    city,
    department,
    storeName,
    idStore
  })

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
        <input
          style={{ display: 'none' }}
          accept='.jpg, .png'
          id='iFile'
          onChange={(event) => { return onFileInputChange(event) }}
          ref={fileInputRef}
          type='file'
        />
      </ContentImage>
      <ImageProductEdit {...propsImageEdit} />
      <InputHooks
        error={errorForm?.pName}
        info='Nombre del producto que se mostrará en la tienda'
        name='pName'
        onChange={handleChange}
        required
        title='Nombre del Producto*'
        value={dataForm?.pName}
      />
      <Divider marginTop={getGlobalStyle('--spacing-3xl')} />
      <AmountInput
        allowDecimals={true}
        decimalSeparator=','
        decimalsLimit={2}
        decimalScale={2}
        defaultValue={dataForm?.ProPrice}
        disabled={false}
        groupSeparator='.'
        label='Precio del producto*'
        name='ProPrice'
        onValueChange={(value, name) => {
          handleChange({
            target: {
              name: name ?? '',
              value: value ?? ''
            }
          } as React.ChangeEvent<HTMLInputElement>)
        }}
        placeholder='$ 0.00'
        prefix='$'
      />

      <AmountInput
        allowDecimals={true}
        decimalSeparator=','
        decimalsLimit={2}
        defaultValue={dataForm?.ProDescuento}
        disabled={false}
        label='Descuento'
        name='ProDescuento'
        onValueChange={(value) => {
          handleChange({
            target: {
              name: 'ProDescuento',
              value: value ?? ''
            }
          } as React.ChangeEvent<HTMLInputElement>)
        }}
        placeholder='$ 0.00'
        prefix='$'
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
        onValueChange={(value) => {
          handleChange({
            target: {
              name: 'ValueDelivery',
              value: value ?? ''
            }
          } as React.ChangeEvent<HTMLInputElement>)
        }}
        placeholder='$ 0.00'
        prefix='$'
        value={dataForm?.ValueDelivery}
      />
      <InputHooks
        error={errorForm?.ProDescription}
        info='Descripción del producto que se mostrará en la tienda'
        name='ProDescription'
        onChange={handleChange}
        range={{ min: 0, max: 180 }}
        title='Descripción'
        as='textarea'
        value={dataForm?.ProDescription}
        width='100%'
      />
      <Divider marginTop={getGlobalStyle('--spacing-3xl')} />
      {getStore &&
        <Link href={urlStore} target='_blank'>
          {getStore?.storeName}
        </Link>
      }
      <RippleButton
        disabled={loading}
        margin='20px auto'
        type='submit'
      >
        Guardar
      </RippleButton>
    </form>
  )
}
export const Form = React.memo(FormMemo)


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

