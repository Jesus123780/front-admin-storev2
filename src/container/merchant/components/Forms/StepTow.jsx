import { 
  Divider, 
  InputHooks, 
  PhoneInput, 
  Text
} from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'

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
  handleChange = (e) => { return e }
}) => {

StepTow.propTypes = {
  errorForm: PropTypes.shape({
    emailStore: PropTypes.bool,
    storePhone: PropTypes.bool,
    username: PropTypes.bool
  }),
  dataForm: PropTypes.shape({
    emailStore: PropTypes.string,
    storePhone: PropTypes.string,
    username: PropTypes.string
  }),
  isMobile: PropTypes.bool,
  handleChange: PropTypes.func
}
  return (
    <div>
        <InputHooks
          error={errorForm?.username}
          name='username'
          onChange={handleChange}
          required
          title={isMobile ? 'Nombre dueño de la tienda' : 'Nombre del representante legal de la tienda'}
          value={dataForm.username}
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
    </div>
  )
}
