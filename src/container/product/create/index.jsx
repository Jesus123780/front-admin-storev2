'use client'

import PropTypes from 'prop-types'
import React, {
  useState,
  memo,
  useContext
} from 'react'
import {
  Button,
  Tag,
  Text,
  MemoCardProductSimple,
  AwesomeModal,
  Checkbox,
  DaySelector,
  Loading,
  OptionalExtraProducts,
  Portal,
  getGlobalStyle,
  Image,
  Divider,
  HeaderSteps,
  Column
} from 'pkg-components'
import {
  useGetOneProductsFood,
  verifyPriceInRange,
  useAmountInput,
  useSaveAvailableProduct,
  useManageQueryParams,
  useLogout,
  useDessertWithPrice,
  useDessert,
  useStore
} from 'npm-pkg-hook'
import { ExtrasProductsItems } from '../extras/ExtrasProductsItems'
import FormProduct from './Form'
import { ActionStep } from './styles'
import { Categories } from '../../categories'
import {
  Card,
  Container
} from './styled'
import { Context } from '../../../context/Context'
import { filterKeyObject } from '../../../utils'
import styles from './styles.module.css'
import { productSchema } from './schema/producSchema'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

export const FoodComponentMemo = ({
  alt,
  check,
  data,
  dataCategoriesProducts,
  dataFree,
  fetchMore,
  fileInputRef,
  handleChange,
  handleChangeFilter,
  handleCheckFreeShipping,
  handleRegister,
  handleDelete,
  image,
  loading,
  setErrors,
  names,
  onClickClear,
  onFileInputChange,
  onTargetClick,
  search,
  tagsProps,
  setActive,
  setName,
  setShowMore,
  showMore,
  handleDecreaseStock,
  handleCheckStock,
  handleIncreaseStock,
  checkStock,
  stock,
  active,
  src,
  errors,
  state: grid,
  setShowComponentModal,
  handleClick,
  pId,
  values = {
    ProDescription: '',
    ProDescuento: '',
    ProPrice: 0,
    ValueDelivery: '',
    carProId: ''
  },
  handleCheck,
  setCheck: setCheckAvailableDays,
  ...props
}) => {
  const router = useRouter()
    const location = useRouter()
  const searchParams = useSearchParams()
  const [onClickLogout] = useLogout({})

   const { getQuery } = useManageQueryParams({ router: location, searchParams: searchParams })

  const { setAlertBox, sendNotification } = useContext(Context)

  const [dataStore] = useStore()
  
  const food = getQuery('product')
  
  const {
    dataTags,
    handleAddTag,
    tags
  } = tagsProps ?? {
    dataTags: [],
    handleAddTag: () => { return false },
    tags: []
  }
  const { handleQuery, handleCleanQuery } = useManageQueryParams({
    router,
    searchParams
  })

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const {
    handleDaySelection,
    registerAvailableProduct,
    selectedDays,
    handleCleanSelectedDays,
    loading: loaAvailable,
    days
  } = useSaveAvailableProduct()
  const { idStore } = dataStore || {}
  const {
    handleCheck: handleCheckDessert,
    handleRemoveList,
    setTitle,
    loadingCreateSubDessert,
    title,
    setCheck,
    dataListIds,
    data: dataLines,
    handleChangeItems,
    handleAdd,
    isCompleteRequired,
    removeOneItem,
    handleAddList,
    handleCleanData,
    setData
  } = useDessert({
    pId,
    initialData: null,
    sendNotification
  })

  const cancelAll = () => {
    setShowComponentModal(false)
    handleClick(false)
    setActive(0)
    if (food) {
      router.replace(
        {
          query: {
        ...router.query,
        food: ''
          }
        },
        undefined,
        { shallow: true }
      )
    }
  }
  const handleShowCategories = () => {
    const pathname = router.pathname !== '/dashboard/[...name]'
    if (pathname) {
      setShowCategoryModal(!showCategoryModal)
    }
    if (!pathname) {
      setShowComponentModal(4)
      handleQuery('categories', 'true')
    }
  }
  const propsForm = {
    handleRegister,
    setName,
    names,
    handleCheckStock,
    checkStock,
    check,
    handleChange,
    values,
    dataCategoriesProducts,
    handleCheckFreeShipping,
    handleDecreaseStock,
    handleIncreaseStock,
    stock,
    image,
    errors,
    handleShowCategories,
    ...props
  }
  // eslint-disable-next-line
  const propsListProducts = {
    onClickClear,
    data,
    dataFree,
    filter: true,
    organice: true,
    handleChangeFilter,
    grid,
    search,
    showMore,
    fetchMore,
    loading,
    setShowMore,
    pState: 1,
    handleDelete,
    ...props
  }

  const [openAlertClose, setOpenAlertClose] = useState(false)
  const [openModalDessert, setOpenModalDessert] = useState(true)
  const handleOpenModalDessert = () => {
    setOpenModalDessert(!openModalDessert)
  }
  const [handleGetOneProduct, { dataExtra }] = useGetOneProductsFood()

  const handleOpenCloseAlert = () => {
    setOpenAlertClose(!openAlertClose)
  }
  const {
    handleAdd: handleAddExtra,
    handleRemove,
    handleSubmit: onSubmitUpdate,
    handleLineChange,
    loading: l,
    handleFocusChange,
    handleEdit,
    setLine,
    selected,
    handleSelect,
    LineItems,
    inputRefs,
    handleCleanLines: CleanLines
  } = useDessertWithPrice({ sendNotification, setAlertBox, dataExtra })

  const propsExtra = {
    handleAdd: handleAddExtra,
    handleRemove,
    onSubmitUpdate,
    inputRefs,
    handleSelect,
    handleEdit,
    handleLineChange,
    selected,
    pId: pId,
    loading: l,
    setModal: handleOpenModalDessert,
    modal: openModalDessert,
    handleFocusChange,
    setLine,
    LineItems,
    handleCleanLines: CleanLines,
    useAmountInput
  }

  const handlerCreateDessert = () => {
    if (!pId || !food) {
      setShowComponentModal(false)
      handleClick(false)
      return sendNotification({
        description: 'Lo sentimos, no encontramos tu producto.',
        title: 'Error',
        backgroundColor: 'error'
      })
    }
    if (food) {
      setActive((prev) => { return prev + 1 })
      setOpenModalDessert(true)
    }
    return handleGetOneProduct({ pId: pId ?? food })
  }
  const handlerSteps = async () => {
    if (active === 0) {
      const responseRegisterProduct = await handleRegister()
      if (responseRegisterProduct?.data.updateProductFoods.success) {
        sendNotification({
          backgroundColor: 'success',
          description: `${responseRegisterProduct?.data?.updateProductFoods?.message}`,
          title: 'Éxito'
        })
        const product = responseRegisterProduct?.data.updateProductFoods.data || {}
        const { pId } = product || { pId: null }
        if (typeof router.pathname === 'string') {
          router.replace(
            {
              pathname: router.pathname,
              query: {
                ...router.query,
                food: pId
              }
            },
            undefined,
            { shallow: true }
          )
        } else {
          console.error('router.pathname is not a string:', router.pathname)
        }
        setActive((prev) => { return prev + 1 })
      } else {
        const errors = responseRegisterProduct?.data?.updateProductFoods?.errors
        errors?.map((error) => {
          sendNotification({
            backgroundColor: 'error',
            description: `${error.message}`,
            title: 'Error'
          })
        })

      }
    }
    if ((active === 1 && !isCompleteRequired)) return sendNotification({
      description: 'Completa los campos requeridos',
      title: 'Alerta',
      backgroundColor: 'warning'
    })
    if (active === 1 && food && isCompleteRequired) {
      handlerCreateDessert()
    }

    if (active === 2) {
      handlerCreateDessert()
    }
    if (active === 3) {
      setShowComponentModal(false)
      handleClick(false)
    }
    return null
  }

  /**
 * Crea la entrada para la mutación GraphQL.
 * @returns {Array} - Un array de objetos con la información del producto y el día disponible.
 */
  const createFormInput = () => {
    return selectedDays.map(day => {
      return {
        idStore: idStore,
        pId: pId || food,
        dayAvailable: day
      }
    })
  }

  /**
 * Registra el producto y maneja la respuesta.
 * @param {Array} input - La entrada creada por createFormInput.
 */
  const handleRegisterAvailableProduct = async (input) => {
    try {
      const response = await registerAvailableProduct({ variables: { input } })
      const success = response?.data?.registerAvailableProduct?.success
      if (success) {
        sendSuccessNotification()
      } else {
        const { message } = response?.data.registerAvailableProduct || {
          message: 'Ha ocurrido un error al guardar los días disponibles'
        }
        sendNotification({
          description: message,
          title: 'Error',
          backgroundColor: 'error'
        })
        if (message === 'Session expired') {
          await onClickLogout({ redirect: true })
          setAlertBox({
            description: 'La sesión ha expirado, por favor vuelve a iniciar sesión',
            title: 'Error',
            backgroundColor: 'error'
          })
        }
      }
    } catch (error) {
      sendNotification({
        description: 'Ha ocurrido un error',
        title: 'Error',
        backgroundColor: 'error'
      })
      
    }
  }

  /**
 * Maneja los pasos si `asSaveAvailableProduct` es falso.
 */
  const handleNextSteps = async () => {
    await handlerSteps()
  }

  /**
 * Envía una notificación de éxito.
 */
  const sendSuccessNotification = () => {
    setShowComponentModal(false)
    handleCleanQuery('food')
    handleCleanQuery('product')
    handleClick(false)
    sendNotification({
      description: 'Se han registrado todos los campos del producto',
      title: 'Success',
      backgroundColor: 'success'
    })
    setActive(0)
    handleCleanSelectedDays()
    setCheckAvailableDays({
      availability: true,
      noAvailability: false
    })
    handleCleanData({})
    return setErrors({
      ProDescription: false,
      ProDescuento: false,
      ProPrice: false,
      ValueDelivery: false,
      carProId: false,
      names: ''
    })
  }

  /**
 * Envia una notificación de error.
 */
  /**
 * Función principal para continuar con el registro o con los siguientes pasos.
 */
  const handleContinue = async () => {
    try {
      if (active === 0) {
        const {
          ProPrice,
          ProDescuento,
          ValueDelivery
        } = values ?? {
          ProPrice: 0,
          ProDescuento: 0,
          ValueDelivery: 0
        }
        const formattedValues = [
          ProPrice,
          ProDescuento,
          ValueDelivery
        ]
        const isBigintNumber = verifyPriceInRange({
          values: formattedValues,
          sendNotification
        })
        if (!isBigintNumber) return
      }
      const input = createFormInput()
      if (asSaveAvailableProduct) {
        await handleRegisterAvailableProduct(input)
      } else {
        await handleNextSteps()
      }
    } catch (error) {
      console.log("🚀 ~ handleContinue ~ error:", error)
      sendNotification({
        description: 'Ha ocurrido un error jejej',
        title: 'Error',
        backgroundColor: 'error'
      })
    }
  }


  const valuesObj = filterKeyObject({ ...values, names }, ['ProWeight', 'carProId', 'ProHeight'])
  const { error } = productSchema.validate(valuesObj)

  const disabled = {
    0: error,
    1: !isCompleteRequired,
    2: false,
    3: check?.noAvailability ? Boolean(!selectedDays.length > 0) : false
  }
  const asSaveAvailableProduct = disabled && selectedDays?.length > 0
  const titleHeaders = ['DETALLES', 'ADICIONALES', 'COMPLEMENTOS', 'DISPONIBILIDAD']

  const components = {
    0:      <>
              <Card bgColor={getGlobalStyle('--color-base-white')} state='30%'>
                <FormProduct {...propsForm} />
              </Card>
              {false && <Card state='20%'>
                <Text
                  fontSize='sm'
                  margin='10px 0'
                  style={{
                    '-webkitLine-clamp': 2,
                    color: '#3e3e3e',
                    fontSize: '1.125rem',
                    lineHeight: '1.5rem',
                    marginBottom: '9px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Tags
                </Text>
                {!!Array.isArray(dataTags) && dataTags?.map((tag) => {
                  return (
                    <Button
                      border='none'
                      borderRadius='0'
                      key={tag.id}
                      onClick={() => { return handleAddTag(tag.id, tag.tag) }}
                      padding='0'
                      style={{ display: 'flex', flexWrap: 'wrap' }}
                    >
                      <Tag label={tag.tag} />
                    </Button>
                  )
                })}
              </Card>
              }
              <Card state='30%'>
                <Text
                  fontSize='16px'
                  margin='10px 0'
                  style={{
                    '-webkitLine-clamp': 2,
                    color: getGlobalStyle('--color-text-gray-light'),
                    fontSize: '.9rem',
                    lineHeight: '1.5rem',
                    marginBottom: '9px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Vista previa
                </Text>
                <Card bgColor={getGlobalStyle('--color-base-white')}>
                  <MemoCardProductSimple
                    {...values}
                    alt={alt}
                    fileInputRef={fileInputRef}
                    height='100%'
                    onFileInputChange={onFileInputChange}
                    onTargetClick={onTargetClick}
                    pName={names}
                    src={src}
                    tag={tags}
                  />
                </Card>
              </Card>
            </>,
    1: <OptionalExtraProducts
              data={dataLines}
              dataListIds={dataListIds}
              handleAdd={handleAdd}
              handleAddList={handleAddList}
              handleChangeItems={handleChangeItems}
              handleCheck={handleCheckDessert}
              handleRemoveList={handleRemoveList}
              isCustomSubOpExPid={true}
              loadingCreateSubDessert={loadingCreateSubDessert}
              pId={pId}
              removeOneItem={removeOneItem}
              setCheck={setCheck}
              setData={setData}
              setTitle={setTitle}
              title={title}
            />,
    2: <div style={{ flexDirection: 'column', display: 'flex' }}>
              <Button
                height='auto'
                onClick={() => { return setOpenModalDessert(!openModalDessert) }}
                primary={true}
              >
                Mostrar modal de subproductos
              </Button>
              <ExtrasProductsItems
                dataExtra={dataExtra}
                editing={true}
                modal={openModalDessert}
                pId={pId}
                propsExtra={propsExtra}
                setModal={() => { return setOpenModalDessert(false) }}
              />
            </div>,
    3:         <div className='container_availability'>
              <Text
                color='primary'
                fontSize='20px'
                margin='10px 0'
              >
                Disponibilidad
              </Text>
              <br />
              <br />
              <Text size='sm'>
                Aquí Puedes definir en que momentos los clientes pueden comprar este producto.
              </Text>
              <Checkbox
                checked={check.availability}
                id='checkboxAvailability'
                label='Siempre disponible'
                name='availability'
                onChange={(e) => {
                  handleCheck(e)
                  if (check.noAvailability) {
                    document.getElementById('checkbox-checkboxNoAvailability').click()
                  }
                }}
              />
              <Checkbox
                checked={check.noAvailability}
                id='checkboxNoAvailability'
                label='Disponible en horarios específicos'
                name='noAvailability'
                onChange={(e) => {
                  handleCheck(e)
                  if (check.availability) {
                    document.getElementById('checkbox-checkboxAvailability').click()
                  }
                }}
              />
              {check.noAvailability &&
                <>
                  <Text size='sm' >
                    Dias de la semana
                  </Text>
                  <div className='container_days'>
                    <DaySelector
                      days={days}
                      handleDaySelection={handleDaySelection}
                      selectedDays={selectedDays}
                    />
                  </div>
                </>
              }
            </div>
  } 
  return (<>
    {loaAvailable && <Loading />}
    <Container>
      <Portal selector='portal'>
        <AwesomeModal
          customHeight='70vh'
          footer={false}
          header={false}
          onCancel={() => { return false }}
          onConfirm={() => { return setShowCategoryModal(false) }}
          onHide={() => { return setShowCategoryModal(false) }}
          padding='20px'
          question={false}
          show={showCategoryModal}
          size='50%'
          zIndex={getGlobalStyle('--z-index-high')}
        >
          <Categories />
        </AwesomeModal>
        <AwesomeModal
          btnCancel
          btnConfirm
          customHeight={'calc(100vh - 300px)'}
          footer={true}
          header={false}
          onCancel={() => { return }}
          onConfirm={cancelAll}
          onHide={handleOpenCloseAlert}
          padding='20px'
          question={false}
          show={openAlertClose}
          size='700px'
          zIndex={getGlobalStyle('--z-index-high')}
        >
          <div className={styles.wrap_alert} />
          <div
            style={{
              position: 'absolute',
              left: '0',
              right: '0',
              margin: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              top: '70px',
              padding: '20px'
            }}
          >
            <Text
              color='white'
              size='6xl'
              weight='extrabold'
            >
              Es posible que el producto no contenga todos los elementos necesarios.
            </Text>
            <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
            <Image
              alt='Imagen de un producto'
              height='auto'
              src='/Images/items.png'
              width='90%'
            />
          </div>
        </AwesomeModal>
      </Portal>
      <HeaderSteps active={active} steps={titleHeaders} />
      <div className='container_step'>
        <Column>
          {components[active] && components[active]}
        </Column>
      </div>
      <ActionStep>
        {(active !== 1 && active !== 0) &&
          <Button onClick={() => { return setActive((prev) => { return active === 1 ? 1 : prev - 1 }) }}>
            Volver
          </Button>
        }
        {router.pathname === '/products' ? <div></div> : <Button onClick={active === 1 ? handleOpenCloseAlert : cancelAll}>
          {active === 1 ? 'Cerrar' : 'Cancelar'}
        </Button>}
        <Button
          disabled={disabled[active]}
          loading={loading}
          onClick={() => {
            return handleContinue()
          }}
          primary
        >
          {asSaveAvailableProduct ? 'Guardar' : 'Continuar'}
        </Button>
      </ActionStep>

    </Container>
  </>
  )
}

FoodComponentMemo.propTypes = {
  active: PropTypes.number,
  alt: PropTypes.any,
  check: PropTypes.shape({
    availability: PropTypes.any,
    noAvailability: PropTypes.any
  }),
  data: PropTypes.any,
  dataCategoriesProducts: PropTypes.any,
  dataFree: PropTypes.any,
  errors: PropTypes.shape({
    map: PropTypes.func
  }),
  fetchMore: PropTypes.any,
  fileInputRef: PropTypes.any,
  stock: PropTypes.number,
  handleChange: PropTypes.any,
  handleChangeFilter: PropTypes.any,
  handleCheck: PropTypes.func,
  handleCheckFreeShipping: PropTypes.any,
  handleClick: PropTypes.func,
  handleDelete: PropTypes.any,
  handleRegister: PropTypes.func,
  image: PropTypes.any,
  loading: PropTypes.any,
  names: PropTypes.shape({
    trim: PropTypes.func
  }),
  onClickClear: PropTypes.any,
  onFileInputChange: PropTypes.any,
  onTargetClick: PropTypes.any,
  pId: PropTypes.any,
  search: PropTypes.any,
  sendNotification: PropTypes.func,
  setActive: PropTypes.func,
  setAlertBox: PropTypes.func,
  checkStock: PropTypes.bool,
  setCheck: PropTypes.func,
  setErrors: PropTypes.func,
  setName: PropTypes.any,
  setShowComponentModal: PropTypes.func,
  setShowMore: PropTypes.any,
  handleCheckStock: PropTypes.func,
  handleDecreaseStock: PropTypes.func,
  handleIncreaseStock: PropTypes.func,
  showMore: PropTypes.any,
  src: PropTypes.any,
  state: PropTypes.any,
  tagsProps: PropTypes.shape({
    dataTags: PropTypes.shape({
      map: PropTypes.func
    }),
    handleAddTag: PropTypes.func,
    tags: PropTypes.any
  }),
  values: PropTypes.object
}

export const FoodComponent = memo(FoodComponentMemo)