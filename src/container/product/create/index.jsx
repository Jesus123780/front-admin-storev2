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
  Column,
  Row
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
import { FormProduct } from './Form'
import { ActionStep } from './styles'
import { Categories } from '../../categories'
import {
  Card,
  Container
} from './styled'
import { Context } from '../../../context/Context'
import { filterKeyObject } from '../../../utils'
import { productSchema } from './schema/producSchema'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import styles from './styles.module.css'

const titleHeaders = ['DETALLES', 'ADICIONALES', 'COMPLEMENTOS', 'DISPONIBILIDAD']

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
  const pathname = usePathname()
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
    handleCleanLines: CleanLines
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
      console.log('active', active)
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
    setActive((prev) => { return prev + 1 })
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
      const input = createFormInput()
      if (asSaveAvailableProduct) {
        await handleRegisterAvailableProduct(input)
      } else {
        await handleNextSteps()
      }
    } catch (error) {
      sendNotification({
        description: 'Ha ocurrido un error',
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
  const accepts = '.jpg,.jpeg,.png,.webp'
  const components = {
    0: <Row style={{
      height: 'calc(100vh - 220px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      flexWrap: 'wrap',
    }}>
      <Card bgColor={getGlobalStyle('--color-base-white')} state='30%'>
        <FormProduct {...propsForm} />
      </Card>
      <input
        accept={accepts}
        id='iFile'
        onChange={onFileInputChange}
        ref={fileInputRef}
        // style={{ display: 'none' }}
        type='file'
      />
      {false &&
        <Card state='20%'>
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
    </Row>,
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
    3: <div className='container_availability'>
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
          customHeight='200px'
          footer={true}
          header={false}
          onCancel={() => { return }}
          onConfirm={cancelAll}
          onHide={handleOpenCloseAlert}
          padding='20px'
          question={false}
          show={openAlertClose}
          size={MODAL_SIZES.small}
          zIndex={getGlobalStyle('--z-index-high')}
        >
          <Text
            size='3xl'
            weight='extrabold'
          >
            Es posible que el producto no contenga todos los elementos necesarios.
          </Text>
          <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
        </AwesomeModal>
      </Portal>
      <HeaderSteps active={active} steps={titleHeaders} />
      <div className={styles.container_steps}>
        {components[active] && components[active]}
      </div>
      <ActionStep>
        {(active !== 1 && active !== 0) &&
          <Button onClick={() => { return setActive((prev) => { return active === 1 ? 1 : prev - 1 }) }}>
            Volver
          </Button>
        }
        {pathname === '/products' ? <div></div> :
          <Button onClick={active === 1 ? handleOpenCloseAlert : cancelAll}>
            {active === 1 ? 'Cerrar' : 'Cancelar'}
          </Button>
        }
        <Button
          disabled={disabled[active]}
          loading={loading}
          onClick={() => {

            return handleContinue()
          }}
          primary
        >
          {asSaveAvailableProduct ? 'Guardar' : 'Continuar'}
        </Button>{console.log('disabled[active]', disabled[active])}
      </ActionStep>
    </Container>
  </>
  )
}

export const FoodComponent = memo(FoodComponentMemo)