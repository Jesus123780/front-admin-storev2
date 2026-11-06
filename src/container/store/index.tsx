'use client'

import {
  usePathname,
  useRouter,
  useSearchParams
} from 'next/navigation'
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
  useRestockProduct,
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

import { UploadFilesProducts } from '../../container/product/create/uploadFilesProducts'
import { Context } from '../../context/Context'
import { Categories } from '../categories'
import { Product } from '../product'
import { ProductView } from '../product/view/product'
import { TableSeating } from '../seating'
import { Banner } from './banner'
import { DeleteStore } from './deleteStore'
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
  availableProductId?: string
  idStore?: string
  pId?: string
  dayAvailable: number
  startDate?: string
  endDate?: string
  state?: number
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

  const [showDeleteStore, setShowDeleteStore] =
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

  const [restockProduct] =
    useRestockProduct()

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

    const INITIAL_CATEGORY_LIMIT = 400

  const [
    data,
    {
      fetchMore,
      totalCount,
      loading: loadingCatProd
    }
  ] = useCatWithProduct({
    search: '',
    max: INITIAL_CATEGORY_LIMIT,
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
    ProImage,
    stock: productStock,
    manageStock: productManageStock
  } = product || {}

  /**
   * Keeps the "Gestionado por stock" toggle in sync with the loaded
   * product. This covers both opening the modal by click and reloading
   * the page directly with `?food=<pId>`, where `handleProduct` never runs.
   */
  useEffect(() => {
    if (pId == null) {
      return
    }

    setCheckStock(Boolean(productManageStock))
  }, [pId, productManageStock])

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
   * Only removes the query associated with a modal
   * that was explicitly opened by this component.
   *
   * This prevents AwesomeModal from removing the `food`
   * query when invoking onHide during its initial mount
   * while the modal is hidden.
   *
   * Repeated calls from onCancel and onHide are safe:
   * after the first call, the active query is reset.
   *
   * @returns {void}
   */
  const handleCloseModal =
    useCallback(
      (): void => {
        const queryName =
          activeModalQueryRef.current

        if (!queryName) {
          return
        }

        // Evita ejecuciones duplicadas.
        activeModalQueryRef.current = null

        // Cierra el modal.
        handleClick(false)

        // Elimina únicamente la query del modal activo.
        removeQueryParam(queryName)
      },
      [
        handleClick,
        removeQueryParam
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

    hasInitializedModalRef.current = true

    const params =
      new URLSearchParams(
        searchParams.toString()
      )

    const activeModal =
      getActiveModalFromParams(params)

    if (!activeModal) {
      return
    }

    const {
      number,
      name,
      value
    } = activeModal

    // Registrar el modal recuperado desde la URL.
    activeModalQueryRef.current = name

    // Recuperar el producto sin modificar su query.
    if (
      name === 'food' &&
      value
    ) {
      handleGetOneProduct({
        pId: value
      })
    }

    // Abrir el modal.
    handleClick(number)

    // Normalizar únicamente las queries booleanas.
    const normalizedValue =
      normalizeModalQueryValue(
        name,
        value
      )

    const currentValue =
      String(normalizedValue)

    if (currentValue !== value) {
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

  /**
   * Registers an inventory ENTRY (RESTOCK) for the shown product,
   * raising its stock to `targetStock`.
   *
   * Only increases are applied; the backend ignores
   * non-increasing targets.
   *
   * @param {number} targetStock - Absolute target stock to reach.
   * @returns {Promise<boolean>} Whether the restock succeeded.
   */
  const handleRestockProduct =
    useCallback(
      async (
        targetStock: number
      ): Promise<boolean> => {
        if (pId == null) {
          return false
        }

        const response =
          await restockProduct({
            pId,
            stock: targetStock
          })

        sendNotification({
          title: response?.success
            ? 'Exitoso'
            : 'Error',
          description:
            response?.message ?? '',
          backgroundColor:
            response?.success
              ? 'success'
              : 'error'
        })

        return Boolean(
          response?.success
        )
      },
      [
        pId,
        restockProduct,
        sendNotification
      ]
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
const handleUpdateImageProduct = useCallback(
  async (): Promise<void> => {
    if (pId == null) return

    try {
      const response = await updateImageProducts({
        pId,
        image
      })

      const result = response?.data?.setImageProducts

      if (!result) {
        sendNotification({
          title: 'Error al actualizar la imagen',
          description: 'No se recibió una respuesta válida del servidor.'
        })

        return
      }

      const { success, message } = result

      sendNotification({
        title: success
          ? 'Imagen actualizada correctamente'
          : 'No se pudo actualizar la imagen',
        description: message || (
          success
            ? 'La imagen del producto fue actualizada.'
            : 'Ocurrió un error al guardar la imagen.'
        )
      })
    } catch (error) {
      sendNotification({
        title: 'Error al actualizar la imagen',
        description:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado al actualizar la imagen.'
      })
    }
  },
  [
    image,
    pId,
    sendNotification,
    updateImageProducts
  ]
)

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

  // Raw availability records (day + time ranges) used by the "Ver productos"
  // modal to render the read-only weekly availability and the "available today"
  // state. Kept intact so the view can show start/end times, not just the day.
  const availability: AvailableProduct[] =
    Array.isArray(
      product?.getAllAvailableProduct
    )
      ? product.getAllAvailableProduct
      : []

  const selectedDays: number[] =
    availability.map(
      (
        day: AvailableProduct
      ) =>
        day.dayAvailable
    )

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
    currentStock: Number(productStock) || 0,
    handleRestockProduct,
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
    // Propiedades adicionales del producto para que el modal
    // "Ver productos" muestre toda la información disponible.
    pCode: product?.pCode,
    stock: productStock,
    manageStock: product?.manageStock,
    ProQuantity: product?.ProQuantity,
    ProUniDisponibles: product?.ProUniDisponibles,
    ProWeight: product?.ProWeight,
    ProWidth: product?.ProWidth,
    ProHeight: product?.ProHeight,
    ProLength: product?.ProLength,
    ProVoltaje: product?.ProVoltaje,
    ValueDelivery: product?.ValueDelivery,
    vat: product?.vat,
    ProStar: product?.ProStar,
    ProDelivery: product?.ProDelivery,
    ProOutstanding: product?.ProOutstanding,
    ProProtegido: product?.ProProtegido,
    ProAssurance: product?.ProAssurance,
    pState: product?.pState,
    sTateLogistic: product?.sTateLogistic,
    createdAt: product?.createdAt,
    updatedAt: product?.updatedAt,
    selectedDays,
    availability,
    sendNotification,
    onAvailabilityUpdated: (): void => {
      // Refetch the product so the modal and cards reflect the new schedule.
      if (product?.pId !== null && product?.pId !== undefined) {
        handleGetOneProduct({ pId: String(product.pId) })
      }
    },
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
      ? `Producto ${product?.pName ?? ''
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
      currentModalKey !== null,
    title:
      currentModalTitle,
    size:
      MODAL_SIZES.large,
    zIndex:
      getGlobalStyle(
        '--z-index-modal'
      ),

    // La limpieza se realiza al cancelar/cerrar explícitamente.
    onCancel:
      handleCloseModal
  }

  const isMobileOrTablet =
    Boolean(isMobile)

  const placeholder =
    'Buscar productos'

  return (
    <div
      className={`${styles.wrapper
        } ${isMobileOrTablet
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
            Eliminar
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
          onDeleteStore={() => {
            setShowDeleteStore(true)
          }}
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
          enablePagination={
            searchQuery.trim() === ''
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
        customHeight='auto'
        footer={false}
        header={true}
        height='auto'
        onCancel={() => {
          setShowDeleteStore(false)
        }}
        onHide={() => {
          setShowDeleteStore(false)
        }}
        padding={getGlobalStyle('--spacing-2xl')}
        show={showDeleteStore}
        size='min(560px, calc(100vw - 24px))'
        title='Eliminar comercio definitivamente'
        zIndex={getGlobalStyle('--z-index-modal')}
      >
        <DeleteStore
          onCancel={() => {
            setShowDeleteStore(false)
          }}
          onDeleted={() => {
            setShowDeleteStore(false)
          }}
        />
      </AwesomeModal>

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