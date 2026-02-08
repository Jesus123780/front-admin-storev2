import { useRouter } from 'next/navigation'
import {
 InputOTPHook, RippleButton, Text 
} from 'pkg-components'
import { useState } from 'react'

import EmptyLayout from '@/app/login/layout'
import { decodeToken, getTokenState } from '@/utils'

interface EmailVerifyCodeProps {
  code: string
}
export const EmailVerifyCode = ({ code }: EmailVerifyCodeProps) => {
  const router = useRouter()
  // eslint-disable-next-line
  const [step, setStep] = useState(0)
  const tokenState = getTokenState(code)
  const decode = decodeToken(code)
  const str = decode?.code.toString()
  const arr = Object.assign([], str)
  const array = arr
  if (tokenState?.needRefresh === true) {

    return <span>The link has expired</span>
  } else if (!tokenState?.valid) {
    return <span>The link is not valid</span>
  } else if (!tokenState) {
    return router.push('/entrar')
  } return (
    <div>
      <div>
      </div>
      <form>
        <Text size='md'>Hola {decode?.uEmail}</Text>
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
          margin='20px auto'
          onClick={() => { return setStep(1) }}
          type='button'
        >
          Continuar
        </RippleButton>
        <Text>No recibí mi código</Text>
      </form>
    </div>
  )
}

EmailVerifyCode.Layout = EmptyLayout
