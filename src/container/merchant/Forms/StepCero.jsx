import PropTypes from 'prop-types'
import React from 'react'
import { ContainerAnimation } from '..'
import { InputHooks, PhoneInput } from 'pkg-components'

export const StepCero = ({
  dataForm = {
    storeOwner: '',
    storeName: '',
    email: '',
    uPhoNum: ''
  },
  dataUser = {
    email: ''
  },
  email = '',
  errorForm = {},
  handleChange = () => { return }
}) => {
  return (
    <ContainerAnimation active={0}>
      <div>
        <InputHooks
          error={errorForm?.storeOwner}
          name='storeOwner'
          onChange={handleChange}
          required
          title='Nombre del dueño de la tienda.'
          value={dataForm?.storeOwner}
          width='100%'
        />
        <InputHooks
          error={errorForm?.storeName}
          name='storeName'
          onChange={handleChange}
          required
          title='Nombre de la tienda.'
          value={dataForm?.storeName}
          width='100%'
        />
        <InputHooks
          disabled={true}
          error={errorForm?.email}
          name='email'
          onChange={handleChange}
          required
          title='Correo.'
          value={email ?? dataUser?.email}
          width='100%'
        />
        <PhoneInput
          onChange={(value) => {
            const event = {
              target: {
                name: 'uPhoNum',
                value
              }
            }
            return handleChange(event)
          }}
          required
          width='100%'
        />
      </div>
    </ContainerAnimation>
  )
}

StepCero.propTypes = {
  dataForm: PropTypes.object,
  dataUser: PropTypes.object,
  email: PropTypes.string,
  errorForm: PropTypes.object,
  handleChange: PropTypes.func
}
