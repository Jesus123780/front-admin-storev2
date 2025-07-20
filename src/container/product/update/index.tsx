'use client'

import PropTypes from 'prop-types'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import {
  MemoCardProductSimple,
  Text,
  Button,
  AwesomeModal,
  OptionalExtraProducts,
  ImageQRCode,
  Divider,
  getGlobalStyle,
  Row,
  RippleButton,
  AlertInfo,
  LoaderSubItem,
  BarCodes,
  Column,
  ToggleSwitch
} from 'pkg-components'
import {
  useFormTools,
  useDessertWithPrice,
  useGetOneProductsFood,
  useAmountInput,
  useSetImageProducts,
  useDeleteProductsFood,
  useUpdateManageStock,
  useDessert,
  useEditProduct
} from 'npm-pkg-hook'
import { Context } from '../../../context/Context'
import { useRouter } from 'next/navigation'
import { ExtrasProductsItems } from '../extras/ExtrasProductsItems'
import { Form } from './Form'
import styles from './styles.module.css'

export const Update = ({ id = '' } = { id: null }) => {
  // STATES
  const [modal, setModal] = useState(false)
  const [updateManageStock] = useUpdateManageStock()
  const [updateImageProducts] = useSetImageProducts()
  const { setAlertBox, sendNotification } = useContext(Context)

  const [handleChange, handleSubmit, setDataValue, { dataForm, errorForm }] = useFormTools({
    sendNotification
  })
  const router = useRouter()
  const initialState = {
    alt: '/images/placeholder-image.webp',
    src: '/images/placeholder-image.webp'
  }
  const [showDessert, setShowDessert] = useState(false)
  const [{ alt, src }, setPreviewImg] = useState(initialState)
  const [alertModal, setAlertModal] = useState(false)

  const [checkStock, setCheckStock] = useState(false)

  /**
   * Updates stock management state
   * @param {boolean} newState - The new value of manageStock
   */
  interface UpdateManageStockResponse {
    success: boolean
    message: string
  }

  type UpdateStockState = (newState: boolean) => Promise<void>

  const updateStockState: UpdateStockState = useCallback(
    async (newState: boolean) => {
      const response: UpdateManageStockResponse = await updateManageStock({ pId: id, manageStock: newState })
      const notifyUpdateResult = (success: boolean, message: string) => {
        sendNotification({
          title: success ? 'Exitoso' : 'Error',
          description: message,
          backgroundColor: success ? 'success' : 'error'
        })
      }
      notifyUpdateResult(response.success, response.message)
    },
    [id]
  )

  /**
   * Toggles checkStock and updates it
   */
  const handleCheckStock = () => {
    setCheckStock((prev) => {
      const newState = !prev
      updateStockState(newState)
      return newState
    })
  }

  // QUERIES
  const [
    handleGetOneProduct,
    {
      loading,
      data: dataProduct,
      dataExtra,
      dataOptional
    }
  ] = useGetOneProductsFood()

  const {
    handleAdd: handleAddExtra,
    handleRemove,
    handleSubmit: onSubmitUpdate,
    handleLineChange,
    loading: l,
    handleFocusChange,
    initialLineItems,
    handleEdit,
    setLine,
    selected,
    handleSelect,
    LineItems,
    inputRefs,
    handleCleanLines: CleanLines
  } = useDessertWithPrice({
    sendNotification,
    setAlertBox,
    dataExtra
  })

  const handleOpenModal = () => {
    const linesData = dataExtra?.map((item) => {
      return {
        extraName: item.extraName || '',
        extraPrice: item?.extraPrice?.toString() || '',
        exState: !!item.exState,
        pId: id,
        forEdit: true,
        ...item
      }
    }) || []
    setLine(
      Array.isArray(dataExtra) && dataExtra?.length > 0
        ? { Lines: linesData }
        : initialLineItems
    )
    setModal(!modal)
  }
  const propsExtra = {
    handleAdd: handleAddExtra,
    handleRemove,
    onSubmitUpdate,
    inputRefs,
    handleSelect,
    handleEdit,
    handleLineChange,
    selected,
    pId: id,
    loading: l,
    setModal: handleOpenModal,
    modal,
    handleFocusChange,
    setLine,
    LineItems,
    CleanLines,
    useAmountInput
  }

  const {
    handleCheck: handleCheckDessert,
    handleRemoveList,
    setTitle,
    title,
    setCheck,
    dataListIds,
    data: dataLines,
    handleChangeItems,
    handleAdd,
    isCompleteRequired,
    selectedItem,
    editOneItem,
    removeOneItem,
    handleAddList,
    setData
  } = useDessert({
    pId: id,
    initialData: dataOptional,
    sendNotification
  })

  const dissertProps = {
    handleCheck: handleCheckDessert,
    handleRemoveList,
    setTitle,
    title,
    setCheck,
    dataListIds,
    data: dataLines,
    handleChangeItems,
    handleAdd,
    isCompleteRequired,
    removeOneItem,
    handleAddList,
    selectedItem,
    editOneItem,
    setData
  }
  const { handleDelete, loading: loadingDeleteProduct } = useDeleteProductsFood(
    { sendNotification }
  )
  const [editProductFoods] = useEditProduct({
    sendNotification
  })
  const {
    getStore,
    pState,
    ProBarCode
  } = dataProduct || {
    getStore: {
      pState: '',
      ProBarCode: null
    },
    pState: '',
    ProBarCode: null
  }

  // HANDLESS
  interface OnFileInputChangeEvent extends React.ChangeEvent<HTMLInputElement> { }

  interface FilePreview {
    src: string
    alt: string
  }

  const onFileInputChange = (event: OnFileInputChangeEvent) => {
    const { files } = event.target
    setPreviewImg(
      files && files.length
        ? {
          src: URL.createObjectURL(files[0]),
          alt: files[0].name
        }
        : initialState
    )
  }
  const onHideDessert = () => {
    setShowDessert(false)
  }

  interface DataForm {
    pName?: string
    ProPrice: number
    ProDescuento?: string
    ValueDelivery?: string
    ProUniDisponibles?: number
    ProDescription?: string
    ProProtegido?: boolean
    ProAssurance?: boolean
    ProWidth?: number
    ProHeight?: number
    ProLength?: number
    ProWeight?: number
    ProQuantity?: number
    ProOutstanding?: boolean
    ProDelivery?: boolean
    ProVoltaje?: string
    pState?: string
    sTateLogistic?: string
  }

  interface EditProductFoodsResponse {
    data?: {
      editProductFoods?: {
        success?: boolean
        message?: string
      }
    }
  }

  interface HandleFormEvent extends React.FormEvent<HTMLFormElement> { }

  // HANDLES
  const handleForm = (e: HandleFormEvent) => {
    e.preventDefault()
    return handleSubmit({
      event: e,

      action: () => {
        const {
          pName,
          ProPrice,
          ProDescuento,
          ValueDelivery,
          ProUniDisponibles,
          ProDescription,
          ProProtegido,
          ProAssurance,
          ProWidth,
          ProHeight,
          ProLength,
          ProWeight,
          ProQuantity,
          ProOutstanding,
          ProDelivery,
          ProVoltaje,
          pState,
          sTateLogistic
        } = dataForm as DataForm || {}

        return editProductFoods({
          variables: {
            input: {
              pId: id,
              pName,
              ProPrice: ProPrice ?? 0,
              ProDescuento: ProDescuento ?? 0,
              ValueDelivery: ValueDelivery ?? 0,
              ProUniDisponibles,
              ProDescription,
              ProProtegido,
              ProAssurance,
              ProWidth,
              ProHeight,
              ProLength,
              ProWeight,
              ProQuantity,
              ProOutstanding,
              ProDelivery,
              ProVoltaje,
              pState,
              sTateLogistic
            }
          },
          // update: (cache, { data: { productFoodsOne } }) => {
          //   return updateCache({
          //     cache,
          //     query: GET_ONE_PRODUCTS_FOOD,
          //     nameFun: 'productFoodsOne',
          //     dataNew: productFoodsOne
          //   })
          // }
        })
          .then((response: EditProductFoodsResponse) => {
            if (response?.data?.editProductFoods?.success) {
              updateImageProducts({
                pId: id,
                image: {}
              })
              const { message, success } = response?.data?.editProductFoods || {}
              sendNotification({
                title: 'Exitoso',
                description: message,
                backgroundColor: success ? 'success' : 'warning'
              })
            }
          })
          .catch((response: EditProductFoodsResponse) => {
            const { message, success } = response?.data?.editProductFoods || {}
            sendNotification({
              title: 'Exitoso',
              description: message,
              backgroundColor: success ? 'success' : 'error'
            })
          })
      }
    })
  }
  const fileInputRef = useRef({
    click: () => {
      return
    }
  }) as React.RefObject<HTMLInputElement>
  interface OnTargetClickEvent extends React.MouseEvent<HTMLButtonElement, MouseEvent> { }

  const onTargetClick = (e: OnTargetClickEvent) => {
    e.preventDefault()

    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  const handleClickDelete = async () => {
    await handleDelete({
      pId: id,
      pState
    })
    return router.back()
  }
  // EFFECTS
  useEffect(() => {
    handleGetOneProduct({ pId: id })
    setDataValue(dataProduct || {})
    setCheckStock(dataProduct?.manageStock)
    // eslint-disable-next-line
  }, [id, router, dataProduct])

  return (
    <div className={styles.content}>
      <div className={styles.container}>
        <AwesomeModal
          customHeight='30%'
          footer={false}
          header={true}
          onHide={() => {
            return setAlertModal(false)
          }}
          padding={getGlobalStyle('--spacing-lg')}
          show={alertModal}
          size='40%'
          title='¿Eliminar este producto?'
          zIndex={getGlobalStyle('--z-index-99999')}
        >
          <AlertInfo
            message='Si eliminas el producto no aparecerá en tus productos y en tu inventario.'
            type='warning'
          />
          <Row justifyContent='space-between'>
            <RippleButton
              margin={getGlobalStyle('--spacing-md')}

              onClick={() => {
                return setAlertModal(false)
              }}
              radius='5px'
              widthButton='45%'
            >
              Cancelar
            </RippleButton>
            <RippleButton
              loading={loadingDeleteProduct}
              margin={getGlobalStyle('--spacing-md')}
              onClick={() => {
                return handleClickDelete()
              }}
              radius='5px'
              widthButton='45%'
            >
              Confirmar
            </RippleButton>
          </Row>
        </AwesomeModal>
        <>
          <Form
            alt={alt}
            dataForm={dataForm}
            errorForm={errorForm}
            fileInputRef={fileInputRef}
            getStore={getStore || {}}
            handleChange={handleChange}
            handleForm={handleForm}
            loading={loading}
            onFileInputChange={onFileInputChange}
            onTargetClick={onTargetClick}
            src={src}
          />
          <>
            <div>
              <Text
                as='h2'
                size='3xl'
                weight='bold'
              >
                Vista previa
              </Text>
              <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
              <MemoCardProductSimple
                del={true}
                edit={false}
                handleDelete={() => {
                  return setAlertModal(true)
                }}
                {...dataForm}
                ProImage={src}

              />
              <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
              {ProBarCode !== null && (
                <Column>
                  <Text
                    as='h2'
                    size='3xl'
                    weight='bold'
                  >
                    Código de barras:
                  </Text>
                  <BarCodes value={ProBarCode ?? ''} />
                </Column>
              )}
              <Column>
                <ToggleSwitch
                  checked={checkStock}
                  id='stock'
                  label={`Stock: ${checkStock ? 'Gestionado' : 'No gestionado'}`}
                  onChange={() => {
                    return handleCheckStock()
                  }}
                  style={{ marginBottom: getGlobalStyle('--spacing-2xl') }}
                  successColor='green'
                />
              </Column>
              <Column>
                <Text
                  as='h2'
                  size='3xl'
                  weight='bold'
                >
                  Código QR:
                </Text>
                <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
                <ImageQRCode
                  value={
                    typeof window !== 'undefined' && window.location
                      ? window.location.href
                      : ''
                  }
                  size={256}
                />
              </Column>
            </div>

            <div>
              <Button
                color='black'
                onClick={() => {
                  return handleOpenModal()
                }}
                width='50%'
              >
                Adicionales
              </Button>
              <Button
                color='black'
                onClick={() => {
                  handleGetOneProduct({ pId: id })
                  return setShowDessert(!showDessert)
                }}
                width='50%'
              >
                Sobremesa
              </Button>
              {loading ? (
                <LoaderSubItem />
              ) : (
                <ExtrasProductsItems
                  dataExtra={dataExtra || []}
                  dataOptional={dataOptional || []}
                  editing={true}
                  modal={modal}
                  pId={id}
                  propsExtra={propsExtra}
                  setModal={() => {
                    return setModal(!modal)
                  }}
                />
              )}
              <AwesomeModal
                customHeight='calc(100vh - 100px)'
                footer={false}
                header={true}
                onHide={() => {
                  return onHideDessert()
                }}
                show={showDessert}
                size='100vw'
                zIndex='999999999'
              >
                <OptionalExtraProducts {...dissertProps} />
              </AwesomeModal>
            </div>
          </>
        </>
        <Divider marginBottom={getGlobalStyle('--spacing-3xl')} />
      </div>
    </div>
  )
}

Update.propTypes = {
  id: PropTypes.string.isRequired
}

Update.displayName = 'UpdateProduct'

Update.defaultProps = {
  id: ''
}
