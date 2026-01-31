'use client'

import {
  Button,
  numberFormat,
  Text
} from 'pkg-components'


const FooterCalcules = ({
  disabled = false,
  totalProductPrice,
  callback = () => { return },
  dispatch = () => { return },
  setPrint = () => { return }
}) => {
  return (
    <div>
      <div style={{ display: 'flex', width: '100%' }}>
        <Text as='h2'>
          {numberFormat(totalProductPrice)}
        </Text>
        &nbsp;
        &nbsp;
        <Button
          disabled={disabled}
          onClick={() => { return dispatch({ type: 'REMOVE_ALL_PRODUCTS' }) }}
          padding='13.5px'
          primary={true}
        >
          ELIMINAR
        </Button>
        &nbsp;
        &nbsp;
        <div>
          <Button
            disabled={disabled}
            onClick={() => { return setPrint({ callback }) }}
            padding='13.5px'
            primary={true}
          >GUARDAR</Button>
        </div>
      </div>
    </div>
  )
}

export default FooterCalcules