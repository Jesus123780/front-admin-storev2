'use client'

import PropTypes from 'prop-types'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import styled, { css } from 'styled-components'
import {
  MemoCardProductSimple,
  Text,
  Button,
  AwesomeModal,
  OptionalExtraProducts,
  getGlobalStyle,
  Row,
  RippleButton,
  AlertInfo,
  LoaderSubItem,
  BarCodes,
  Column,
  ToggleSwitch,
  BColor, 
  BGColor
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
// import { GET_ONE_PRODUCTS_FOOD } from '../queries'
import { updateCache } from '../../../utils'
import { Context } from '../../../context/Context'
import { useRouter } from 'next/navigation'
import { ExtrasProductsItems } from '../extras/ExtrasProductsItems'
import { Form } from './Form'

export const Update = ({ id = '' } = { id: null }) => {
  // STATES
  const [modal, setModal] = useState(false)
  const [updateManageStock] = useUpdateManageStock()
  const [updateImageProducts] = useSetImageProducts()

  const [handleChange, handleSubmit, setDataValue, { dataForm, errorForm }] =
    useFormTools()
  const initialState = {
    alt: '/images/placeholder-image.webp',
    src: '/images/placeholder-image.webp'
  }
  const [showDessert, setShowDessert] = useState(false)
  const { setAlertBox, sendNotification } = useContext(Context)
  const [{ alt, src }, setPreviewImg] = useState(initialState)
  const [alertModal, setAlertModal] = useState(false)

  const [checkStock, setCheckStock] = useState(false)
  
  /**
   * Updates stock management state
   * @param {boolean} newState - The new value of manageStock
   */
  const updateStockState = useCallback(async (newState) => {
    const response = await updateManageStock({ pId: id, manageStock: newState })
    const notifyUpdateResult = (success, message) => {
      sendNotification({
        title: success ? 'Exitoso' : 'Error',
        description: message,
        backgroundColor: success ? 'success' : 'error'
      })
    }
    notifyUpdateResult(response.success, response.message)
  }, [id, updateManageStock, sendNotification])
  
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
  
  const router = useRouter()
  // QUERIES
  const [
    handleGetOneProduct,
    { loading, data: dataProduct, dataExtra, dataOptional }
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
  } = useDessertWithPrice({ sendNotification, setAlertBox, dataExtra })

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
    })
    setLine(
      Array.isArray(dataExtra) && dataExtra.length > 0
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
  const [editProductFoods] = useEditProduct()
  const {
    getStore,
    pState,
    ProBarCode
  } = dataProduct || {}

  // HANDLESS
  const onFileInputChange = (event) => {
    const { files } = event.target
    setPreviewImg(
      files.length
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
          pState,
          sTateLogistic
        } = dataForm || {}
        return editProductFoods({
          variables: {
            input: {
              pId: id,
              pName,
              ProPrice: parseFloat(ProPrice),
              ProDescuento: parseFloat(ProDescuento),
              ValueDelivery: parseFloat(ValueDelivery),
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
          .then((response) => {
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
          .catch((response) => {
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
  })
  const onTargetClick = (e) => {
    e.preventDefault()

    fileInputRef.current.click()
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
    <Container>
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
            <Text weight='bold'>
              Vista previa
            </Text>
            <MemoCardProductSimple
              del={true}
              edit={false}
              handleDelete={() => {
                return setAlertModal(true)
              }}
              {...dataForm}
              ProImage={src}

            />
            {ProBarCode !== null && <BarCodes value={ProBarCode} />}
            <Column>
              <ToggleSwitch
                checked={checkStock}
                id='stock'
                label='Gestionado por stock'
                onChange={() => {
                  return handleCheckStock()
                }}
                style={{ marginBottom: getGlobalStyle('--spacing-2xl') }}
                successColor='green'
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
    </Container>
  )
}

Update.propTypes = {
  id: PropTypes.string.isRequired
}

export const ActionName = styled.span`
  position: absolute;
  height: 20px;
  width: 100px;
  right: 35px;
  color: ${BColor};
  opacity: 0;
  font-family: PFont-Light;
  transition: 0.1s ease-in-out;
  z-index: -900;
`
export const ButtonCard = styled.button`
  font-size: var(--font-size-base);
  font-family: PFont-Light;
  cursor: pointer;
  word-break: break-word;
  box-shadow: 0px 0px 6px 0px #16101028;
  position: absolute;
  right: -50px;
  transition: 0.4s ease;
  width: 50px;
  height: 50px;
  z-index: 999;
  top: ${({ top }) => {
    return top || '20px'
  }};
  transition-delay: ${({ delay }) => {
    return delay || 'auto'
  }};
  max-height: 50px;
  max-width: 50px;
  border-radius: 50%;
  align-items: center;
  display: grid;
  justify-content: center;
  background-color: ${BGColor};
  &:hover ${ActionName} {
    opacity: 1;
    z-index: 900;
  }
  ${(props) => {
    return (
      props.grid &&
      css`
        top: ${({ top }) => {
        return top || '80px'
      }};
      `
    )
  }}
`

const Container = styled.div`
  padding: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  width: 90%;
  grid-gap: 19px 12px;
  margin: auto;
  background-color: var(--color-base-white);
`
