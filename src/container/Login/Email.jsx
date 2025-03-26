import React, {
  useState,
  useEffect,
  useContext
} from 'react'
import {
  BColor,
  EColor,
  PLColor
} from 'public/colors'
import {
  InputHooks,
  RippleButton,
  Loading,
  InputOTPHook,
  validateEmail
} from 'pkg-components'
import {
  useFormTools,
  useManageQueryParams,
  fetchJson
} from 'npm-pkg-hook'
import { useMutation } from '@apollo/client'
import { IconArrowLeft } from 'public/icons'
import {
  Content,
  Form,
  Card,
  Text,
  GoBack
} from './styled'
import { useRouter } from 'next/router'
import { EMAIL_SESSION } from './queries'
import { Context } from './../../context/Context'
import { decodeToken } from 'utils';
import { RegisterUser } from '../user'
import { getDeviceId } from '../../apollo/getDeviceId'

export const Email = () => {
  const [handleChange, handleSubmit, setDataValue, {
    dataForm,
    errorForm,
    setForcedError
  }] = useFormTools()

  const [otp, setOTP] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const router = useRouter()
  const [registerEmailLogin] = useMutation(EMAIL_SESSION)
  const { handleQuery } = useManageQueryParams()
  const { setAlertBox } = useContext(Context)

  const handleForm = async (e, show) => {
    e.preventDefault()
    setLoading(true)
    const device = await getDeviceId()
    const body = {
      email: dataForm?.email || '',
      otp: otp,
      deviceid: device
    }

    try {
      if (show === 0 && isEmailValid(dataForm?.email)) {
        await handleEmailLogin(body)
        handleQuery('otp', true)
        setStep((prev) => { return prev + 1 })
      } else if (step === 1 && otp?.length > 0) {
        await handleOTPLogin(body)
      }
    } catch (e) {
      setMessage('Ocurrió un error interno. Inténtalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (body) => {
    const result = await registerEmailLoginMutation(body)
    if (!result?.success) {
      setMessage('Ocurrió un error interno. Inténtalo nuevamente.')
    }
  }

  const handleOTPLogin = async (body) => {
    try {
      const requestLogin = await fetchJson(
        `${process.env.URL_BACK_SERVER}/api/auth/loginConfirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include'
        }
      )
      setAlertBox({ message: requestLogin.message, color: 'success' })

      const { storeUserId, token } = requestLogin
      const { idStore, id } = storeUserId || {}
      const decode = decodeToken(token)
      localStorage.setItem('userlogin', JSON.stringify(decode))

      if (storeUserId) {
        localStorage.setItem('restaurant', idStore)
        localStorage.setItem('usuario', id)
        localStorage.setItem('session', token)
        if (idStore) router.push('/dashboard')
      } else {
        router.push('/restaurante')
      }
    } catch (error) {
      setAlertBox({
        message: 'Lo sentimos ha ocurrido un error',
        color: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const isEmailValid = (email) => {
    return email?.length > 0 && validateEmail(email)
  }

  // Assuming these are existing functions or mutations
  const registerEmailLoginMutation = async (body) => {
    const device = await getDeviceId()
    const response = await registerEmailLogin({
      variables: {
        input: {
          uEmail: body.email,
          deviceid: device,
          userAgent: window.navigator.userAgent
        }
      }
    })
    return response?.data?.registerEmailLogin
  }


  const firtsStep = step === 1
  useEffect(() => {
    if (step === 0) {
      handleQuery('otp', '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (otp === 0) return <RegisterUser />
  return (
    <Content>
      {loading && <Loading />}
      <Card>
      </Card>
      <Form
        onSubmit={(e) => {
          return handleForm(e, step)
        }
        }
      >
        <GoBack
          onClick={() => {
            if (firtsStep) {
              handleQuery('otp', '')
              return setStep(0)
            }
            if (step === 0) {
              return router.push('/entrar')
            }
            return router.back()
          }}
        >
          <IconArrowLeft color={`${PLColor}`} size='25px' />
        </GoBack>
        <Text size='20px'>
          {firtsStep ?
            'Ingrese el código de 6 dígitos que enviamos' :
            'Informa tu correo para continuar'
          }
        </Text>
        <Text color='red' size='12px'>
          {message !== 'Session created.' && message}
        </Text>
        {firtsStep ?
          <>
            <Text color={BColor} size='19px'>{dataForm?.email}</Text>
            <InputOTPHook
              autoFocus
              className='otpContainer'
              inputClassName='otpInput'
              isNumberInput
              length={6}
              onChangeOTP={(otp) => {
                setMessage('')
                setOTP(otp)
              }}
            />

          </>
          :
          <InputHooks
            dataForm={dataForm}
            email
            error={errorForm?.email}
            errorForm={errorForm}
            name='email'
            onChange={(event) => {
              setMessage('')
              handleChange(event)
            }}
            required
            setDataValue={setDataValue}
            title='Informa tu correo.'
            value={dataForm?.email}
            width='100%'
            withShowSuggestions
          />
        }
        <RippleButton
          bgColor={EColor}
          disabled={step === 1 && (!otp?.length > 0)}
          margin='20px auto'
          onClick={() => {
            if (!dataForm?.email?.length) {
              return setForcedError({ ...errorForm, email: true })
            }
            return null
          }}
          type='submit'
          widthButton='100%'
        >
          {firtsStep ? 'Ingresar' : 'Enviar'}
        </RippleButton>
      </Form>
    </Content>
  )
}
