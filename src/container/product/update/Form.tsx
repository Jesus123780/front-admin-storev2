
'use client'

import Link from 'next/link'
import { generateStoreURL } from 'npm-pkg-hook'
import {
  AmountInput,
  Column,
  Divider,
  getGlobalStyle,
  ImageProductEdit,
  InputHooks,
  NewSelect,
  RippleButton,
  Text
} from 'pkg-components'
import React from 'react'

type SendNotificationFn = (params: {
  description: string
  title: string
  backgroundColor: string
}) => void

interface ProductCategoryOption {
  carProId?: string | number
  pName?: string
}

interface FormProps {
  alt?: string
  src?: string
  loading?: boolean
  savingCategory?: boolean

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

  propsImageEdit?: React.ComponentProps<typeof ImageProductEdit>

  dataForm?: {
    ProDescription?: string
    ProDescuento?: string
    ProPrice?: string
    ValueDelivery?: string
    pName?: string
  }

  onFileInputChange?: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void

  handleForm?: React.FormEventHandler<HTMLFormElement>

  handleChange?: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void

  sendNotification: SendNotificationFn

  pId: string

  categories?: ProductCategoryOption[]

  selectedCategory?: string

  setSelectedCategory?: (categoryId: string) => void
}

export const FormMemo: React.FC<FormProps> = ({
  categories = [],
  loading = false,
  savingCategory = false,
  propsImageEdit = {},
  errorForm = {
    ProDescription: false,
    ProDescuento: false,
    ProPrice: false,
    ValueDelivery: false,
    pName: false
  },
  getStore = {},
  dataForm = {
    ProDescription: '',
    ProDescuento: '',
    ProPrice: '',
    ValueDelivery: '',
    pName: ''
  },
  selectedCategory = '',
  handleForm = (event) => {
    event.preventDefault()
  },
  handleChange = () => {},
  setSelectedCategory = () => {}
}) => {
  const {
    city,
    department,
    storeName,
    idStore
  } = getStore

  const urlStore = generateStoreURL({
    city,
    department,
    storeName,
    idStore
  })

  return (
    <form onSubmit={handleForm}>
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
        allowDecimals
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
        allowDecimals
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
        allowDecimals
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
        value={dataForm?.ProDescription}
        width='100%'
      />

      <Divider marginTop={getGlobalStyle('--spacing-3xl')} />

      {storeName && (
        <Link href={urlStore} target='_blank'>
          {storeName}
        </Link>
      )}

      <Column style={{ gap: getGlobalStyle('--spacing-s') }}>
        <Text color='black' size='xl' as='h3' weight={700}>
          Categoría
        </Text>

        <Divider marginTop={getGlobalStyle('--spacing-2xl')} />

        <NewSelect
          id='carProId'
          name='carProId'
          optionName='pName'
          options={categories}
          title='Categoría del producto'
          value={selectedCategory}
          getOptionValue={(option) => {
            return (
              (option as { carProId?: string | number })?.carProId?.toString() ?? ''
            )
          }}
          onChange={(event) => {
            setSelectedCategory(
              event?.target?.value != null
                ? String(event.target.value)
                : ''
            )
          }}
        />
      </Column>

      {/* Único botón principal para guardar producto y categoría */}
      <RippleButton
        disabled={loading || savingCategory}
        margin='20px auto'
        type='submit'
      >
        Guardar
      </RippleButton>
    </form>
  )
}

export const Form = React.memo(FormMemo)
