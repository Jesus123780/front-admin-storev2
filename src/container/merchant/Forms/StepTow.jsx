import { 
  Divider, 
  InputHooks, 
  PhoneInput, 
  Text
} from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'

import { ContainerAnimation } from '..'

export const StepTow = ({
  errorForm = {
    emailStore: false,
    storePhone: false,
    username: false
  },
  dataForm = {
    emailStore: '',
    storePhone: '',
    username: ''
  },
  isMobile = false,
  userName = '',
  handleChange = (e) => { return e }
}) => {
  return (
    <ContainerAnimation active={2} >
      <React.Fragment>
        <InputHooks
          error={errorForm?.username}
          name='username'
          onChange={handleChange}
          required
          title={isMobile ? 'Nombre dueño de la tienda' : 'Nombre del representante legal de la tienda'}
          value={userName}
          width='100%'
        />
        <InputHooks
          email={true}
          error={errorForm?.emailStore}
          name='emailStore'
          onChange={handleChange}
          title='Email de la tienda ( Opcional )'
          value={dataForm?.emailStore}
          width='100%'
        />
        <Text>
          Numero de la tienda (requerido)
        </Text>
        <Divider marginBottom='0.625rem' />
        <PhoneInput
          onChange={(value) => {
            const event = {
              target: {
                name: 'storePhone',
                value
              }
            }
            return handleChange(event)
          }}
          required={true}
          width='100%'
        />

      </React.Fragment>
    </ContainerAnimation >
  )
}

StepTow.propTypes = {
  dataForm: PropTypes.object,
  errorForm: PropTypes.object,
  handleChange: PropTypes.func,
  isMobile: PropTypes.bool,
  userName: PropTypes.string
}
