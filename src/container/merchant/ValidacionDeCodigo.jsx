import { useRouter } from 'next/router'
import { useState } from 'react'
import { useFormTools } from 'npm-pkg-hook'
import {
  InputOTPHook,
  RippleButton,
  InputHooks,
  Text
} from 'pkg-components'
import { EColor } from '../../public/colors'

const CodeValidation = () => {
  // eslint-disable-next-line
  const [handleChange, handleSubmit, setDataValue, { dataForm, errorForm, setForcedError }] = useFormTools()
  const [step, setStep] = useState(0)
  const router = useRouter()
  const nextPage = () => {
    if (step === 1) {
      router.push('/restaurante/planes')
    } else {
      setStep(1)
    }
  }
  return (
    <div>
      <div>
        <h1>Confirma tu correo electrónico</h1>
        <Text margin='30px 0' size='14px'>Introduce el código de validación enviado al correo electrónico:</Text>
        {step === 1 ?
          <div>
            <InputOTPHook
              autoFocus
              className='otpContainer'
              inputClassName='InputOTPHook'
              isNumberInput
              length={6}
              onChangeOTP={() => {return }}
            />
            <Text
              align='center'
              color={EColor}
              margin='30px 0'
              size='14px'
            >Introduce el código de validación enviado al correo electrónico:</Text>
          </div>
          :
          <InputHooks
            error={errorForm?.email}
            name='email'
            onChange={handleChange}
            required
            title='Informa tu correo.'
            value={dataForm?.email}
            width='100%'
          />
        }
        <RippleButton
          bgColor={EColor}
          margin='20px auto'
          onClick={() => {return nextPage()}}
          type='submit'
          widthButton='100%'
        >{step !== 1 ? 'Continuar' : 'Enviar'}</RippleButton>
      </div>
    </div>
  )
}

CodeValidation.propTypes = {

}

export default CodeValidation
