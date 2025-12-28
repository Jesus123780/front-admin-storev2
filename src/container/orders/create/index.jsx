'use client'

import { useRouter } from 'next/navigation'
import {
  generateStoreURL,
  useAmountInput,
  useFilterConfigs,
  useFormatDate,
  useGetAllPaymentMethods,
  useGetClients,
  usePrintSaleTicket,
  useReactToPrint,
  useSales,
  useStore,
  useStoreTables
} from 'npm-pkg-hook'
import {
  AwesomeModal,
  CardProductSimple,
  Column,
  Divider,
  generatePdfDocumentInvoice,
  GenerateSales as GenerateSalesPkg,
  getGlobalStyle,
  InputHooks,
  numberFormat,
  RippleButton,
  Row
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import PropTypes from 'prop-types'
import React, {
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import { Context } from '../../../context/Context'
import { ModalSales } from './ModalSales'
import { SubItems } from './SubItems'
import { SuccessSaleModal } from './Success'

export const CreateSales = ({
  show = false,
  setShow = (bool) => {
    return bool
  }
}) => {
  // STATES
  const {
    sendNotification,
    setAlertBox,
    setMessagesToast,
    setSalesOpen
  } = useContext(Context)
  const [client, setClient] = useState({
    clientName: '',
    ccClient: '',
    ClientAddress: '',
    clientNumber: ''
  })
  const [dataClientes, { loading: loadingClients }] = useGetClients()
  const date = new Date()
  const [fetchMoreLoader, setFetchMoreLoader] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [prod, setProd] = useState(null)
  const componentRef = useRef()
  const promiseResolveRef = useRef(null)
  const router = useRouter()
  const [dataStore] = useStore()
  const [storeTables] = useStoreTables()

  const onCloseModalSale = () => {
    setMessagesToast([])
    setSalesOpen(false)
    setOpenCurrentSale(false)
  }
  // QUERIES

  const {
    data,
    dataExtra,
    dataOptional,
    dataProduct,
    delivery,
    dispatch,
    fetchMore,
    loadingRegisterSale,
    handleChange,
    handleProduct,
    handleSubmit,
    loading,
    modalItem,
    oneProductToComment,
    handleAddAllProductsToCart,
    openCommentModal,
    handleRemoveValue,
    print,
    product,
    discount,
    setProduct,
    productsFood,
    pagination,
    currentPage,
    handlePageChange,
    setDelivery,
    setModalItem,
    setShowMore,
    setPrint,
    showMore,
    handleComment,
    totalProductPrice,
    setOpenCurrentSale,
    values,
    handleUpdateAllExtra,
    openCurrentSale,
    handleAddOptional,
    handleIncrementExtra,
    sumExtraProducts,
    handleDecrementExtra,
    loadingExtraProduct,
    disabledModalItems,
    handleAddProduct,
    datCat,
    handleChangeFilter,
    setValues,
    handleChangeCheck,
    code
  } = useSales({
    disabled: false,
    router,
    sendNotification,
    setAlertBox,
    setSalesOpen: onCloseModalSale
  })

  const restPropsSliderCategory = {
    data: datCat,
    handleChangeCheck,
    breakpoints: {
      320: {
        spaceBetween: 12,
        slidesPerView: 'auto'
      },
      560: {
        spaceBetween: 12,
        slidesPerView: 'auto'
      },
      960: {
        spaceBetween: 12,
        slidesPerView: 'auto'
      },
      1440: {
        spaceBetween: 16,
        slidesPerView: 'auto'
      },
      1818: {
        spaceBetween: 16,
        slidesPerView: 'auto'
      }
    }
  }
  const modalItems = {
    setModalItem,
    loading: loadingExtraProduct,
    disabled: disabledModalItems,
    sumExtraProducts,
    product: prod ?? product?.PRODUCT,
    modalItem,
    handleUpdateAllExtra,
    handleIncrementExtra,
    handleDecrementExtra,
    handleAddOptional,
    dataExtra,
    dataOptional,
    dataProduct,
    handleDecrement,
    handleIncrement
  }

  function handleDecrement() {
    updateProductQuantity(-1)
  }

  function handleIncrement() {
    updateProductQuantity(1)
  }

  function updateProductQuantity(quantityChange) {
    try {
      const item = getProductById(product?.PRODUCT.pId)
      const OurProduct = getProductById(product?.PRODUCT?.pId)
      setProd({
        ...item,
        ProQuantity: item.ProQuantity + quantityChange,
        ProPrice: (item.ProQuantity + quantityChange) * OurProduct?.ProPrice
      })
      if (quantityChange < 0) {
        dispatch({ type: 'REMOVE_PRODUCT', payload: prod ?? product?.PRODUCT })
        if (item?.ProQuantity === 1) {
          setModalItem(false)
          setProduct({ PRODUCT: {} })
        }
      } else {
        dispatch({ type: 'ADD_TO_CART', payload: product?.PRODUCT })
      }
    } catch (error) {
      return
    }
  }

  function getProductById(pId) {
    return (
      data?.PRODUCT?.find((item) => {
        return item.pId === pId
      }) || {}
    )
  }

  const handlePrint = useReactToPrint({
    documentTitle: '',
    pageStyle: 'padding: 0px',
    content: () => {
      return componentRef.current
    },
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        promiseResolveRef.current = resolve
        setIsPrinting(true)
      })
    },
    onAfterPrint: () => {
      // Reset the Promise resolve so we can print again
      promiseResolveRef.current = null
      setIsPrinting(false)
    }
  })

  const { ClientAddress } = client || {
    clientName: '',
    ccClient: '',
    ClientAddress: '',
    clientNumber: ''
  }

  const { yearMonthDay, longDayName } = useFormatDate({})
  const localDate = date.toLocaleTimeString()
  const customDate = `${yearMonthDay + ' - ' + localDate + ' - ' + longDayName
    }`

  const {
    city,
    storeName,
    Image: src,
    storePhone,
    NitStore,
    department,
    idStore
  } = dataStore || {}
  const urlStore = generateStoreURL({ city, department, storeName, idStore })

  const dataToPrint = {
    srcLogo: src ?? '/images/DEFAULTBANNER.png',
    addressStore: ClientAddress,
    storePhone: storePhone,
    date: customDate,
    client: {
      ...client
    },
    ref: code,
    products: data?.PRODUCT || [],
    total: numberFormat(totalProductPrice),
    change: values.change,
    NitStore,
    delivery: values.valueDelivery,
    storeName,
    urlStore
  }

  const handleDownLoad = () => {
    if (dataToPrint) {
      return generatePdfDocumentInvoice({
        data: dataToPrint,
        titleFile: `VENTA_${code}_${customDate}`,
        numberFormat
      })
    }
    return null
  }
  const restPropsSalesModal = {
    code,
    data,
    paymentMethod: data?.payId === 1 ? 'TRANSFERENCIA' : 'EFECTIVO',
    delivery,
    print,
    totalProductPrice,
    values,
    handleChange,
    discount,
    setDelivery,
    componentRef,
    promiseResolveRef,
    handlePrint,
    isPrinting,
    dataClientes,
    setPrint,
    loading,
    handleSubmit,
    handleDownLoad
  }
  const existComment = oneProductToComment?.comment?.length > 0

  const handleCloseModal = () => {
    dispatch({ type: 'REMOVE_ALL_PRODUCTS' })
    setValues({})
    onCloseModalSale()
  }
  useEffect(() => {
    const cliId = dataClientes?.data?.find((client) => {
      return client?.ccClient === dataStore?.idStore
    })?.cliId

    if (cliId) {
      setValues((prevValues) => {
        return { ...prevValues, cliId }
      })
    }
  }, [dataClientes, dataStore])

  useEffect(() => {
    const setInitialValues = () => {
      if (
        !values.cliId ||
        Boolean(dataClientes?.length > 0) ||
        dataStore?.idStore
      ) {
        const client = dataClientes?.data?.find((client) => {
          return client?.cliId === values?.cliId
        })
        const cliId = dataClientes?.data?.find((client) => {
          return client?.ccClient === dataStore?.idStore
        })?.cliId

        if (cliId) {
          setClient(client)
        }
      }
    }

    setInitialValues()

  }, [values?.cliId]);

  const isLoading = loadingRegisterSale || loading || isPrinting

  const fetchMoreProducts = () => {
    setFetchMoreLoader(true)
    if (productsFood?.length > 0) {
      fetchMore({
        variables: { max: showMore, min: 0 },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const totalCount = fetchMoreResult.productFoodsAll.length
          return totalCount
            ? {
              // Aquí debes especificar la forma en que se actualizará la lista de productos
              productFoodsAll: [
                ...previousResult.productFoodsAll,
                ...fetchMoreResult.productFoodsAll.filter((newItem) => {
                  return !previousResult.productFoodsAll.some((oldItem) => {
                    return oldItem.pId === newItem.pId
                  })
                })
              ]
            }
            : previousResult
        },
        onError: () => {
          setFetchMoreLoader(false)
        }
      })
      setShowMore((s) => {
        return s + 100
      })
      setFetchMoreLoader(false)
    }
  }

  const handleDecrementClick = (producto) => {
    dispatch({ type: 'REMOVE_PRODUCT', payload: producto })
  }

  const handleIncrementClick = (producto) => {
    dispatch({ id: producto.pId, type: 'INCREMENT' })
  }

  const selectProduct = (product) => {
    if (!product) { return }
    handleProduct(product)
    setModalItem(!modalItem)
  }

  const handleToggleFree = (producto) => {
    if (!producto) {
      return sendNotification({
        message: 'No se ha seleccionado un producto',
        title: 'Error',
        backgroundColor: 'error'
      })
    }
    return dispatch({ type: 'TOGGLE_FREE_PRODUCT', payload: producto })
  }
  const [openAside, setOpenAside] = useState(false)
  const handleOpenAside = () => {
    setOpenAside(!openAside)
  }
  const [handlePrintSale] = usePrintSaleTicket()
  const { data: paymentMethodsData } = useGetAllPaymentMethods()

  const paymentMethods = paymentMethodsData.map((method) => {
    return {
      id: method.payId,
      name: method.name,
      icon: method.icon
    }
  })

  const { data: dataFilter } = useFilterConfigs()
  const [activeFilter, setActiveFilter] = useState(0)

  const filterProps = {
      activeFilter,
      setActiveFilter,
      dataFilter
  }
  return (
    <>

      {/* {openCurrentSale && ( */}
      <SuccessSaleModal
        code={code}
        dispatch={dispatch}
        handleCloseModal={handleCloseModal}
        handleDownLoad={handleDownLoad}
        handlePrint={() => {
          return handlePrintSale(code)
        }}
        loading={isPrinting}
        openCurrentSale={openCurrentSale}
        products={data?.PRODUCT || []}
        router={router}
        setOpenCurrentSale={setOpenCurrentSale}
      />
      <ModalSales {...restPropsSalesModal} />
      <GenerateSalesPkg
        client={client}
        dataFilter={dataFilter}
        currentPage={currentPage}
        data={data}
        dataClientes={dataClientes}
        dispatch={dispatch}
        fetchMoreProducts={fetchMoreProducts}
        handleChange={handleChange}
        handleComment={handleComment}
        handleChangeFilter={handleChangeFilter}
        handleAddProduct={handleAddProduct}
        handleDecrement={handleDecrementClick}
        handleFreeProducts={(producto) => {
          return handleToggleFree(producto)
        }}
        handleIncrement={handleIncrementClick}
        handleOpenAside={handleOpenAside}
        handlePageChange={handlePageChange}
        handleSave={() => {
          setPrint({ callback: handlePrint })
        }}
        isLoading={isLoading}
        loadingClients={loadingClients}
        loadingProduct={true}
        numberFormat={numberFormat}
        onClick={(producto) => {
          return selectProduct(producto)
        }}
        openAside={openAside}
        pagination={pagination}
        paymentMethods={paymentMethods}
        productsFood={productsFood}
        propsSliderCategory={restPropsSliderCategory}
        setShow={(show) => {
          handleCloseModal()
          setShow(show)
        }}
        show={show}
        storeTables={storeTables}
        totalProductPrice={numberFormat(totalProductPrice)}
        useAmountInput={useAmountInput}
        values={values}
        handleAddAllProductsToCart={handleAddAllProductsToCart}
        {...filterProps}
      />
      <SubItems {...modalItems} />
      <AwesomeModal
        btnConfirm={false}
        footer={false}
        header={true}
        onCancel={() => {
          return handleComment()
        }}
        onHide={() => {
          return handleComment()
        }}
        question={false}
        show={openCommentModal}
        size={MODAL_SIZES.small}
        title='Dejar un comentario'
        customHeight='auto'
        padding={getGlobalStyle('--spacing-sm')}
        zIndex={getGlobalStyle('--z-index-modal')}
      >
        <Column alignItems='center' justifyContent='space-between'>
          <CardProductSimple
            {...oneProductToComment}
            ProDescription={oneProductToComment.ProDescription}
            ProDescuento={oneProductToComment.ProDescuento}
            ProImage={oneProductToComment.ProImage}
            ProPrice={oneProductToComment.ProPrice}
            ProQuantity={oneProductToComment.ProQuantity}
            ValueDelivery={oneProductToComment.ValueDelivery}
            comment={false}
            edit={false}
            key={oneProductToComment.pId}
            pName={oneProductToComment.pName}
            render={null}
          />
          <Divider marginTop={getGlobalStyle('--spacing-xl')} />
          <InputHooks
            name='comment'
            onChange={(e) => {
              return handleChange(e)
            }}
            placeholder='Deja un comentario'
            as='textarea'
            value={values.comment ?? ''}
            range={{
              min: 0,
              max: 150
            }}
          />
          <Divider marginTop={getGlobalStyle('--spacing-xl')} />
          <Row style={{ justifyContent: 'space-between' }}>
            <RippleButton
              onClick={() => {
                return dispatch({
                  type: 'PUT_COMMENT',
                  payload: oneProductToComment?.pId
                })
              }}
              radius='0.3125rem'
              widthButton={existComment ? '45%' : '100%'}
            >
              {!existComment ? 'Dejar comentario' : 'Actualizar'}
            </RippleButton>
            <Divider marginTop={getGlobalStyle('--spacing-xs')} />
            {existComment && (
              <RippleButton
                onClick={() => {
                  return handleRemoveValue({
                    name: 'comment',
                    pId: oneProductToComment?.pId
                  })
                }}
                radius='0.3125rem'
                widthButton={existComment ? '45%' : '100%'}

              >
                Eliminar
              </RippleButton>
            )}
          </Row>
        </Column>
      </AwesomeModal>
    </>
  )
}

CreateSales.propTypes = {
  setShow: PropTypes.func,
  show: PropTypes.bool
}

CreateSales.defaultProps = {
  setShow: () => {
    return {}
  },
  show: false
}