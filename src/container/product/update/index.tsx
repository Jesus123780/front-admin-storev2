'use client'

import { useRouter } from 'next/navigation'
import {
  useAmountInput,
  useDeleteProductsFood,
  useDessert,
  useDessertWithPrice,
  useEditProduct,
  useFormTools,
  useGetOneProductsFood,
  useImageUploaderProduct,
  useRestockProduct,
  useSetImageProducts,
  useUpdateManageStock
} from 'npm-pkg-hook'
import {
  AlertInfo,
  AwesomeModal,
  BarCodes,
  Button,
  Column,
  Divider,
  getGlobalStyle,
  ImageQRCode,
  InputHooks,
  LoaderSubItem,
  MemoCardProductSimple,
  OptionalExtraProducts,
  QuantityButton,
  RippleButton,
  Row,
  Text,
  ToggleSwitch
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import { Context } from '../../../context/Context'
import { ExtrasProductsItems } from '../extras/ExtrasProductsItems'
import { Form } from './Form'
import styles from './styles.module.css'

export const Update = ({ id = '' } = { id: null }) => {
  // STATES
  const [modal, setModal] = useState(false)
  const [updateManageStock] = useUpdateManageStock()
  const [restockProduct] = useRestockProduct()
  const [restockLoading, setRestockLoading] = useState(false)
  const [updateImageProducts] = useSetImageProducts()
  const [updateImageLoading, setUpdateImageLoading] = useState(false)
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
  // Current persisted stock and the target the operator wants to reach. The
  // target can only be increased (restock/entry); it never goes below the
  // current stock — same rule as product complements. Lowering stock must go
  // through a sale or inventory adjustment.
  const [currentStock, setCurrentStock] = useState(0)
  const [targetStock, setTargetStock] = useState(0)

  /**
   * Registers an inventory ENTRY (RESTOCK) for the main product, raising its
   * stock to `targetStock`. Only the positive difference is applied; the
   * backend ignores non-increasing targets. Updates the local current stock on
   * success so the UI stays in sync and the floor moves up.
   */
  const handleRestockProduct = async () => {
    if (!id || targetStock <= currentStock) return
    setRestockLoading(true)
    try {
      const response = await restockProduct({ pId: id, stock: targetStock })
      sendNotification({
        title: response?.success ? 'Exitoso' : 'Error',
        description: response?.message ?? '',
        backgroundColor: response?.success ? 'success' : 'error'
      })
      if (response?.success && response?.data) {
        const newStock = Number(response.data.stock ?? targetStock)
        setCurrentStock(newStock)
        setTargetStock(newStock)
      }
    } finally {
      setRestockLoading(false)
    }
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    loadingEditSubOptional,
    selectedItem,
    selectedExtra,
    openModalEditExtra,
    setSelectedExtra,
    setOpenModalEditExtra,
    editOneItem,
    editOneExtra,
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
    loadingEditSubOptional,
    removeOneItem,
    handleAddList,
    selectedItem,
    selectedExtra,
    openModalEditExtra,
    setSelectedExtra,
    setOpenModalEditExtra,
    editOneItem,
    editOneExtra,
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

  // Barcode shown/edited in the form. Prefer what the operator is currently
  // typing (dataForm), falling back to the product's saved barcode so the
  // live preview and the EAN-13 renderer stay in sync.
  const barCodeValue: string = `${(dataForm as DataForm)?.ProBarCode ?? ProBarCode ?? ''}`

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
    ProBarCode?: string
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


  // HANDLES
  const handleForm = (e) => {
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
          ProBarCode: ProBarCodeForm,
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
              // Only send the barcode when the operator actually typed one so an
              // empty field never clears the product's existing barcode.
              ...(ProBarCodeForm ? { ProBarCode: ProBarCodeForm } : {}),
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
            // The success/error alert is raised by useEditProduct's onCompleted
            // handler (single source of truth), so we don't duplicate it here.
            if (response?.data?.editProductFoods?.success) {
              // If the user selected a new image, upload it too. Fire-and-forget
              // with its own error handling so a failed image upload does not
              // mask the successful product update.
              if (image) {
                void handleUpdateImageProduct()
              }
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

  const onTargetClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
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
    const stock = Number(dataProduct?.stock) || 0
    setCurrentStock(stock)
    setTargetStock(stock)

  }, [id, router, dataProduct])

  const propsUploadProductImage = useImageUploaderProduct({
    sendNotification
  })
  const { image, preview } = propsUploadProductImage

  // Already-saved image for this product (filename stored in DB). Served by the
  // Next.js route `/api/images/[filename]`, which reads from the same folder the
  // backend writes to (PATH_EXTERNAL_OS).
  const savedProImage: string = dataProduct?.ProImage ?? ''
  const savedImageSrc = savedProImage && !savedProImage.startsWith('/images/')
    ? `/api/images/${savedProImage}`
    : '/images/placeholder-image.webp'

  // What the preview card shows: the freshly selected/cropped image (base64)
  // if the user just picked one, otherwise the image already saved on disk.
  const previewSrc = preview || savedImageSrc

  /**
   * Upload the currently selected product image via the GraphQL `setImageProducts`
   * mutation (multipart upload). Uses the File produced by the image uploader hook.
   */
  const handleUpdateImageProduct = async () => {
    if (!image) {
      sendNotification({
        title: 'Selecciona una imagen',
        description: 'Primero elige o arrastra una imagen para el producto.',
        backgroundColor: 'warning'
      })
      return
    }

    setUpdateImageLoading(true)
    try {
      const response = await updateImageProducts({ pId: id, image })
      const { success, message } = response?.data?.setImageProducts ?? {}
      sendNotification({
        title: success ? 'Imagen actualizada' : 'No se pudo actualizar',
        description: message ?? (success ? 'La imagen del producto se actualizó.' : 'Error al actualizar la imagen.'),
        backgroundColor: success ? 'success' : 'error'
      })
    } catch (err) {
      sendNotification({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error al actualizar la imagen del producto.',
        backgroundColor: 'error'
      })
    } finally {
      setUpdateImageLoading(false)
    }
  }

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
          size={MODAL_SIZES.small}
          title='¿Eliminar este producto?'
          zIndex={getGlobalStyle('--z-index-99999')}
        >
          <AlertInfo
            message='Si eliminas el producto no aparecerá en tus productos y en tu inventario.'
            type='warning'
          />
          <Row justifyContent='space-between'>
            <Button
              onClick={() => {
                return setAlertModal(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              primary={true}
              loading={loadingDeleteProduct}
              onClick={() => {
                return handleClickDelete()
              }}
            >
              Eliminar
            </Button>
          </Row>
        </AwesomeModal>
        <>
          <Form
            dataForm={dataForm}
            errorForm={errorForm}
            fileInputRef={fileInputRef}
            getStore={getStore || {}}
            handleChange={handleChange}
            handleForm={handleForm}
            loading={loading}
            propsImageEdit={propsUploadProductImage}
            onFileInputChange={onFileInputChange}
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
                ProImage={previewSrc}

              />
              <Button
                primary={true}
                loading={updateImageLoading}
                styles={{ marginTop: getGlobalStyle('--spacing-lg') }}
                onClick={() => {
                  return handleUpdateImageProduct()
                }}
              >
                Guardar imagen
              </Button>
              <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
              <Column style={{ gap: getGlobalStyle('--spacing-m'), marginBottom: getGlobalStyle('--spacing-2xl') }}>
                <Text
                  as='h2'
                  size='3xl'
                  weight='bold'
                >
                  Código de barras:
                </Text>
                <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
                <InputHooks
                  info='Acepta EAN-13, EAN-8, UPC, CODE128 o CODE39 (formato detectado automáticamente). Déjalo vacío para conservar el actual.'
                  name='ProBarCode'
                  onChange={handleChange}
                  title='Código de barras'
                  value={barCodeValue}
                  width='100%'
                />
                <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
                <BarCodes value={barCodeValue} />
              </Column>
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
                {checkStock && (
                  <Column style={{ gap: getGlobalStyle('--spacing-s'), marginBottom: getGlobalStyle('--spacing-2xl') }}>
                    <Text as='span' size='sm'>
                      {`Stock actual: ${currentStock}`}
                    </Text>
                    <AlertInfo
                      message='Solo puedes aumentar el stock (entrada de inventario). Para disminuirlo usa una venta o un ajuste de inventario.'
                      type='warning'
                    />
                    <Column alignItems='center' style={{ gap: getGlobalStyle('--spacing-m') }}>
                      <QuantityButton
                        handleDecrement={() => {
                          // Never below the current (floor): only increases.
                          setTargetStock((prev) => (prev > currentStock ? prev - 1 : currentStock))
                        }}
                        handleIncrement={() => {
                          setTargetStock((prev) => (Number(prev) || currentStock) + 1)
                        }}
                        // Disable "-" once at the floor (current stock).
                        showNegativeButton={targetStock <= currentStock}
                        quantity={targetStock}
                      />
                      <RippleButton
                        disabled={restockLoading || targetStock <= currentStock}
                        onClick={handleRestockProduct}
                        fullWidth={true}

                      >
                        {`Agregar entrada (+${Math.max(targetStock - currentStock, 0)})`}
                      </RippleButton>
                    </Column>
                  </Column>
                )}
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
                    return setModal((prev) => {
                      return !prev
                    })
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
Update.displayName = 'UpdateProduct'

Update.defaultProps = {
  id: ''
}
