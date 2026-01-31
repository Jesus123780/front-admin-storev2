import {
 AwesomeModal, 
 getGlobalStyle,
 InputHooks,
Loading 
} from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'

import { Prints } from '../Printsale'

export const ModalSales = ({
  print,
  setPrint,
  totalProductPrice = 0,
  dataClientes = {},
  values = {},
  code,
  data,
  delivery,
  loading,
  discount = {},
  setDelivery = () => { return },
  handleChange = () => { return },
  handleSubmit = () => { return },
  ...rest
}) => {
  return (
    <div>
      {loading && <Loading />}
      <AwesomeModal
        backgroundColor='#ecebeb'
        cancel='Cancelar'
        confirm='Guardar y salir'
        footer={false}
        header={true}
        onConfirm={() => { return handleSubmit() }}
        onHide={() => { return setPrint(!print) }}
        show={print}
        size='100%'
        zIndex={getGlobalStyle('--z-index-modal')}
      >
        <Prints
          change={values?.change}
          code={code}
          data={data?.PRODUCT || []}
          dataClientes={dataClientes}
          discount={discount}
          handleSubmit={handleSubmit}
          total={totalProductPrice}
          values={values}
          {...rest}
        />
      </AwesomeModal>

      <AwesomeModal
        borderRadius='5px'
        btnCancel={true}
        btnConfirm={false}
        footer={false}
        header={true}
        onCancel={() => { return false }}
        onHide={() => { return setDelivery(!delivery) }}
        padding='25px'
        show={delivery}
        size='small'
        title='Añade el costo del envío'
      >
        <InputHooks
          autoComplete='off'
          name='ValueDelivery'
          onChange={handleChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.stateventDefault()
              e.target.blur()
              setDelivery(!delivery)
            }
          }}
          placeholder='Costo de envió'
          value={values?.ValueDelivery}
        />
        <InputHooks
          autoComplete='off'
          name='change'
          onChange={handleChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.target.blur()
              setDelivery(!delivery)
            }
          }}
          placeholder='Cambio'
          value={values?.change}
        />
      </AwesomeModal>
    </div>
  )
}

ModalSales.propTypes = {
  code: PropTypes.any,
  data: PropTypes.shape({
    PRODUCT: PropTypes.array
  }),
  dataClientes: PropTypes.object,
  delivery: PropTypes.any,
  discount: PropTypes.object,
  handleChange: PropTypes.func,
  handleSubmit: PropTypes.func,
  loading: PropTypes.any,
  print: PropTypes.any,
  setDelivery: PropTypes.func,
  setPrint: PropTypes.func,
  totalProductPrice: PropTypes.number,
  values: PropTypes.shape({
    ValueDelivery: PropTypes.any,
    change: PropTypes.any
  })
}
