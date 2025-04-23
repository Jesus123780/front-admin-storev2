import React from 'react'
import PropTypes from 'prop-types'
import { BGColor, PColor } from 'public/colors'
import { numberFormat } from '../../utils'
import {
  Box,
  ContentCalcules,
  FlipTop
} from './styled'
import { Button, Text } from 'pkg-components'

const FooterCalcules = ({
  disabled = false,
  totalProductPrice,
  callback = () => { return },
  dispatch = () => { return },
  setPrint = () => { return }
}) => {
  return (
    <ContentCalcules>
      <Box display='flex' width='100%'>
        <Text as='h2' fontSize='1em'>
          $ {numberFormat(totalProductPrice)}
        </Text>
        &nbsp;
        &nbsp;
        <Button
          background={PColor}
          color={BGColor}
          disabled={disabled}
          onClick={() => { return dispatch({ type: 'REMOVE_ALL_PRODUCTS' }) }}
          padding='13.5px'
          primary={true}
        >
          ELIMINAR
        </Button>
          &nbsp;
          &nbsp;
        <FlipTop>
          <Button
            background={PColor}
            color={BGColor}
            disabled={disabled}
            onClick={() => { return setPrint({ callback }) }}
            padding='13.5px'
            primary={true}
            radius='50%'
          >GUARDAR</Button>
        </FlipTop>
      </Box>
    </ContentCalcules>
  )
}

FooterCalcules.propTypes = {
  disabled: PropTypes.bool,
  counter: PropTypes.number,
  dispatch: PropTypes.func,
  callback: PropTypes.func,
  print: PropTypes.bool,
  setPrint: PropTypes.func,
  totalProductPrice: PropTypes.number
}

export default FooterCalcules