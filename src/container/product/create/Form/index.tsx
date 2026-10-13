import {
  AlertInfo,
  AmountInput,
  Checkbox,
  Column,
  Divider,
  getGlobalStyle,
  InputHooks,
  NewSelect,
  QuantityButton,
  Text,
  ToggleSwitch
} from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'

export const FormProduct = ({
  check = {
    desc: false
  },
  dataCategoriesProducts = [],
  errors = {
    ProDescuento: false,
    ProPrice: false,
    ValueDelivery: false,
    carProId: false,
    names: false,
    ProDescription: false
  },
  names = '',
  values = {
    ProDescription: '',
    ProDescuento: '',
    ProPrice: '',
    ValueDelivery: '',
    carProId: ''
  },
  stock = 1,
  checkStock = false,
  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { return e },
  setName = (name: string) => { return name },
  handleCheckFreeShipping = () => { return },
  handleShowCategories = () => { return },
  handleDecreaseStock = () => { return },
  handleCheckStock = () => { return },
  handleIncreaseStock = () => { return }
}) => {
  const disableFree = check?.desc

  return (
    <Column as='form'>
      <InputHooks
        tabIndex={0}
        error={errors.names}
        info='Nombre del producto que se mostrará en la tienda'
        name='names'
        onChange={e => { return setName(e.target.value) }}
        range={{ min: 0, max: 180 }}
        required={true}
        title='Nombre del producto*'
        type='text'
        value={names}
      />
      <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
      <AmountInput
        tabIndex={1}
        allowDecimals={true}
        decimalSeparator=','
        decimalsLimit={2}
        disabled={false}
        groupSeparator='.'
        label='Precio del producto*'
        name='ProPrice'
        onValueChange={(value, name) => {
          handleChange({
            target: {
              name: name ?? 'ProPrice',
              value: value
            }
          })
        }}
        prefix='$'
        defaultValue={values?.ProPrice}
        value={values?.ProPrice}
      />
      <AmountInput
        tabIndex={2}
        allowDecimals={true}
        decimalSeparator=','
        decimalsLimit={2}
        disabled={false}
        groupSeparator='.'
        label='Precio anterior'
        name='ProDescuento'
        onValueChange={(value) => {
          handleChange({
            target: {
              name: 'ProDescuento',
              value
            }
          })
        }}
        placeholder='$0,00'
        prefix='$'
        value={values?.ProDescuento}
      />
      <Text as='p' size='sm'>
        Ingresa el precio que tenía el producto antes de aplicar el descuento.
      </Text>
      <Checkbox
        checked={disableFree}
        id='checkboxF'
        label='Envío gratis'
        name='desc'
        onChange={handleCheckFreeShipping}
      />
      <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
      <AmountInput
        tabIndex={3}
        allowDecimals={true}
        decimalSeparator=','
        decimalsLimit={2}
        disabled={disableFree}
        groupSeparator='.'
        label='Precio del domicilio'
        name='ValueDelivery'
        onValueChange={(value) => {
          handleChange({
            target: {
              name: 'ValueDelivery',
              value: value
            }
          })
        }}
        placeholder='$0,00'
        prefix='$'
        value={values?.ValueDelivery}
      />
      <Text as='p' size='sm'>
        Valor que se cobrará al cliente por el servicio de domicilio.
      </Text>
      <>
        <ToggleSwitch
          checked={checkStock}
          id='stock'
          name='stock'
          disabled={false}
          label='Controlar disponibilidad por stock'
          onChange={() => {
            return handleCheckStock()
          }}
          style={{ marginBottom: getGlobalStyle('--spacing-2xl') }}
          successColor='green'
        />

        {checkStock && (
          <>
            <AlertInfo
              message='Define la cantidad disponible del producto para controlar sus existencias.'
              type='warning'
            />

            <QuantityButton
              handleDecrement={() => {
                return handleDecreaseStock()
              }}
              handleIncrement={() => {
                return handleIncreaseStock()
              }}
              quantity={stock}
            />
          </>
        )}
      </>

      <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
      <NewSelect
        tabIndex={4}
        action={true}
        error={errors.carProId}
        handleClickAction={() => {
          handleShowCategories()
        }}
        id='carProId'
        name='carProId'
        onChange={handleChange}
        optionName='pName'
        options={dataCategoriesProducts || []}
        required={false}
        search={true}
        title='Categoría del producto'
        value={values?.carProId}
      />
      <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
      <InputHooks
        tabIndex={5}
        error={errors.ProDescription}
        info='Descripción del producto que se mostrará en la tienda'
        name='ProDescription'
        onChange={handleChange}
        range={{ min: 0, max: 180 }}
        required={false}
        title='Descripción del producto'
        as='textarea'
        value={values?.ProDescription}
      />
    </Column>
  )
}

FormProduct.propTypes = {
  check: PropTypes.shape({
    desc: PropTypes.any
  }),
  dataCategoriesProducts: PropTypes.array,
  errors: PropTypes.shape({
    ProDescuento: PropTypes.any,
    ProPrice: PropTypes.any,
    ValueDelivery: PropTypes.any,
    carProId: PropTypes.any,
    names: PropTypes.any
  }),
  handleChange: PropTypes.any,
  handleDecreaseStock: PropTypes.func,
  handleIncreaseStock: PropTypes.func,
  handleCheckStock: PropTypes.func,
  handleShowCategories: PropTypes.func,
  stock: PropTypes.number,
  checkStock: PropTypes.bool,
  handleCheckFreeShipping: PropTypes.any,
  names: PropTypes.any,
  setName: PropTypes.func,
  values: PropTypes.shape({
    ProDescription: PropTypes.string,
    ProDescuento: PropTypes.string,
    ProPrice: PropTypes.string,
    ValueDelivery: PropTypes.string,
    carProId: PropTypes.string
  })
}
