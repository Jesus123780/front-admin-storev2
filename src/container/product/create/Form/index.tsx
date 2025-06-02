import React from 'react'
import PropTypes from 'prop-types'
import {
  Checkbox,
  Divider,
  InputHooks,
  NewSelect,
  getGlobalStyle,
  AmountInput,
  QuantityButton,
  AlertInfo,
  ToggleSwitch
} from 'pkg-components'
import { CardInput, FormProducts } from '../styled'

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
  handleChange = (e) => { return e },
  setName = (name) => { return name },
  handleCheckFreeShipping = () => { return },
  handleShowCategories = () => { return },
  handleDecreaseStock = () => { return },
  handleCheckStock = () => { return },
  handleIncreaseStock = () => { return }
}) => {
  const disableFree = check?.desc

  return (
    <FormProducts className='form-horizontal'>
      <InputHooks
        error={errors.names}
        info='Nombre del producto que se mostrará en la tienda - Máximo 180 caracteres'
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
              name: name,
              value: value
            }
          })
        }}
        prefix='$'
        value={values?.ProPrice}
      />
      <CardInput>
        <AmountInput
          allowDecimals={true}
          decimalSeparator=','
          decimalsLimit={2}
          disabled={false}
          groupSeparator='.'
          label='Precio del descuento'
          name='ProDescuento'
          onValueChange={(value) => {
            handleChange({
              target: {
                name: 'ProDescuento',
                value: value
              }
            })
          }}
          placeholder='$ 0.00'
          prefix='$'
          value={values?.ProDescuento}

        />
      </CardInput>

      <CardInput>
        <CardInput onChange={handleCheckFreeShipping}>
          <Checkbox
            checked={disableFree}
            id='checkboxF'
            label='Envío gratis'
            name='desc'
            onChange={handleCheckFreeShipping}
          />
        </CardInput>
        <AmountInput
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
          placeholder='$ 0.00'
          prefix='$'
          value={values?.ValueDelivery}
        />
      </CardInput>
      <>
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
          <>
            <AlertInfo message='Stock limitado disponible del producto' type='warning' />
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
        error={errors.ProDescription}
        info='Descripción del producto que se mostrará en la tienda - Máximo 180 caracteres'
        name='ProDescription'
        onChange={handleChange}
        range={{ min: 0, max: 180 }}
        required={false}
        title='Descripción del producto'
        typeTextarea={true}
        value={values?.ProDescription}
      />
    </FormProducts>
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
