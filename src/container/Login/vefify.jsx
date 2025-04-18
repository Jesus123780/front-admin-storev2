import React, { useState } from 'react'
import {
  Content,
  Form,
  Card,
  Text
} from './styled'
import PropTypes from 'prop-types'
import { RippleButton, InputOTPHook } from 'pkg-components'
import { EColor } from 'public/colors'
import { useRouter } from 'next/navigation'
import { decodeToken, getTokenState } from 'utils'
import { EmptyLayout } from 'pages/_app'

export const EmailVerifyCode = ({ code }) => {
  const router = useRouter()
  // eslint-disable-next-line
  const [step, setStep] = useState(0)
  const tokenState = getTokenState(code)
  const decode = decodeToken(code)
  let str = decode?.code.toString()
  let arr = Object.assign([], str)
  const array = arr
  if (tokenState?.needRefresh === true) {

    return <span>The link has expired</span>
  } else if (!tokenState?.valid) {
    return <span>The link is not valid</span>
  } else if (!tokenState) {
    return router.push('/entrar')
  } return (
    <Content>
      <Card>
      </Card>
      <Form>
        <Text size='15px'>Hola {decode?.uEmail}</Text>
        <InputOTPHook
          arrayCode={array}
          autoFocus
          className='otpContainer'
          inputClassName='otpInput'
          isNumberInput
          length={6}
          onChangeOTP={() => { return }}
        />
        <RippleButton
          bgColor={EColor}
          margin='20px auto'
          onClick={() => { return setStep(1) }}
          type='button'
          widthButton='100%'
        >Continuar</RippleButton>
        <Text size='15px'>No recibí mi código</Text>
      </Form>
    </Content>
  )
}

EmailVerifyCode.propTypes = {
  code: PropTypes.string
}

EmailVerifyCode.Layout = EmptyLayout
