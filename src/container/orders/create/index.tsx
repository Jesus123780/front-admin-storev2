'use client'

import { useRouter } from 'next/navigation'
import {
  ConfigurationScope,
  generateStoreURL,
  useAmountInput,
  useFilterConfigs,
  useFormatDate,
  useGetAllPaymentMethods,
  useGetClients,
  useGetResolvedConfiguration,
  usePrintSaleTicket,
  usePushNotifications,
  // useReactToPrint,
  useSales,
  useScanFeedback,
  useStore,
  useStoreTables,
  useUpsertConfiguration
} from 'npm-pkg-hook'
import {
  AwesomeModal,
  Button,
  CardProductSimple,
  Column,
  Divider,
  FloatingScanButtons,
  generatePdfDocumentInvoice,
  GenerateSales as GenerateSalesPkg,
  getGlobalStyle,
  InputHooks,
  numberFormat,
  Row
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import PropTypes from 'prop-types'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import { Context } from '../../../context/Context'
import { ModalScanner } from '../../ModalScanner'
import { CreateProductDrawer } from './CreateProductDrawer'
import { useModalLayer } from './modalLayers'
import { ModalSales } from './ModalSales'
import { ProductNotFoundDialog } from './ProductNotFoundDialog'
import { SubItems } from './SubItems'
import { SuccessSaleModal } from './Success'

/* =========================================================
   SALES TABLE CONFIGURATION
========================================================= */

interface SalesDividerPositions {
  [key: string]: number
}

/**
 * Default catalog / cart distribution.
 */
const DEFAULT_SALES_DIVIDER_POSITIONS: SalesDividerPositions = {
  __0: 66.6667,
  __1: 33.3333
}

/**
 * Configuration identity.
 */
const SALES_TABLE_CONFIGURATION = {
  componentName: 'SalesTable',
  key: 'columnPositions'
} as const

/**
 * Delay before persisting a column resize.
 */
const SALES_RESIZE_DEBOUNCE_MS = 700

/**
 * Validate configuration received from Apollo.
 */
const normalizeSalesDividerPositions = (
  value: unknown
): SalesDividerPositions | null => {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null
  }

  const entries = Object.entries(
    value as Record<string, unknown>
  )

  if (!entries.length) {
    return null
  }

  const result: SalesDividerPositions = {}

  for (const [key, position] of entries) {
    if (
      typeof position !== 'number' ||
      !Number.isFinite(position) ||
      position < 0 ||
      position > 100
    ) {
      return null
    }

    result[key] = position
  }

  return result
}

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
  // Explicit, app-owned signal for the post-sale success UX. Decoupled from the
  // hook's internal `openCurrentSale` so the Success modal has a single source
  // of truth and no competing states.
  const [saleSuccess, setSaleSuccess] = useState(false)
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

  // Barcode scanning: camera modal visibility + mode ('barcode' | 'qr').
  const [showScanner, setShowScanner] = useState(false)
  const [scannerMode, setScannerMode] = useState('barcode')
  // Código detectado por el escáner que NO existe como producto: dispara el
  // diálogo de creación. null = diálogo cerrado.
  const [notFoundBarcode, setNotFoundBarcode] = useState(null)
  // Código para el drawer de creación embebido (AC-10). null = drawer cerrado.
  const [createDrawerBarcode, setCreateDrawerBarcode] = useState(null)
  // Guard anti-doble: pId ya agregados al carrito desde la creación.
  const createdAddedRef = useRef(new Set())
  // pId del producto recién escaneado/encontrado para resaltarlo en el carrito
  // con la animación "pop". null = sin resaltado. Se limpia tras ~1.2s para
  // permitir re-disparar la animación al escanear el mismo producto de nuevo.
  const [highlightedPid, setHighlightedPid] = useState(null)
  const highlightTimerRef = useRef(null)
  // Retroalimentación sonora/vibración del escaneo (Web Audio API).
  const {
    soundEnabled,
    toggleSound,
    playSuccess,
    playError,
    vibrate
  } = useScanFeedback()

  // Web Push: only the subscription flag and the server-send action are needed
  // here to notify when a sale is registered from this screen.
  const {
    isSubscribed,
    onClickShowLocalNotification
  } = usePushNotifications()

  // Guards against sending a duplicate push for the same sale code if
  // onSaleSuccess fires more than once for a single registration.
  const notifiedSaleCodesRef = useRef(new Set())

  // Holds the latest push sender so the stable onSaleSuccess callback (captured
  // once by useSales) always runs against current subscription state, avoiding
  // a stale closure.
  const notifyNewSaleRef = useRef(() => { })
  notifyNewSaleRef.current = (saleCode) => {
    if (!isSubscribed || !saleCode) {
      return
    }
    if (notifiedSaleCodesRef.current.has(saleCode)) {
      return
    }
    notifiedSaleCodesRef.current.add(saleCode)
  }

  const onCloseModalSale = () => {
    setMessagesToast([])
    setSalesOpen(false)
    setSaleSuccess(false)
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
    values,
    handleUpdateAllExtra,
    handleAddOptional,
    handleIncrementExtra,
    sumExtraProducts,
    handleDecrementExtra,
    handleRemoveExtra,
    loadingExtraProduct,
    disabledModalItems,
    handleAddProduct,
    handleAddProductByBarcode,
    datCat,
    handleChangeFilter,
    setValues,
    handleChangeCheck,
    code,
    handleSavePendingOrder,

    // Filtros del modal (reusables): traducen la selección a variables de la
    // query de productos y re-consultan el listado.
    handleApplyFilters,
    handleClearFilters,

    // Estado de las órdenes.
    pendingOrders,
    activePendingOrders,
    pendingOrdersCount,
    activePendingOrderId,
    isPendingOrdersReady,
    canPersistPendingOrders,

    // Acciones.
    handleResumePendingOrder,
    removePendingOrder,
    updatePendingOrder,
    updatePendingStatus,
    clearPendingOrders,
    persistPendingOrder,
    searchPendingOrders
  } = useSales({
    disabled: false,
    router,
    sendNotification,
    setAlertBox,
    setSalesOpen: onCloseModalSale,
    onSaleSuccess: (payload) => {
      // Sale registered successfully: the hook already closed the invoice/print
      // modal. Present the Success modal via our explicit signal.
      if (payload?.code) {
        onClickShowLocalNotification({
          title: 'Nueva venta',
          description: `Venta ${payload.code}`,
          url: `/orders/${encodeURIComponent(payload.code)}`,
          tag: `sale-${payload.code}`
        })
        setSaleSuccess(payload)
        // Fire the OS-level Web Push deep-linking to the order detail.
        notifyNewSaleRef.current(payload.code)

      }
    }
  })

  // Limpia el temporizador del resaltado al desmontar para evitar fugas.
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  /**
   * Resalta un producto del carrito con la animación "pop". Reinicia primero el
   * valor a null (en un frame) para que, si el mismo pId se vuelve a escanear,
   * React detecte el cambio y la animación se re-dispare. Programa la limpieza
   * tras la duración de la animación.
   *
   * @param {string} pId - Identificador del producto a resaltar.
   */
  const triggerHighlight = (pId) => {
    if (!pId) { return }
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }
    setHighlightedPid(null)
    requestAnimationFrame(() => {
      setHighlightedPid(String(pId))
    })
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedPid(null)
      highlightTimerRef.current = null
    }, 1200)
  }


  /**
   * Punto único de entrada de la UI para un código escaneado (cámara, lector
   * USB/Bluetooth, imagen o entrada manual). Delega en el controlador central
   * del hook (consulta backend + carrito) y reacciona al resultado:
   *  - FOUND     → abre el modal de ventas (?saleOpen=true), sonido de éxito,
   *                vibración y resalta el producto en el carrito (pop).
   *  - NOT_FOUND → abre el diálogo para crear el producto con el código.
   *  - INVALID/ERROR → sonido de error (el hook ya notifica el detalle).
   *  - DUPLICATE_EVENT → se ignora (rebote de la misma lectura).
   */
  const handleScannedCode = async (rawCode) => {
    if (typeof handleAddProductByBarcode !== 'function') { return }
    const outcome = await handleAddProductByBarcode(rawCode)
    if (!outcome || typeof outcome !== 'object') { return }

    if (outcome.status === 'FOUND') {
      playSuccess()
      vibrate(40)
      // Abre el modal de ventas (sincroniza ?saleOpen=true en la URL) y resalta
      // el producto recién agregado al carrito.
      setSalesOpen(true)
      triggerHighlight(outcome.product?.pId ?? outcome.product?.id)
    } else if (outcome.status === 'NOT_FOUND') {
      playError()
      setNotFoundBarcode(outcome.barcode || String(rawCode))
    } else if (outcome.status === 'INVALID' || outcome.status === 'ERROR') {
      playError()
    }
    return outcome
  }

  /**
   * El usuario aceptó crear el producto del código no encontrado. Abre el
   * DRAWER de creación embebido (sin salir de ventas), con el código
   * precargado. Al guardar, `handleProductCreatedFromScan` lo agrega al carrito.
   */
  const handleCreateProductFromBarcode = (barcode) => {
    setNotFoundBarcode(null)
    setShowScanner(false)
    setCreateDrawerBarcode(barcode)
  }

  /**
   * Callback invocado por el formulario de creación (vía useCreateProduct)
   * cuando el producto se persiste con éxito. Lo agrega automáticamente al
   * carrito reutilizando `handleAddProduct` de useSales (AC-10), cierra el
   * drawer, reproduce el sonido de éxito y notifica. Guard anti-doble por pId.
   */
  const handleProductCreatedFromScan = (createdProduct) => {
    const pId = createdProduct?.pId
    if (!pId) { return }
    if (createdAddedRef.current.has(String(pId))) { return }
    createdAddedRef.current.add(String(pId))

    if (typeof handleAddProduct === 'function') {
      handleAddProduct(createdProduct)
    }
    playSuccess()
    vibrate(40)
    setCreateDrawerBarcode(null)
    // Abre el modal de ventas y resalta el producto recién creado en el carrito.
    setSalesOpen(true)
    triggerHighlight(pId)
    sendNotification({
      title: 'Producto creado',
      backgroundColor: 'success',
      description: `${createdProduct?.pName ?? 'El producto'} se creó y se agregó al carrito.`
    })
  }

  // Keyboard-wedge scanner support. USB/Bluetooth barcode scanners behave like
  // a keyboard: they "type" the code very fast and send Enter at the end. We
  // buffer rapid keystrokes globally and, on Enter, resolve the product by its
  // barcode and add it to the cart. Typing in an input/textarea is ignored so
  // normal form entry is never hijacked.
  const scanBufferRef = useRef({ chars: '', lastTime: 0 })
  useEffect(() => {
    const INTER_KEY_MS = 50 // scanners emit keys much faster than humans
    const MIN_LENGTH = 6 // ignore short/accidental sequences

    const handleKeyDown = (event) => {
      const target = event.target
      const tag = target?.tagName
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      if (isEditable) { return }

      const now = Date.now()
      const buffer = scanBufferRef.current

      // Reset the buffer if too much time passed since the last key (human typing).
      if (now - buffer.lastTime > INTER_KEY_MS) {
        buffer.chars = ''
      }
      buffer.lastTime = now

      if (event.key === 'Enter') {
        const code = buffer.chars.trim()
        buffer.chars = ''
        if (code.length >= MIN_LENGTH) {
          event.preventDefault()
          // Flujo único: consulta backend, agrega al carrito, sonido y, si no
          // existe, abre el diálogo de creación.
          Promise.resolve(handleScannedCode(code)).catch(() => { })
        }
        return
      }

      // Acepta cualquier carácter ASCII imprimible (dígitos, letras y los
      // símbolos de CODE39: - . $ / + % y espacio). Ignora teclas de control.
      if (event.key.length === 1 && /[\x20-\x7E]/.test(event.key)) {
        buffer.chars += event.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleAddProductByBarcode, playSuccess, playError, dataStore])

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
    handleRemoveExtra,
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
      // Use the unitPrice stored on the cart item, not catalog ProPrice.
      // Catalog ProPrice may differ after a discount is applied.
      const unitPrice = item?.unitPrice ?? item?.ProPrice ?? 0
      setProd({
        ...item,
        ProQuantity: item.ProQuantity + quantityChange,
        ProPrice: Math.max(0, (item.ProQuantity + quantityChange) * unitPrice)
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
      if (typeof error === 'string') {
        return sendNotification({
          message: error,
          title: 'Error',
          backgroundColor: 'error'
        })
      }
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

  const handlePrint = () => {
    console.log('Print function called');
  }

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

  // Selecciona "Efectivo" por defecto en cuanto cargan los métodos de pago y
  // aún no hay ninguno elegido. Esto resalta la tarjeta y, sobre todo, deja
  // `data.payId` poblado para que se envíe correctamente al backend aunque el
  // usuario no toque la selección. Si no existe "Efectivo", cae al primero.
  useEffect(() => {
    if (data?.payId || paymentMethods.length === 0) {
      return
    }
    const defaultMethod =
      paymentMethods.find((method) => {
        return method.name?.toLowerCase().trim() === 'efectivo'
      }) ?? paymentMethods[0]
    if (defaultMethod?.id) {
      dispatch({ type: 'PAYMENT_METHOD', payload: defaultMethod.id })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethodsData, data?.payId])

  const { data: dataFilter, buildVariables } = useFilterConfigs()
  const [activeFilter, setActiveFilter] = useState(0)
  const commentZIndex = useModalLayer(Boolean(openCommentModal))

  /**
   * Aplica los filtros seleccionados en el modal: traduce la selección
   * (groupId → Set de value ids) en variables de la query de productos usando
   * `buildVariables` de useFilterConfigs y las envía a useSales, que re-consulta
   * el listado. Es genérico: cualquier filtro nuevo definido en el backend
   * funciona sin cambios aquí.
   *
   * @param {Record<string, Set<string>>} selection - Selección cruda del viewer.
   */
  const handleApplyFiltersFromModal = (selection) => {
    const variables = buildVariables(selection ?? {})
    handleApplyFilters(variables)
  }

  /**
   * Limpia todos los filtros aplicados y recarga la lista completa.
   */
  const handleClearFiltersFromModal = () => {
    handleClearFilters()
  }

  const filterProps = {
    activeFilter,
    setActiveFilter,
    dataFilter,
    onApplyFilters: handleApplyFiltersFromModal,
    onClearFilters: handleClearFiltersFromModal
  }

  /* =========================================================
   SALES TABLE CONFIGURATION
========================================================= */

  /**
   * Retrieve the effective configuration.
   *
   * Precedence:
   * USER > STORE > APP
   */
  const {
    value: savedSalesDividerPositions,
    loading: loadingSalesDividerPositions,
    error: salesDividerConfigurationError
  } = useGetResolvedConfiguration({
    componentName: SALES_TABLE_CONFIGURATION.componentName,
    key: SALES_TABLE_CONFIGURATION.key,
    defaultValue: DEFAULT_SALES_DIVIDER_POSITIONS
  })
  console.log({savedSalesDividerPositions})
  /**
   * Mutation responsible for persisting configuration.
   */
  const {
    upsertConfiguration
  } = useUpsertConfiguration()

  /**
   * Normalize recovered configuration.
   *
   * If no configuration exists, use the default layout.
   */
  const salesDividerPosition =
    normalizeSalesDividerPositions(
      savedSalesDividerPositions
    ) ?? DEFAULT_SALES_DIVIDER_POSITIONS

  /**
   * Holds the latest resize waiting for persistence.
   */
  const pendingSalesDividerPositionRef =
    useRef < SalesDividerPositions | null > (null)

  /**
   * Debounce timer.
   */
  const salesDividerTimerRef = useRef <
    ReturnType < typeof setTimeout > | null
    > (null)

  /**
   * Persist the latest divider positions.
   *
   * Apollo updates its normalized/resolved cache
   * through useUpsertConfiguration.
   */
  const persistSalesDividerPosition = useCallback(
    async (
      positions: SalesDividerPositions
    ): Promise<void> => {
      try {
        const response = await upsertConfiguration({
          scope: ConfigurationScope.USER,
          componentName: SALES_TABLE_CONFIGURATION.componentName,
          key: SALES_TABLE_CONFIGURATION.key,
          value: positions,
          description: 'Distribución de columnas del módulo de ventas'
        })

        if (!response?.success) {
          sendNotification({
            title: 'Error al guardar la distribución',
            description:
              response?.message ??
              'No fue posible guardar las posiciones de las columnas.',
            backgroundColor: 'error'
          })
        }
      } catch (error) {
        console.error(
          'CreateSales.persistSalesDividerPosition:',
          error
        )

        sendNotification({
          title: 'Error de configuración',
          description:
            error instanceof Error
              ? error.message
              : 'No se pudieron guardar las posiciones del catálogo.',
          backgroundColor: 'error'
        })
      }
    },
    [
      upsertConfiguration,
      sendNotification
    ]
  )

  /**
   * Flush the pending resize immediately.
   *
   * Used when closing the sales modal or unmounting.
   */
  const flushSalesDividerPosition = useCallback(() => {
    if (salesDividerTimerRef.current) {
      clearTimeout(salesDividerTimerRef.current)
      salesDividerTimerRef.current = null
    }

    const pending =
      pendingSalesDividerPositionRef.current

    pendingSalesDividerPositionRef.current = null

    if (pending) {
      void persistSalesDividerPosition(pending)
    }
  }, [persistSalesDividerPosition])

  /**
   * Receives resize events from GenerateSales.
   *
   * Only the latest position is persisted after
   * the user stops resizing for 700ms.
   */
  const handleSalesDividerPositionChange = useCallback(
    (positions: Record<string, number>) => {
      const normalized =
        normalizeSalesDividerPositions(positions)

      if (!normalized) {
        return
      }

      pendingSalesDividerPositionRef.current = normalized

      if (salesDividerTimerRef.current) {
        clearTimeout(salesDividerTimerRef.current)
      }

      salesDividerTimerRef.current = setTimeout(() => {
        salesDividerTimerRef.current = null

        const latest =
          pendingSalesDividerPositionRef.current

        pendingSalesDividerPositionRef.current = null

        if (latest) {
          void persistSalesDividerPosition(latest)
        }
      }, SALES_RESIZE_DEBOUNCE_MS)
    },
    [persistSalesDividerPosition]
  )

  /**
   * Flush when the sales modal closes.
   */
  useEffect(() => {
    if (!show) {
      flushSalesDividerPosition()
    }
  }, [
    show,
    flushSalesDividerPosition
  ])

  /**
   * Flush any pending resize when CreateSales unmounts.
   *
   * Keeping a ref prevents stale callbacks during cleanup.
   */
  const flushSalesDividerPositionRef = useRef(
    flushSalesDividerPosition
  )

  flushSalesDividerPositionRef.current =
    flushSalesDividerPosition

  useEffect(() => {
    return () => {
      flushSalesDividerPositionRef.current()
    }
  }, [])

  /**
   * Configuration query diagnostics.
   */
  useEffect(() => {
    if (salesDividerConfigurationError) {
      console.error(
        'Error loading SalesTable configuration:',
        salesDividerConfigurationError
      )
    }
  }, [salesDividerConfigurationError])


  return (
    <>
      <SuccessSaleModal
        code={code}
        dispatch={dispatch}
        handleCloseModal={handleCloseModal}
        handleDownLoad={handleDownLoad}
        handlePrint={() => {
          return handlePrintSale(code)
        }}
        loading={isPrinting}
        openCurrentSale={saleSuccess}
        products={data?.PRODUCT || []}
        router={router}
        setOpenCurrentSale={setSaleSuccess}
      />

      <ModalSales {...restPropsSalesModal} />
      <FloatingScanButtons
        onOpenBarcodeModal={() => {
          setScannerMode('barcode')
          setShowScanner(true)
        }}
        onOpenQRModal={() => {
          // Escaneo QR real (vía ZXing: imagen + entrada manual). Flujo separado
          // del de barras pero reutilizando el mismo controlador de negocio.
          setScannerMode('qr')
          setShowScanner(true)
        }}
      />
      <ModalScanner
        show={showScanner}
        mode={scannerMode}
        onHide={() => setShowScanner(false)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onScan={(code) => {
          Promise.resolve(handleScannedCode(code)).catch(() => { })
        }}
      />
      <ProductNotFoundDialog
        show={Boolean(notFoundBarcode)}
        barcode={notFoundBarcode ?? ''}
        onConfirmCreate={handleCreateProductFromBarcode}
        onCancel={() => setNotFoundBarcode(null)}
      />
      <CreateProductDrawer
        show={Boolean(createDrawerBarcode)}
        barcode={createDrawerBarcode ?? ''}
        onClose={() => setCreateDrawerBarcode(null)}
        onProductCreated={handleProductCreatedFromScan}
      />
      <GenerateSalesPkg
        // Guardar una venta pendiente.
        handleSavePendingOrder={(details) => handleSavePendingOrder(details)}

        // Datos que se mostrarán en el listado.
        pendingOrders={activePendingOrders}
        pendingOrdersCount={pendingOrdersCount}
        totalStoredOrdersCount={pendingOrders.length}
        isPendingOrdersReady={isPendingOrdersReady}
        canPersistPendingOrders={canPersistPendingOrders}

        // Acciones disponibles sobre cada orden.
        handleResumePendingOrder={handleResumePendingOrder}
        handleRemovePendingOrder={removePendingOrder}
        handleUpdatePendingOrder={updatePendingOrder}
        handleUpdatePendingStatus={updatePendingStatus}
        handleClearPendingOrders={clearPendingOrders}
        handlePersistPendingOrder={persistPendingOrder}
        searchPendingOrders={searchPendingOrders}
        client={client}
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
        sendNotification={sendNotification}
        highlightedPid={highlightedPid ?? ''}
        dividerPosition={salesDividerPosition}
        dividerPositionLoading={loadingSalesDividerPositions}
        onDividerPositionChange={handleSalesDividerPositionChange}
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
        zIndex={commentZIndex}
        sendNotification={sendNotification}
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
            {existComment && (
              <Button
                onClick={() =>
                  handleRemoveValue({
                    name: 'comment',
                    pId: oneProductToComment?.pId
                  })
                }
              >
                Eliminar
              </Button>
            )}

            <Button
              primary
              disabled={!values.comment}
              onClick={() =>
                dispatch({
                  type: 'PUT_COMMENT',
                  payload: oneProductToComment?.pId
                })
              }
              styles={{
                width: !existComment ? '100%' : 'min-content'
              }}
            >
              {existComment ? 'Actualizar' : 'Dejar comentario'}
            </Button>
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