import PropTypes from 'prop-types'
import React from 'react'

export const StepThree = ({
  errorForm = {},
  dataForm = {},
  dataUser = {},
  handleChange = () => { return }
}) => {
  return (
    <div>
       Hola 3
    </div>
  )
}

StepThree.propTypes = {
  dataForm: PropTypes.object,
  dataUser: PropTypes.object,
  errorForm: PropTypes.object,
  handleChange: PropTypes.func
}
