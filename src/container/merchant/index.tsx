'use client'

import { useMutation } from '@apollo/client'
import {
  useCategoryStore,
  useCities,
  useCountries,
  useCreateStorePendingToRegister,
  useDepartments,
  useFormTools,
  useLoading,
  useLocationManager,
  useLogout,
  useMobile,
  useRoads,
  useUser
} from 'npm-pkg-hook'
import {
  Column,
  Divider,
  getGlobalStyle,
  Icon,
  LoadingButton,
  RippleButton,
  ROUTES,
  Row,
  Stepper,
  StepsComponent,
  Text,
  Toast,
  ToastItem,
  ToastPosition
} from 'pkg-components'
import React, { useContext, useState } from 'react'

import { Context } from '../../context/Context'
import { StepRenderer } from './components/StepRenderer'
import styles from './index.module.css'
import { CREATE_ONE_STORE } from './queries'
import { STEP_TITLES, STEPS_HEADER } from './steps.config'

interface IRestaurantProps {
  userToken?: {
    email?: string
    id?: string
    name?: string
  }
}

export const Restaurant: React.FC<IRestaurantProps> = ({ userToken = {} } = {}) => {
  // STATES
  const [active, setActive] = useState(0)
  const [nextStep, setNextStep] = useState<number>(0)
  const { email, id } = userToken ?? { email: '', id: '', name: '' }

  // CONTEXT & HOOKS
  const {
    setAlertBox,
    sendNotification,
    messagesToast,
    deleteToast
  } = useContext(Context)

  const {
    loading,
    wrap,
    start,
    stop
  } = useLoading({ delayMs: 120, minDurationMs: 350 })

  const { createStorePendingToRegister } = useCreateStorePendingToRegister()
  const { onClickLogout } = useLogout({})
  const { data: dataCountries } = useCountries()
  const [getDepartments, { data: dataDepartments }] = useDepartments()
  const { data: dataRoad } = useRoads()
  const { isMobile } = useMobile()
  const [dataCatStore] = useCategoryStore()
  const [getCities, { data: dataCities, loading: loadingCities }] = useCities()
  const [dataUser, { loading: loadingUser }] = useUser(email)
  const road = dataRoad?.road || []
  const catStore = dataCatStore?.getAllCatStore || []
  const departments = dataDepartments || []
  const countries = dataCountries || []
  const cities = dataCities

  const {
    values,
    showLocation,
    setShowLocation,
    handleChangeSearch,
    setValues
  } = useLocationManager(getDepartments, getCities)

  const [newRegisterStore] = useMutation(CREATE_ONE_STORE, {
    onError: () => setAlertBox({ message: 'Lo sentimos ocurrió un error, vuelve a intentarlo' }),
    onCompleted: () => {
      stop()
    }
  })

  const [handleChange, handleSubmit, setDataValue, { dataForm, errorForm }] = useFormTools({
    sendNotification
  })

  const handleSavePendingStore = async () => {
    if (!id) { return }
    const input = {
      UserId: id,
      UserEmail: email || dataUser?.email || '',
      StoreNumber: null
    }
    try {
      await createStorePendingToRegister({ variables: { input } })
    } catch {
      sendNotification({
        backgroundColor: 'error',
        description: 'No se pudo guardar el registro pendiente',
        title: 'Error'
      })
    }
  }

  const handleSignOut = async () => {
    await onClickLogout()
  }

  const handleForm = async (event: React.FormEvent<HTMLFormElement>) => {
    return handleSubmit({
      actionAfterCheck: () => {
        start()
        goNext()
        if (nextStep === 0) {
          handleSavePendingStore()
        }
        stop()
      },
      event: event,
      action: wrap(async () => {
        if (nextStep === STEP_TITLES.length - 1) {
          const registerStoreResult = await newRegisterStore({
            variables: {
              input: {
                cId: values.countryId,
                id: dataUser?.id || id,
                dId: '622b4edc-62f8-418e-9222-42861deec133',
                ctId: 'f0a59395-9ad2-426f-817c-eb034578fa80',
                catStore: dataForm?.catStore,
                neighborhoodStore: dataForm?.storePhone,
                Viaprincipal: dataForm?.storePhone,
                storeOwner: dataForm?.storeOwner,
                storeName: dataForm?.storeName,
                emailStore: email || dataUser?.email,
                storePhone: dataForm?.storePhone,
                socialRaz: dataForm?.socialRaz,
                Image: null,
                banner: dataForm?.storePhone,
                documentIdentifier: dataForm?.documentIdentifier,
                uPhoNum: dataForm?.uPhoNum || '',
                ULocation: dataForm?.ULocation || '',
                upLat: '',
                upLon: '',
                siteWeb: dataForm?.storePhone,
                description: dataForm?.storePhone,
                NitStore: dataForm?.storePhone,
                typeRegiments: dataForm?.storePhone,
                typeContribute: dataForm?.storePhone,
                addressStore: dataForm?.storePhone
              }
            }
          })
          const response = registerStoreResult?.data?.newRegisterStore || { success: false, message: '' }
          const { success, message } = response || { success: null, message: '' }
          if (!success && message === 'Ya existe una tienda registrada') {
            // setNextStep(0)
            sendNotification({
              backgroundColor: 'error',
              description: `${message}`,
              title: `${message}`
            })
            return
          }
          const messages = {
            success: {
              backgroundColor: 'success',
              description: `${message}`,
              title: 'Tienda creada con éxito'
            },
            session: {
              backgroundColor: 'success',
              description: 'Debes iniciar sesión nuevamente',
              title: 'Inicia sesión'
            },
            defaultError: {
              backgroundColor: 'error',
              description: `${message}`,
              title: `${message}`
            }
          }

          if (success) {
            // setDataValue({})
            setValues({})
            if (nextStep === 3) {
              sendNotification(messages.success)
              // setTimeout(() => {
              //   handleSignOut()
              //   sendNotification(messages.session)
              // }, 3000)
              return
            }
          }

          if (message === 'No se encontró el usuario') {
            globalThis.location.href = ROUTES.login
          } else {
            sendNotification(messages.defaultError)
          }
          setAlertBox({ message })
        }
      })
    })
  }

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowLocation(!!e.target.checked)
  }

  const disabled = false

  const goNext = () => {
    setNextStep(prev => {
      if (prev >= STEP_TITLES.length - 1) {
        return prev
      }
      return prev + 1
    })
  }

  const props = {
    cities,
    countries,
    dataForm,
    dataUser,
    departments,
    email,
    errorForm,
    handleChange,
    road,
    loadingCities,
    isMobile,
    loadingUser,
    showLocation,
    values,
    catStore,
    handleBlur,
    handleChangeSearch,
    setShowLocation,
    setValues,
  }
  return (
    <>
      <Toast
        autoDelete={true}
        autoDeleteTime={9000}
        position={ToastPosition['top-right']}
        toastList={messagesToast as unknown as ToastItem[]}
        deleteToast={deleteToast}

      />
      <div className={styles.wrapper}>
        <div className={styles.heroCircle} aria-hidden='true' />
        <Column
          as='form'
          className={styles.content}
          data-test-id='merchant-form'
          onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
            return handleForm(event)
          }}
        >
          <Divider marginBottom={getGlobalStyle('--spacing-3xl')} />
          <Row>
            {[0, 1, 2, 3, 4, 5].map((step) => (
              <button
                type='button'
                key={step}
                onClick={() => setNextStep(step)}
                style={nextStep === step ? { backgroundColor: getGlobalStyle('--color-primary') } : { backgroundColor: getGlobalStyle('--color-base-transparent') }}
              >
                <div className={styles.circle}>
                  {step}
                </div>
              </button>
            ))}
          </Row>
          <Stepper
            active={active}
            key={1}
            onClick={setActive}
            steps={STEPS_HEADER}
          />
          <StepsComponent
            current={nextStep}
            status='progress'
            titles={STEP_TITLES}
          />
          <div className={styles.card}>
            <Row alignItems='center'>
              <button
                type='button'
                style={{
                  backgroundColor: getGlobalStyle('--color-base-transparent')
                }}
                onClick={() => {
                  setNextStep((prev) => {
                    if (prev === 0) {
                      return 0
                    }
                    return prev - 1
                  })
                }}
              >
                <Icon
                  icon='IconArrowLeft'
                  size={40}
                  color={getGlobalStyle('--color-icons-primary')}
                />
              </button>
              <Text
                as='h2'
                size='5xl'
                align='center'
                color='primary'
                styles={{
                  marginRight: getGlobalStyle('--spacing-3xl')
                }}
              >
                {STEP_TITLES[nextStep]}
              </Text>
            </Row>
            <Divider marginBottom={getGlobalStyle('--spacing-3xl')} />
            <StepRenderer step={nextStep} stepProps={{ ...props }} />
          </div>
          <div className={styles.actions}>
            <RippleButton
              disabled={Boolean(disabled)}
              type='submit'
            >
              {loading
                ? <LoadingButton color={getGlobalStyle('--color-icons-white')} />
                : 'Continuar'
              }
            </RippleButton>
          </div>
        </Column>
      </div>
    </>
  )
}
