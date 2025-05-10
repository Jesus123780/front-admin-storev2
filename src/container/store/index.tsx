'use client'

import { Context } from '../../context/Context'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  useMobile,
  useCatWithProduct,
  useGetOneProductsFood,
  useUpdateManageStock,
  useIntersectionObserver,
  useDeleteProductsFood,
  useDessert,
  useManageQueryParams,
  onClickLogout,
  errorHandler,
  useDessertWithPrice,
  getCategoriesWithProduct,
  useSaveAvailableProduct,
  useStore
} from 'npm-pkg-hook'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  AlertInfo,
  AwesomeModal,
  RippleButton,
  Row,
  SearchBar,
  getGlobalStyle
} from 'pkg-components'
import { ButtonsAction } from './options/index'
// import { Food } from '../update/Products/food'
// import { Categories } from '../Categories'
// import { Product } from './Product'
// import { ButtonsAction } from './Options/index'
import { StickyBoundaryCategories } from './StickyBoundaryCategories'
import { Banner } from './banner'
import { UploadFilesProducts } from '../../container/product/create/uploadFilesProducts'
import styles from './styles.module.css'
import { FoodComponent } from '../product/create'
import { Product } from '../product'
import { Categories } from '../categories'
import { TableSeating } from '../seating'
import { ProductView } from '../product/view/product'

export const Store = () => {
  // STATES
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showDessert, setShowDessert] = useState(false)
  const ref = useRef(null)
  const {
    setAlertBox,
    handleClick,
    sendNotification,
    show
  } = useContext(Context)
  const [updateManageStock] = useUpdateManageStock()

  const [searchFilter] = useState({
    gender: [],
    desc: [],
    speciality: []
  })
  const [moreCatProduct, setMoreCaProduct] = useState(400)
  const [modal, setModal] = useState(false)
  // HOOKS
  const { isMobile } = useMobile()
  const { handleQuery, handleCleanQuery } = useManageQueryParams({
    router,
    searchParams
  })
  const { handleDelete, loading: loadingDeleteProduct } = useDeleteProductsFood({
    sendNotification,
    onSuccess: () => {
      handleClick(false)
      handleCleanQuery('food')
      setAlertModal(false)
    }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [handleGetOneProduct,
    {
      loading,
      data: product,
      dataExtra,
      dataOptional
    }
  ] = useGetOneProductsFood()
  const [store] = useStore()

  const [data, {
    fetchMore,
    totalCount,
    loading: loadingCatProd
  }] = useCatWithProduct({
    search: '',
    max: moreCatProduct,
    ...searchFilter
  })

  // HANDLESS
  const handleOpenModalAdditional = () => {
    setModal(!modal)
  }

  const {
    getStore,
    pId,
    pName,
    ProPrice,
    ProDescuento,
    ProBarCode,
    ProDescription,
    ProImage
  } = product || {}

  const { storeName } = getStore || {}
  const { storeName: nameStore } = store || {}
  const {
    food,
    categories,
    product: queryProductParams
  } = router.query || {}

  const handleProduct = (product) => {
    const { pId } = product || {}
    handleGetOneProduct({ pId })
    handleClick(1)
    handleQuery('food', pId)
    setCheckStock(product?.manageStock)

  }

  const handleHidden = (queryName) => {
    handleCleanQuery(queryName)
    handleClick(false)
  }

  useEffect(() => {
    if (food) {
      handleGetOneProduct({ pId: food })
    }
    const stateFood = food ? 1 : null
    const productParam = queryProductParams ? 3 : stateFood
    const state = categories ? 2 : productParam
    handleClick(state)
    // eslint-disable-next-line
  }, [])

  const handleActionClick = (number, query, value = true) => {
    handleClick(number)
    handleQuery(query, value)
  }

  const select = {
    1: 'food',
    2: 'categories',
    3: 'product',
    4: 'upload_product_file',
    5: 'create_table_store'
  }

  const titleModal = {
    1: 'Ver productos',
    2: 'Categorías',
    3: 'Productos',
    4: 'Crear multiples productos',
    5: 'Crear mesas'
  }

  const modalProps = {
    backdrop: 'static',
    btnCancel: true,
    btnConfirm: false,
    footer: false,
    header: true,
    height: '100%',
    modal: true,
    padding: 0,
    show: show,
    title: show ? titleModal[show] : '',
    size: '100%',
    sizeIconClose: '35px',
    zIndex: getGlobalStyle('--z-index-99999'),
    onCancel: () => { return show ? handleHidden(select[show]) : null },
    onHide: () => { return show ? handleHidden(select[show]) : null }
  }

  const {
    handleCheck: handleCheckDessert,
    handleRemoveList,
    setTitle,
    title,
    editOneItem,
    editOneExtra,
    selectedItem,
    setCheck,
    selectedExtra,
    openModalEditExtra,
    setSelectedExtra,
    setOpenModalEditExtra,
    dataListIds,
    data: dataLines,
    handleChangeItems,
    handleAdd,
    isCompleteRequired,
    removeOneItem,
    handleAddList,
    setData
  } = useDessert({
    pId,
    initialData: dataOptional,
    sendNotification
  })

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
    pId,
    loading: l,
    setModal: handleOpenModalAdditional,
    modal,
    handleFocusChange,
    setLine,
    LineItems,
    handleCleanLines: CleanLines
  }

  const dissertProps = {
    handleCheck: handleCheckDessert,
    handleRemoveList,
    setTitle,
    title,
    selectedExtra,
    openModalEditExtra,
    setSelectedExtra,
    setOpenModalEditExtra,
    setCheck,
    dataListIds,
    data: dataLines,
    handleChangeItems,
    handleAdd,
    isCompleteRequired,
    removeOneItem,
    editOneItem,
    editOneExtra,
    selectedItem,
    handleAddList,
    setData
  }
  const handleDeleteProduct = (data: any) => {
    handleDelete(data)
    handleClick(1)
  }
  interface AvailableProduct {
    dayAvailable: string;
  }

  const selectedDays: string[] = (Array.isArray(product?.getAllAvailableProduct) && product?.getAllAvailableProduct?.length)
    ? product?.getAllAvailableProduct?.map((day: AvailableProduct) => {
      return day?.dayAvailable;
    })
    : [];
  const { days } = useSaveAvailableProduct()
  const [alertModal, setAlertModal] = useState(false)
  const [checkStock, setCheckStock] = useState(false)

  /**
     * Updates stock management state
     * @param {boolean} newState - The new value of manageStock
     */
  const updateStockState = useCallback(async (newState: any) => {
    const response = await updateManageStock({ pId, manageStock: newState })
    const notifyUpdateResult = (success: any, message: any) => {
      sendNotification({
        title: success ? 'Exitoso' : 'Error',
        description: message,
        backgroundColor: success ? 'success' : 'error'
      })
    }
    notifyUpdateResult(response.success, response.message)
  }, [pId, updateManageStock])

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

  const productProps = {
    dataExtra,
    handleCheckStock,
    checkStock,
    setAlertModal,
    propsExtra: propsExtra,
    tag: product.getOneTags || {},
    dataOptional,
    loading,
    days,
    dissertProps: dissertProps,
    modal: modal,
    nameStore: nameStore,
    pId: pId,
    ProBarCode,
    pName: pName,
    ProDescription: ProDescription,
    ProDescuento: ProDescuento,
    ProImage: ProImage,
    ProPrice: ProPrice,
    selectedDays,
    showDessert: showDessert,
    store: store,
    storeName: storeName,
    handleDelete: handleDeleteProduct,
    onHideDessert: () => { return setShowDessert(!showDessert) },
    setModal: handleOpenModalAdditional,
    setShowDessert: () => { return setShowDessert(!showDessert) }
  }

  const defaultObserverOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: '200px'
  }

  const { onScreen } = useIntersectionObserver({
    el: ref,
    active: true,
    options: defaultObserverOptions,
    disconnect: true,
    onEnter: () => {
      try {
        const long = totalCount
        if (onScreen && (onScreen && moreCatProduct < long) && !loadingCatProd) {
          setMoreCaProduct(s => { return s + 50 })
          fetchMore({
            variables: { max: moreCatProduct, min: 0 },
            updateQuery: (prevResult, { fetchMoreResult }) => {
              // Check if fetchMoreResult is null or undefined
              if (!fetchMoreResult) {
                return prevResult
              }

              // Check if the catProductsWithProduct field is an array
              const catProductsWithProduct = fetchMoreResult?.getCatProductsWithProduct?.catProductsWithProduct
              if (!Array.isArray(catProductsWithProduct)) {
                return prevResult
              }

              // Check if totalCount is a number and not NaN
              const totalCount = fetchMoreResult?.getCatProductsWithProduct?.totalCount
              if (typeof totalCount !== 'number' || Number.isNaN(totalCount)) {
                return prevResult
              }
              const validateArray = Array.isArray(fetchMoreResult.getCatProductsWithProduct.catProductsWithProduct)
              if (!fetchMoreResult && !validateArray) return prevResult
              return {
                getCatProductsWithProduct: {
                  getCatProductsWithProduct: [...fetchMoreResult.getCatProductsWithProduct.catProductsWithProduct],
                  totalCount: totalCount
                }
              }
            }
          })
        }
      } catch (error) {
        const errors = {
          errors: error?.graphQLErrors || []
        }

        const responseError = errorHandler(errors)

        if (error.message === 'Token expired' || responseError) {
          onClickLogout()
        }
      }
    }
  })

  const handleChange = (e) => {
    setSearchQuery(e.target.value)
  }


  const categoriesWithProduct = useMemo(() => {
    if (searchQuery.trim() === '') {
      return data
    }
    return getCategoriesWithProduct(data, searchQuery)

  }, [data, searchQuery])

  const component = {
    1: <ProductView {...productProps} />,
    2: <Categories />,
    3: <Product />,
    4: <UploadFilesProducts handleClick={handleClick} />,
    5: <TableSeating />
  }

  const placeholder = 'Buscar productos'
  const justifyContent = 'normal'
  const center = isMobile ? true : false
  return (
    <div
      className={`${styles.wrapper} ${center ? styles.center : ""}`}
      style={{ justifyContent: justifyContent || "normal" }}
    >
      <AwesomeModal
        customHeight='30%'
        footer={false}
        header={true}
        onHide={() => { return setAlertModal(false) }}
        padding={getGlobalStyle('--spacing-lg')}
        show={alertModal && show === 1}
        size='40%'
        title='¿Eliminar este producto?'
        zIndex={getGlobalStyle('--z-index-99999')}
      >
        <AlertInfo message='Si eliminas el producto no aparecerá en tus productos y en tu inventario.' type='warning' />
        <Row>
          <RippleButton
            margin={getGlobalStyle('--spacing-md')}
            onClick={() => {
              return setAlertModal(false)
            }}
          >
            Cancelar
          </RippleButton >
          <RippleButton
            loading={loadingDeleteProduct}
            margin={getGlobalStyle('--spacing-md')}
            onClick={() => {
              return handleDelete({ pId, pState: 1 })
            }}
          >
            Confirmar
          </RippleButton>
        </Row>
      </AwesomeModal>
      <div className={styles.container}>
        <Banner isMobile={isMobile} store={store} />
        <ButtonsAction handle={handleActionClick} />
        <div style={{ marginTop: 20 }} />
        <SearchBar
          handleChange={handleChange}
          padding='10px'
          placeholder={placeholder}
        />
        <div style={{ marginTop: 20 }} />
        <StickyBoundaryCategories
          data={categoriesWithProduct}
          handleChange={handleChange}
          handleGetOneProduct={handleProduct}
          isMobile={isMobile}
          loadingCatProd={loadingCatProd}
          placeholder={placeholder}
          reference={ref}
          sendNotification={sendNotification}
          setAlertBox={setAlertBox}
        />
      </div>
      <AwesomeModal {...modalProps} >
        {component[show]}
      </AwesomeModal>
    </div>
  )
}

Store.propTypes = {

}


