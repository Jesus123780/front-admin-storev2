'use client'

import { useMutation } from '@apollo/client'
import Joi from 'joi'
import {
  useCategoryStore,
  useCities,
  useCountries,
  useCreateStorePendingToRegister,
  useDepartments,
  useFormTools,
  useGetCookies,
  useLocationManager,
  useLoginEmployeeInStore,
  useLogout,
  useMobile,
  useRoads,
  useSetSession,
  useUser
} from 'npm-pkg-hook'
import {
  AwesomeModal,
  Column,
  Divider,
  EColor,
  getGlobalStyle,
  Icon,
  Loading,
  motion,
  RippleButton,
  ROUTES,
  Row,
  Stepper,
  StepsComponent,
  Text,
  Toast
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import PropTypes from 'prop-types'
import React, { useContext, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'

import { Context } from '../../context/Context'
import { StepCero } from './Forms/StepCero'
import { StepOne } from './Forms/StepOne'
import { StepTow } from './Forms/StepTow'
import { CREATE_ONE_STORE } from './queries'
import {
  Card,
  Content,
  Form,
  GoBack
} from './styled'
import styles from './styles.module.css'

export const Restaurant = ({ userToken = {} } = {}) => {
  // STATES
  const [modalConfirm, setModalConfirm] = useState(false)
  const {
    email,
    id,
    name
  } = userToken ?? {
    email: '',
    id: '',
    name: ''
  }
  const [step] = useState(0)
  const [active, setActive] = useState(0)

  const steps = ['Crea una tienda', 'Ingresa como invitado']
  const [nextStep, setNextStep] = useState(0)
  const [loading, setLoading] = useState(false)
  // HOOKS
  const { setAlertBox, sendNotification, messagesToast } = useContext(Context)
  const { isMobile } = useMobile()
  const [handleSession] = useSetSession()
  const [onClickLogout] = useLogout({})
  const { data: dataCountries, loading: loadingCountries } = useCountries()
  const [getDepartments, { data: dataDepartments, loading: loadingDepartments }] = useDepartments()
  const { data: dataRoad } = useRoads()
  const [dataCatStore, { loading: loadingCatStore }] = useCategoryStore()
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

  const [newRegisterStore, { loading: loadingCreateStore }] = useMutation(CREATE_ONE_STORE, {
    onError: () => {
      return setAlertBox({
        message: 'Lo sentimos ocurrió un error, vuelve a intentarlo'
      })
    },
    onCompleted: () => {
      return null
    }
  })
  const [handleChange, _handleSubmit, setDataValue, { dataForm, errorForm }] = useFormTools()
  // const { suggestions: { data }, setValue } = usePlacesAutocomplete({
  //   requestOptions: {
  //     // types: ['restaurant'],
  //     componentRestrictions: { country: 'CO' }
  //   }
  // })

  const handleSignOut = async () => {
    await onClickLogout()
  }

  const handleForm = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (nextStep < 2) {
        return
      }
      if (nextStep === 3) {
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

        const response = registerStoreResult?.data?.newRegisterStore || {
          success: false,
          message: ''
        }
        const { success, message } = response || {
          success: null,
          message: ''
        }
        if (!success && message === 'Ya existe una tienda registrada') {
          setLoading(false)
          setNextStep(0)
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
          userNotFound: {
            backgroundColor: 'error',
            description: 'No se encontró el usuario',
            title: 'Error'
          },
          defaultError: {
            backgroundColor: 'error',
            description: `${message}`,
            title: `${message}`
          }
        }

        if (success) {
          setDataValue({})
          setValues({})
          if (nextStep === 3) {
            sendNotification(messages.success)
            setTimeout(() => {
              handleSignOut()
              sendNotification(messages.session)
            }, 3000)
            return
          }
        }

        if (message === 'No se encontró el usuario') {
          window.location.href = ROUTES.login
        } else {
          sendNotification(messages.defaultError)
        }
        setAlertBox({ message })
      }
    } catch (error) {
      if (error?.message) {
        setAlertBox({ message: error.message })
        return
      }
      setAlertBox({
        message: 'Lo sentimos, ocurrió un error. Por favor, inténtalo de nuevo.'
      })
    }
  }

  const handleBlur = (e) => {
    const { checked } = e.target
    setShowLocation(!!checked)
  }
  const validateRouter = () => {
    if (nextStep >= 1) {
      setNextStep(nextStep - 1)
    } else {
      setModalConfirm(true)
    }
  }

  const stepOne = nextStep === 1
  const { uPhoNum } = dataForm


  const oneSchema = Joi.object({
    storeOwner: Joi.string().required(),
    storeName: Joi.string().required(),
    uPhoNum: Joi.string().min(12).required()
  })
  const twoSchema = Joi.object({
    socialRaz: Joi.string().required().min(3).max(100),
    documentIdentifier: Joi.string().required().min(3).max(20),
    NitStore: Joi.string().required().min(3).max(15),
    neighborhoodStore: Joi.string().required().min(0).max(100),
    Viaprincipal: Joi.string().required().min(0).max(100),
    secVia: Joi.string().required().min(0).max(100),
    ULocation: Joi.string().required().min(0).max(100)
  })
  const validateStep = (step, {
    storeOwner,
    storeName,
    uPhoNum,
    socialRaz,
    ULocation,
    neighborhoodStore,
    secVia,
    Viaprincipal,
    documentIdentifier,
    NitStore,
    storePhone
  }) => {
    switch (step) {
      case 0:
        return oneSchema.validate({
          storeOwner,
          storeName,
          uPhoNum
        }).error
      case 1:
        return twoSchema.validate({
          socialRaz,
          documentIdentifier,
          NitStore,
          neighborhoodStore,
          Viaprincipal,
          ULocation,
          secVia
        }).error
      case 2:
        return Joi.string().min(12).required().validate(storePhone).error
      default:
        return false
    }
  }
  const allValues = {
    ...dataForm,
    ...values
  }
  const isCurrentStepDisabled = validateStep(nextStep, { ...allValues })
  const disabled = isCurrentStepDisabled

  const getStepTitles = (currentStep) => {
    const titles = [
      'Datos iniciales',
      'Legal y dirección',
      'Contacto e info',
      'Finalizar registro'
    ]

    return titles.map((title, index) => { return (index <= currentStep ? title : `Paso ${index + 1}`) })
  }
  const stepTitles = getStepTitles(nextStep)

  const { createStorePendingToRegister } = useCreateStorePendingToRegister()

  const handleSave = async () => {
    if (!id) {return}
    const input = {
      UserId: id,
      UserEmail: email || dataUser?.email || '',
      StoreNumber: uPhoNum
    }
    try {
      await createStorePendingToRegister({ variables: { input } })
    } catch (e) {
      return
    }
  }
  const { getCookie } = useGetCookies()
  const { loginEmployee } = useLoginEmployeeInStore()

  const handleChooseStore = async (store) => {
    const { idStore } = store ?? {
      idStore: null
    }

    const responseLogin = await loginEmployee(
      idStore,
      email
    )
    const { success, token } = responseLogin ?? {
      success: false
    }
    if (success) {
      const cookies = [
        { name: 'restaurant', value: idStore },
        { name: 'session', value: token }

      ]
      await handleSession({ cookies: cookies })
      window.location.href = `${process.env.URL_BASE}/dashboard`
    }

  }
  const titles = {
    0: 'Datos iniciales',
    1: 'Información Básica de la Tienda',
    2: '',
    3: ''
  }

  const variants = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0 }
  }

  const showStores = (dataUser && Array.isArray(dataUser?.associateStore))
  return (
    <Content>
      <div
        style={{
          position: 'fixed',
          left: '50px',
          zIndex: 9999999999,
          bottom: 0,
          width: 'min-content'
        }}
      >
        <Toast
          autoDelete={true}
          autoDeleteTime={7000}
          position={'bottom-right'}
          toastList={messagesToast}
        />
      </div>
      {loadingUser || loadingCreateStore && <Loading />}
      <AwesomeModal
        btnCancel={false}
        btnConfirm={false}
        customHeight='auto'
        footer={false}
        header={true}
        onHide={() => {
          return setModalConfirm(false)
        }}
        padding={getGlobalStyle('--spacing-2xl')}
        show={modalConfirm}
        size={MODAL_SIZES.small}
        title='¿Quieres abandonar esta página?'
      >
        <Column>
          <Row
            style={{
              width: '50%'
            }}
          >
            <Column>
              <Row>
                <RippleButton
                  bgColor={EColor}
                  margin='0 5px 0 0'
                  onClick={() => {
                    setNextStep(0)
                    return setModalConfirm(false)
                  }}
                  widthButton='100%'
                >
                  Cancelar
                </RippleButton>
                <RippleButton
                  bgColor={EColor}
                  margin='0 0 0 5px'
                  onClick={async () => {
                    await handleSignOut()
                  }}
                  widthButton='100%'
                >
                  Abandonar
                </RippleButton>
              </Row>
            </Column>
          </Row>
        </Column>
      </AwesomeModal>

      <Card>
        {/* vacio */}
      </Card>

      <div className='container-step'>
        <Divider marginBottom={getGlobalStyle('--spacing-3xl')} />
        <div
          style={{
            maxWidth: '600px',
            width: '90%'
          }}
        >
          <Stepper
            active={active}
            key={1}
            onClick={(index) => {
              setActive(index)
            }}
            steps={steps}
          />
        </div>
        <Divider marginBottom={getGlobalStyle('--spacing-3xl')} />
        {active === 0 && <>
          <div className='container-step__header'>
            <StepsComponent
              current={nextStep}
              status='progress'
              titles={stepTitles}
            />
          </div>
          <Form
            onSubmit={(e) => {
              return handleForm(e)
            }}
          >
            <Row
              alignItems='flex-start'
              justifyContent='flex-start'
              style={{
                width: '65%'
              }}
            >
              <GoBack
                onClick={() => {
                  return validateRouter()
                }}
              >
                <Icon
                  icon='IconArrowLeft'
                  color={getGlobalStyle('--color-icons-primary')}
                />
              </GoBack>
              <Text
                align='center'
                as='h2'
                size='2xl'
              >
                {titles[nextStep]}
              </Text>
            </Row>
            <motion.div
              animate='visible'
              initial='hidden'
              variants={variants}
            >
              {nextStep === 0 ? (
                <StepCero
                  dataForm={dataForm}
                  dataUser={dataUser}
                  email={email}
                  errorForm={errorForm}
                  handleChange={handleChange}
                />
              ) : stepOne ? (
                <StepOne
                  catStore={catStore}
                  cities={cities}
                  countries={countries}
                  dataForm={dataForm}
                  dataUser={dataUser}
                  departments={departments}
                  errorForm={errorForm}
                  handleBlur={handleBlur}
                  handleChange={handleChange}
                  handleChangeSearch={handleChangeSearch}
                  isMobile={isMobile}
                  loadingCatStore={loadingCatStore}
                  loadingCities={loadingCities}
                  loadingCountries={loadingCountries}
                  loadingDepartments={loadingDepartments}
                  road={road}
                  showLocation={showLocation}
                  values={values}
                />
              ) : nextStep === 2 ? (
                <StepTow
                  dataForm={dataForm}
                  dataUser={dataUser}
                  errorForm={errorForm}
                  handleChange={handleChange}
                  isMobile={isMobile}
                  userName={dataUser?.username || name || email}
                />
              ) : nextStep === 3 ? (
                <ContainerAnimation active={3}>
                  {loading && 'Cargando....'}
                </ContainerAnimation>
              ) : (
                <></>
              )}
            </motion.div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                position: 'sticky',
                left: '30px',
                backgroundColor: getGlobalStyle('--color-base-white'),
                width: '100%',
                bottom: '-35px',
                zIndex: 99
              }}
            >
              <RippleButton
                bgColor={EColor}
                disabled={Boolean(disabled)}
                margin='20px auto'
                onClick={() => {
                  return setNextStep((prv) => {
                    if (prv === 0) {
                      handleSave()
                    }
                    return prv + 1
                  })
                }}

                type={nextStep >= 2 ? 'submit' : 'button'}
                widthButton='100%'
              >
                {step !== 1 ? 'Continuar' : 'Enviar'}
              </RippleButton>
            </div>

          </Form>
        </>}
        {active === 1 &&
          <div className={styles.container_stores} >
            <Text className={styles.title} size='3xl'>
              Puedes ingresar a los comercios que haces parte
            </Text>
            <div className={styles.container_stores}>
              {showStores ? dataUser?.associateStore?.map((store) => {
                return (
                  <>
                    <div
                      className={styles.card_content_stores}
                      key={store.idStore}
                      onClick={() => {
                        handleChooseStore(store)
                      }}
                    >
                      <Icon
                        color={getGlobalStyle('--color-icons-gray')}
                        icon='IconStore'
                      />
                      <Text>
                        {store.storeName}
                      </Text>
                      <Icon
                        color={getGlobalStyle('--color-icons-gray')}
                        icon='IconArrowRight'
                      />
                    </div>
                    <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
                  </>
                )
              }) : null}
            </div>
          </div>
        }
      </div>
    </Content>
  )
}

Restaurant.propTypes = {
  userToken: PropTypes.object
}

export const AnimationRight = keyframes`
  0% {
    transform: translateX(50vw);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`

export const AnimationLeft = keyframes`
  0% {
    transform: translateX(-50vw);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
`

export const ContainerAnimation = styled.div`
  ${(props) => {
    if (props.active === 1) {
      return css`animation: ${AnimationRight} 200ms;`
    } else if (props.active === 2 || props.active === 3) {
      return css`animation: ${AnimationLeft} 200ms;`
    } else if (props.active === 4) {
      return css`animation: ${AnimationLeft} 200ms;`
    }
    return ''
  }}
`
