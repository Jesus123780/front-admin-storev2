'use client'

import {
  errorHandler,
  getCategoriesWithProduct,
  useCatWithProduct,
  useDeleteProductsFood,
  useDessert,
  useDessertWithPrice,
  useGetOneProductsFood,
  useImageUploaderProduct,
  useIntersectionObserver,
  useLogout,
  useManageQueryParams,
  useMobile,
  useSaveAvailableProduct,
  useSetImageProducts,
  useStore,
  useUpdateManageStock
} from 'npm-pkg-hook'
import {
  AlertInfo,
  AwesomeModal,
  getGlobalStyle,
  RippleButton,
  Row,
  SearchBar
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import { ProductFood } from 'pkg-components/stories/pages/GenerateSales/types'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  usePathname,
  useRouter,
  useSearchParams
} from 'next/navigation'

import { UploadFilesProducts } from '../../container/product/create/uploadFilesProducts'
import { Context } from '../../context/Context'
import { Categories } from '../categories'
import { Product } from '../product'
import { ProductView } from '../product/view/product'
import { TableSeating } from '../seating'
import { Banner } from './banner'
import { ButtonsAction } from './options/index'
import { StickyBoundaryCategories } from './StickyBoundaryCategories'

import styles from './styles.module.css'

type ModalKey = 1 | 2 | 3 | 4 | 5

type ModalQuery =
  | 'food'
  | 'categories'
  | 'product'
  | 'upload_product_file'
  | 'create_table_store'

type HandleActionClickResult = {
  number: ModalKey
  name: ModalQuery
  bool: boolean
}

type HandleActionClick = (
  number: ModalKey,
  value?: string | boolean
) => HandleActionClickResult

interface AvailableProduct {
  dayAvailable: string
}

interface GraphQLError {
  graphQLErrors?: unknown[]
  message?: string
}

interface FetchMoreResult {
  getCatProductsWithProduct?: {
    catProductsWithProduct?: unknown[]
    totalCount?: number
  }
}

interface ActiveModal {
  number: ModalKey
  name: ModalQuery
  value: string
}

const MODAL_QUERY: Record<ModalKey, ModalQuery> = {
  1: 'food',
  2: 'categories',
  3: 'product',
  4: 'upload_product_file',
  5: 'create_table_store'
}

const MODAL_TITLE: Record<ModalKey, string> = {
  1: 'Ver productos',
  2: 'Categorías',
  3: 'Producto',
  4: 'Crear multiples productos',
  5: 'Crear mesas'
}

const MODAL_KEYS: ModalKey[] = [1, 2, 3, 4, 5]

/**
 * Modal queries whose values must always be normalized to `true`.
 *
 * `food` is the only modal that preserves a contextual value,
 * such as the selected product ID.
 */
const BOOLEAN_MODAL_QUERIES = new Set<ModalQuery>([
  'categories',
  'product',
  'upload_product_file',
  'create_table_store'
])

/**
 * Identifies whether a value corresponds to a valid modal key.
 *
 * @param {unknown} value - Value to validate.
 * @returns {value is ModalKey} Whether the value is a valid modal key.
 */
const isModalKey = (
  value: unknown
): value is ModalKey => {
  return (
    typeof value === 'number' &&
    MODAL_KEYS.includes(
      value as ModalKey
    )
  )
}

/**
 * Normalizes the query value according to the modal.
 *
 * All modal queries except `food` are boolean and therefore
 * always use the value `true`.
 *
 * `food` preserves its contextual value, such as the product ID.
 *
 * @param {ModalQuery} queryName - Query associated with the modal.
 * @param {string | boolean} value - Original query value.
 * @returns {string | boolean} Normalized query value.
 */
const normalizeModalQueryValue = (
  queryName: ModalQuery,
  value: string | boolean
): string | boolean => {
  if (
    BOOLEAN_MODAL_QUERIES.has(
      queryName
    )
  ) {
    return true
  }

  return value
}

/**
 * Finds the first modal query present in the URL.
 *
 * @param {URLSearchParams} params - Current URL parameters.
 * @returns {ActiveModal | null} Active modal information.
 */
const getActiveModalFromParams = (
  params: URLSearchParams
): ActiveModal | null => {
  for (
    const key of MODAL_KEYS
  ) {
    const queryName =
      MODAL_QUERY[key]

    const value =
      params.get(queryName)

    if (value !== null) {
      return {
        number: key,
        name: queryName,
        value
      }
    }
  }

  return null
}

export const Store: React.FC = () => {
  const [showDessert, setShowDessert] =
    useState<boolean>(false)

  const [modal, setModal] =
    useState<boolean>(false)

  const [searchQuery, setSearchQuery] =
    useState<string>('')

  const [alertModal, setAlertModal] =
    useState<boolean>(false)

  const [checkStock, setCheckStock] =
    useState<boolean>(false)

  const [moreCatProduct, setMoreCaProduct] =
    useState<number>(400)

  const { isMobile, isTablet } =
    useMobile()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /**
   * Stores the query that opened the current modal.
   */
  const activeModalQueryRef =
    useRef<ModalQuery | null>(null)

  /**
   * Prevents the initial URL synchronization
   * from running more than once.
   */
  const hasInitializedModalRef =
    useRef<boolean>(false)

  const ref =
    useRef<HTMLDivElement>(null!)

  const {
    setAlertBox,
    handleClick,
    sendNotification,
    show
  } = useContext(Context)

  const { onClickLogout } =
    useLogout({})

  const [updateManageStock] =
    useUpdateManageStock()

  const [searchFilter] =
    useState<{
      gender: string[]
      desc: string[]
      speciality: string[]
    }>({
      gender: [],
      desc: [],
      speciality: []
    })

  const {
    handleCleanQuery
  } = useManageQueryParams()

  const [
    handleGetOneProduct,
    {
      loading,
      data: product,
      dataExtra,
      dataOptional
    }
  ] = useGetOneProductsFood()

  const [store] =
    useStore()

  const [
    data,
    {
      fetchMore,
      totalCount,
      loading: loadingCatProd
    }
  ] = useCatWithProduct({
    search: '',
    max: moreCatProduct,
    ...searchFilter
  })

  const {
    handleDelete,
    loading: loadingDeleteProduct
  } = useDeleteProductsFood({
    sendNotification,
    onSuccess: () => {
      handleClick(false)
      handleCleanQuery('food')
      setAlertModal(false)
    }
  })

  const {
    handleCheck:
      handleCheckDessert,
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
    pId: product?.pId,
    initialData: dataOptional,
    sendNotification
  })

  const {
    handleAdd:
      handleAddExtra,
    handleRemove,
    handleSubmit:
      onSubmitUpdate,
    handleLineChange,
    loading: loadingExtra,
    handleFocusChange,
    handleEdit,
    setLine,
    selected,
    handleSelect,
    LineItems,
    inputRefs,
    handleCleanLines:
      cleanLines
  } = useDessertWithPrice({
    sendNotification,
    setAlertBox,
    dataExtra
  })

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

  const { storeName } =
    getStore || {}

  const { storeName: nameStore } =
    store || {}

  /**
   * Removes only modal-related query parameters
   * while preserving unrelated query parameters.
   *
   * @param {URLSearchParams} params - URL parameters to clean.
   * @param {ModalQuery} activeQuery - Query that must remain.
   * @returns {void}
   */
  const removeOtherModalQueries = (
    params: URLSearchParams,
    activeQuery: ModalQuery
  ): void => {
    MODAL_KEYS.forEach(
      (key) => {
        const queryName =
          MODAL_QUERY[key]

        if (
          queryName !==
          activeQuery
        ) {
          params.delete(
            queryName
          )
        }
      }
    )
  }

  /**
   * Synchronizes a modal query with the current URL.
   *
   * Boolean modals always use `true`.
   * `food` preserves its contextual value.
   *
   * All unrelated query parameters remain intact.
   *
   * @param {ModalQuery} queryName - Query associated with the modal.
   * @param {string | boolean} value - Query value.
   * @returns {void}
   */
  const syncModalQuery =
    useCallback(
      (
        queryName: ModalQuery,
        value: string | boolean
      ): void => {
        const params =
          new URLSearchParams(
            searchParams.toString()
          )

        const normalizedValue =
          normalizeModalQueryValue(
            queryName,
            value
          )

        removeOtherModalQueries(
          params,
          queryName
        )

        params.set(
          queryName,
          String(
            normalizedValue
          )
        )

        const queryString =
          params.toString()

        router.replace(
          queryString
            ? `${pathname}?${queryString}`
            : pathname,
          {
            scroll: false
          }
        )
      },
      [
        pathname,
        router,
        searchParams
      ]
    )

  /**
   * Removes a specific query parameter
   * while preserving every other query parameter.
   *
   * @param {string} queryName - Query parameter to remove.
   * @returns {void}
   */
  const removeQueryParam =
    useCallback(
      (
        queryName: string
      ): void => {
        const params =
          new URLSearchParams(
            searchParams.toString()
          )

        params.delete(
          queryName
        )

        const queryString =
          params.toString()

        router.replace(
          queryString
            ? `${pathname}?${queryString}`
            : pathname,
          {
            scroll: false
          }
        )
      },
      [
        pathname,
        router,
        searchParams
      ]
    )

  /**
   * Closes the currently active modal.
   *
   * Only the active modal query is removed.
   * Other query parameters remain intact.
   *
   * @returns {void}
   */
  const handleCloseModal =
    useCallback(
      (): void => {
        const currentParams =
          new URLSearchParams(
            searchParams.toString()
          )

        const activeModal =
          getActiveModalFromParams(
            currentParams
          )

        const queryName =
          activeModalQueryRef.current ??
          activeModal?.name ??
          null

        if (queryName) {
          removeQueryParam(
            queryName
          )
        }

        activeModalQueryRef.current =
          null

        handleClick(false)
      },
      [
        handleClick,
        removeQueryParam,
        searchParams
      ]
    )

  /**
   * Opens a product modal and synchronizes
   * its product ID in the URL.
   *
   * @param {ProductFood} selectedProduct - Product selected by the user.
   * @returns {void}
   */
  const handleProduct =
    useCallback(
      (
        selectedProduct: ProductFood
      ): void => {
        const productId =
          selectedProduct?.pId

        if (
          productId == null
        ) {
          return
        }

        activeModalQueryRef.current =
          'food'

        handleGetOneProduct({
          pId: productId
        })

        handleClick(1)

        syncModalQuery(
          'food',
          String(productId)
        )

        setCheckStock(
          Boolean(
            selectedProduct?.manageStock
          )
        )
      },
      [
        handleClick,
        handleGetOneProduct,
        syncModalQuery
      ]
    )

  /**
   * Opens a modal and synchronizes its query parameter.
   *
   * Boolean modals are always stored as `true`.
   *
   * @param {ModalKey} number - Modal identifier.
   * @param {string | boolean} [value=true] - Query value.
   * @returns {HandleActionClickResult} Action result.
   */
  const handleActionClick =
    useCallback<HandleActionClick>(
      (
        number,
        value = true
      ): HandleActionClickResult => {
        const queryName =
          MODAL_QUERY[number]

        if (!queryName) {
          sendNotification({
            description:
              'Acción no válida',
            title: 'Error',
            backgroundColor:
              'error'
          })

          return {
            number,
            name: queryName,
            bool: false
          }
        }

        const normalizedValue =
          normalizeModalQueryValue(
            queryName,
            value
          )

        activeModalQueryRef.current =
          queryName

        /**
         * Preserve the original modal opening event.
         */
        handleClick(number)

        /**
         * Synchronize only the active modal query.
         *
         * create_table_store is always converted to:
         *
         * ?create_table_store=true
         */
        syncModalQuery(
          queryName,
          normalizedValue
        )

        return {
          number,
          name: queryName,
          bool: true
        }
      },
      [
        handleClick,
        sendNotification,
        syncModalQuery
      ]
    )

  /**
   * Synchronizes the modal state from the URL
   * on initial mount.
   *
   * Supported examples:
   *
   * ?food=123
   * ?categories=true
   * ?product=true
   * ?upload_product_file=true
   * ?create_table_store=true
   *
   * @returns {void}
   */
  useEffect(() => {
    if (
      hasInitializedModalRef.current
    ) {
      return
    }

    hasInitializedModalRef.current =
      true

    const params =
      new URLSearchParams(
        searchParams.toString()
      )

    const activeModal =
      getActiveModalFromParams(
        params
      )

    if (!activeModal) {
      return
    }

    const {
      number,
      name,
      value
    } = activeModal

    activeModalQueryRef.current =
      name

    /**
     * Preserve the original product loading
     * event when food is opened directly by URL.
     */
    if (
      name === 'food' &&
      value
    ) {
      handleGetOneProduct({
        pId: value
      })
    }

    /**
     * Preserve the original modal opening event.
     */
    handleClick(number)

    /**
     * Normalize every boolean modal query.
     *
     * Examples:
     *
     * ?categories=anything
     *        -> ?categories=true
     *
     * ?product=anything
     *        -> ?product=true
     *
     * ?upload_product_file=anything
     *        -> ?upload_product_file=true
     *
     * ?create_table_store=categories
     *        -> ?create_table_store=true
     */
    const normalizedValue =
      normalizeModalQueryValue(
        name,
        value
      )

    const currentValue =
      String(
        normalizedValue
      )

    if (
      currentValue !== value
    ) {
      params.set(
        name,
        currentValue
      )

      const queryString =
        params.toString()

      router.replace(
        queryString
          ? `${pathname}?${queryString}`
          : pathname,
        {
          scroll: false
        }
      )
    }

    // Initial synchronization intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Updates stock management state.
   *
   * @param {boolean} newState - New stock management state.
   * @returns {Promise<void>}
   */
  const updateStockState =
    useCallback(
      async (
        newState: boolean
      ): Promise<void> => {
        if (pId == null) {
          return
        }

        const response =
          await updateManageStock({
            pId,
            manageStock:
              newState
          })

        sendNotification({
          title: response.success
            ? 'Exitoso'
            : 'Error',
          description:
            response.message,
          backgroundColor:
            response.success
              ? 'success'
              : 'error'
        })
      },
      [
        pId,
        sendNotification,
        updateManageStock
      ]
    )

  /**
   * Toggles product stock management.
   *
   * @returns {void}
   */
  const handleCheckStock =
    useCallback(
      (): void => {
        setCheckStock(
          (previousState) => {
            const newState =
              !previousState

            void updateStockState(
              newState
            )

            return newState
          }
        )
      },
      [updateStockState]
    )

  const propsUploadProductImage =
    useImageUploaderProduct({
      sendNotification
    })

  const { image } =
    propsUploadProductImage

  const [
    updateImageProducts
  ] = useSetImageProducts()

  /**
   * Updates the product image.
   *
   * @returns {Promise<void>}
   */
  const handleUpdateImageProduct =
    useCallback(
      async (): Promise<void> => {
        if (pId == null) {
          return
        }

        const response =
          await updateImageProducts({
            pId,
            image
          })

        const {
          message,
          success
        } =
          response?.data
            ?.editProductFoods ||
          {}

        sendNotification({
          title: 'Exitoso',
          description:
            message,
          backgroundColor:
            success
              ? 'success'
              : 'warning'
        })
      },
      [
        image,
        pId,
        sendNotification,
        updateImageProducts
      ]
    )

  const propsExtra = {
    handleAdd:
      handleAddExtra,
    handleRemove,
    onSubmitUpdate,
    inputRefs,
    handleSelect,
    handleEdit,
    handleLineChange,
    selected,
    pId,
    loading:
      loadingExtra,
    setModal: () => {
      setModal(
        (previous) =>
          !previous
      )
    },
    modal,
    handleFocusChange,
    setLine,
    LineItems,
    handleCleanLines:
      cleanLines
  }

  const dissertProps = {
    handleCheck:
      handleCheckDessert,
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

  const { days } =
    useSaveAvailableProduct()

  const selectedDays: string[] =
    Array.isArray(
      product?.getAllAvailableProduct
    )
      ? product.getAllAvailableProduct.map(
        (
          day: AvailableProduct
        ) =>
          day.dayAvailable
      )
      : []

  const handleDeleteProduct =
    useCallback(
      (
        selectedProduct: ProductFood
      ): void => {
        handleDelete(
          selectedProduct
        )

        /**
         * Preserve existing behavior:
         * product modal remains active while
         * delete flow is executed.
         */
        handleClick(1)
      },
      [
        handleClick,
        handleDelete
      ]
    )

  const productProps = {
    dataExtra,
    handleCheckStock,
    checkStock,
    setAlertModal,
    propsExtra,
    tag:
      product?.getOneTags ||
      {},
    dataOptional,
    loading,
    days,
    dissertProps,
    modal,
    nameStore,
    pId,
    ProBarCode,
    pName,
    ProDescription,
    ProDescuento,
    ProImage,
    ProPrice,
    selectedDays,
    showDessert,
    store,
    storeName,
    propsUploadProductImage,
    handleUpdateImageProduct,
    handleDelete:
      handleDeleteProduct,
    onHideDessert:
      (): void => {
        setShowDessert(
          (previous) =>
            !previous
        )
      },
    setModal:
      (): void => {
        setModal(
          (previous) =>
            !previous
        )
      },
    setShowDessert:
      (): void => {
        setShowDessert(
          (previous) =>
            !previous
        )
      }
  }

  const defaultObserverOptions:
    IntersectionObserverInit = {
    root: null,
    threshold: 0.1,
    rootMargin: '200px'
  }

  const { onScreen } =
    useIntersectionObserver({
      el: ref,
      active: true,
      options:
        defaultObserverOptions,
      disconnect: true,
      onEnter: (): void => {
        try {
          const currentTotal =
            totalCount

          if (
            onScreen &&
            moreCatProduct <
              currentTotal &&
            !loadingCatProd
          ) {
            setMoreCaProduct(
              (current) =>
                current + 50
            )

            fetchMore({
              variables: {
                max:
                  moreCatProduct,
                min: 0
              },
              updateQuery: (
                prevResult: unknown,
                {
                  fetchMoreResult
                }: {
                  fetchMoreResult?:
                    FetchMoreResult
                }
              ) => {
                if (
                  !fetchMoreResult
                ) {
                  return prevResult
                }

                const
                  catProductsWithProduct =
                    fetchMoreResult
                      .getCatProductsWithProduct
                      ?.catProductsWithProduct

                const
                  fetchedTotalCount =
                    fetchMoreResult
                      .getCatProductsWithProduct
                      ?.totalCount

                if (
                  !Array.isArray(
                    catProductsWithProduct
                  )
                ) {
                  return prevResult
                }

                if (
                  typeof fetchedTotalCount !==
                    'number' ||
                  Number.isNaN(
                    fetchedTotalCount
                  )
                ) {
                  return prevResult
                }

                return {
                  getCatProductsWithProduct:
                    {
                      catProductsWithProduct,
                      totalCount:
                        fetchedTotalCount
                    }
                }
              }
            })
          }
        } catch (error) {
          const err =
            error as GraphQLError

          const responseError =
            errorHandler({
              errors:
                err?.graphQLErrors ||
                []
            })

          if (
            err?.message ===
              'Token expired' ||
            responseError
          ) {
            onClickLogout({
              redirect: true
            })
          }
        }
      }
    })

  /**
   * Updates product search text.
   *
   * @param {string} value - Search value.
   * @returns {void}
   */
  const handleSearchChange =
    useCallback(
      (
        value: string
      ): void => {
        setSearchQuery(
          value
        )
      },
      []
    )

  const categoriesWithProduct =
    useMemo(() => {
      const normalizedSearch =
        searchQuery.trim()

      if (
        !normalizedSearch
      ) {
        return data
      }

      return getCategoriesWithProduct(
        data,
        normalizedSearch
      )
    }, [
      data,
      searchQuery
    ])

  const component:
    Record<
      ModalKey,
      React.ReactNode
    > = {
    1: (
      <ProductView
        {...productProps}
      />
    ),
    2: <Categories />,
    3: <Product />,
    4: (
      <UploadFilesProducts
        handleClick={
          handleClick
        }
      />
    ),
    5: <TableSeating />
  }

  const currentModalKey =
    isModalKey(show)
      ? show
      : null

  const currentModalTitle =
    currentModalKey === 3
      ? `Producto ${
          product?.pName ?? ''
        }`
      : currentModalKey
        ? MODAL_TITLE[
            currentModalKey
          ]
        : ''

  const modalProps = {
    footer: false,
    header: true,
    modal: true,
    padding: 0,
    show:
      currentModalKey !==
      null,
    title:
      currentModalTitle,
    size:
      MODAL_SIZES.large,
    zIndex:
      getGlobalStyle(
        '--z-index-modal'
      ),
    onCancel:
      handleCloseModal,
    onHide:
      handleCloseModal
  }

  const isMobileOrTablet =
    Boolean(isMobile)

  const placeholder =
    'Buscar productos'

  return (
    <div
      className={`${
        styles.wrapper
      } ${
        isMobileOrTablet
          ? styles.center
          : ''
      }`}
      style={{
        justifyContent:
          'normal'
      }}
    >
      <AwesomeModal
        customHeight='30%'
        footer={false}
        header={true}
        onHide={() => {
          setAlertModal(
            false
          )
        }}
        padding={getGlobalStyle(
          '--spacing-lg'
        )}
        show={
          alertModal &&
          currentModalKey === 1
        }
        size='40%'
        title='¿Eliminar este producto?'
        zIndex={getGlobalStyle(
          '--z-index-99999'
        )}
      >
        <AlertInfo
          message='Si eliminas el producto no aparecerá en tus productos y en tu inventario.'
          type='warning'
        />

        <Row>
          <RippleButton
            margin={getGlobalStyle(
              '--spacing-md'
            )}
            onClick={() => {
              setAlertModal(
                false
              )
            }}
          >
            Cancelar
          </RippleButton>

          <RippleButton
            loading={
              loadingDeleteProduct
            }
            margin={getGlobalStyle(
              '--spacing-md'
            )}
            onClick={() => {
              handleDelete({
                pId,
                pState: 1
              })
            }}
          >
            Confirmar
          </RippleButton>
        </Row>
      </AwesomeModal>

      <div
        className={
          styles.container
        }
      >
        <Banner
          isMobile={isMobile}
          isTablet={isTablet}
          store={store}
        />

        <ButtonsAction
          handle={
            handleActionClick
          }
        />

        <div
          style={{
            marginTop: 20
          }}
        />

        <SearchBar
          handleChange={
            handleSearchChange
          }
          padding='10px'
          placeholder={
            placeholder
          }
        />

        <div
          style={{
            marginTop: 20
          }}
        />

        <StickyBoundaryCategories
          data={
            categoriesWithProduct
          }
          handleGetOneProduct={
            handleProduct
          }
          loadingCatProd={
            loadingCatProd
          }
          reference={ref}
          sendNotification={
            sendNotification
          }
        />
      </div>

      <AwesomeModal
        {...modalProps}
      >
        {currentModalKey
          ? component[
              currentModalKey
            ]
          : null}
      </AwesomeModal>
    </div>
  )
}