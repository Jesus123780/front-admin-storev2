'use client'

import { useApolloClient } from '@apollo/client'
import { useRouter } from 'next/navigation'
import {
  ConfigurationScope,
  useAmountInput,
  useFilterConfigs,
  useGetAllPaymentMethods,
  useGetClients,
  useGetResolvedConfiguration,
  usePrintSaleTicket,
  usePushNotifications,
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
  Checkbox,
  Column,
  Divider,
  FloatingScanButtons,
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
  useMemo,
  useRef,
  useState
} from 'react'

import { MENU_OPTIONS } from '@/context/helpers'

import { Context } from '../../../context/Context'
import { ModalScanner } from '../../ModalScanner'
import { CashPOSPanel } from './CashPOSPanel'
import { CashRealtimeStatus } from './CashRealtimeStatus'
import { resolveCheckoutAction } from './checkout-action'
import {
  getAsideVisibility, resolveAsideRequest, shouldOpenRecoveryAside
} from './checkout-visibility'
import { CreateProductDrawer } from './CreateProductDrawer'
import { DeliveryCheckoutPanel } from './DeliveryCheckoutPanel'
import { useModalLayer } from './modalLayers'
import { ModalSales } from './ModalSales'
import { PaymentSetupNotice } from './PaymentSetupNotice'
import { ProductNotFoundDialog } from './ProductNotFoundDialog'
import { buildPreviewReceipt, formatReceiptMoney } from './receipt/financial-receipt'
import { GET_CONFIRMED_RECEIPT } from './receipt/queries'
import { createInvoiceSnapshot } from './sale-invoice-snapshot'
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
  let candidate = value

  // Algunas configuraciones pueden llegar serializadas como JSON.
  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate)
    } catch {
      return null
    }
  }

  if (
    !candidate ||
    typeof candidate !== 'object' ||
    Array.isArray(candidate)
  ) {
    return null
  }

  const entries = Object.entries(
    candidate as Record<string, unknown>
  )

  if (!entries.length) {
    return null
  }

  const result: SalesDividerPositions = {}

  for (const [key, rawPosition] of entries) {
    if (
      rawPosition === null ||
      rawPosition === undefined ||
      rawPosition === ''
    ) {
      return null
    }

    const position = Number(rawPosition)

    if (
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
    setSalesOpen,
    handleClick
  } = useContext(Context)

  // Explicit, app-owned signal for the post-sale success UX. Decoupled from the
  // hook's internal `openCurrentSale` so the Success modal has a single source
  // of truth and no competing states.
  const [saleSuccess, setSaleSuccess] = useState(false)
  const [openAside, setOpenAside] = useState(false)
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null)
  const [previewDate, setPreviewDate] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpeningCash, setIsOpeningCash] = useState(false)
  const [isRecoveringPayment, setIsRecoveringPayment] = useState(false)
  const recoveryLockRef = useRef(false)
  const submitLockRef = useRef(false)
  const completedCheckoutRef = useRef(false)
  const printLockRef = useRef(false)
  const downloadLockRef = useRef(false)
  const [dataClientes, { loading: loadingClients }] = useGetClients()
  const [fetchMoreLoader, setFetchMoreLoader] = useState(false)
  const fetchMoreLockRef = useRef(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const componentRef = useRef<HTMLDivElement | null>(null)
  const promiseResolveRef = useRef<(() => void) | null>(null)
  const router = useRouter()
  const apollo = useApolloClient()
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
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const highlightFrameRef = useRef<number | null>(null)
  // Retroalimentación sonora/vibración del escaneo (Web Audio API).
  const {
    soundEnabled,
    toggleSound,
    playSuccess,
    playError,
    vibrate
  } = useScanFeedback()

  // Keep one local notification per confirmed sale. Remote push is a separate
  // integration; sending both here could duplicate the notification.
  const { onClickShowLocalNotification } = usePushNotifications()
  const notifiedSaleCodesRef = useRef(new Set<string>())
  const notifyNewSaleRef = useRef<(saleCode: string) => void>(() => { })
  useEffect(() => {
    notifyNewSaleRef.current = (saleCode) => {
      const seen = notifiedSaleCodesRef.current
      if (!saleCode || seen.has(saleCode)) { return }
      seen.add(saleCode)
      if (seen.size > 256) {
        const first = seen.values().next().value
        if (first !== undefined) { seen.delete(first) }
      }
      void Promise.resolve().then(() => onClickShowLocalNotification({
        title: 'Nueva venta',
        description: `Venta ${saleCode}`,
        url: `/orders/${encodeURIComponent(saleCode)}`,
        tag: `sale-${saleCode}`
      })).catch(() => {
        // Notification failure must never change the outcome of a confirmed sale.
      })
    }
  }, [onClickShowLocalNotification])

  const onCloseModalSale = () => {
    setOpenAside(false)
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
    handleSubmit: submitSale,
    loading,
    modalItem,
    oneProductToComment,
    handleAddAllProductsToCart,
    openCommentModal,
    handleRemoveValue,
    print,
    product,
    discount,
    discountableSubtotal,
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
    paymentKind,
    cashCheckout,
    cartIntegrity,
    paymentMethodIssue,
    paymentConfirmationBlocker,
    checkoutAmountIssue,
    checkoutPaymentMethods,
    cashSessionPaymentPolicy,
    sessionPaymentSelection,
    deliveryCheckout,
    handleCashReceivedChange,
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
    handleSavePendingOrder,

    // Filtros del modal (reusables): traducen la selección a variables de la
    // query de productos y re-consultan el listado.
    handleApplyFilters,
    handleClearFilters,

    // Estado de las órdenes.
    pendingOrders,
    activePendingOrders,
    pendingOrdersCount,
    isPendingOrdersReady,
    canPersistPendingOrders,

    // Acciones.
    handleResumePendingOrder,
    removePendingOrder,
    updatePendingOrder,
    updatePendingStatus,
    clearPendingOrders,
    persistPendingOrder,
    searchPendingOrders,
    cashControl,
    paymentConfirmed,
    paymentConfirmationReady,
    confirmCurrentPayment,
    pendingCashReference,
    cashStorageIssue,
    cashOperationLocked,
    recoveringCash,
    resolvePendingCashReference,
    retryPendingCashSale,
    canRetryPendingCashSale
  } = useSales({
    automaticCashChange: true,
    deliveryCheckoutEnabled: true,
    cashManagementEnabled: true,
    cashPollingEnabled: false,
    disabled: false,
    router,
    sendNotification,
    setAlertBox,
    setSalesOpen: onCloseModalSale,
    onSaleSuccess: (payload) => {
      const saleCode = typeof payload?.code === 'string' ? payload.code.trim() : ''
      if (!saleCode || completedCheckoutRef.current) { return }
      completedCheckoutRef.current = true
      // Normal confirmation and verified recovery share this terminal transition.
      setOpenAside(false)
      setPreviewDate(null)

      // The backend confirmed the sale; downloads will read its immutable financial record.
      setConfirmedCode(saleCode)
      setSaleSuccess(true)
      notifyNewSaleRef.current(saleCode)
    }
  })

  const previewInput = useMemo(() => ({
    cart: data.PRODUCT ?? [], discountType: data.discountType,
    discountPercent: data.discountPercent, discountAmount: data.discountAmount,
    quote: deliveryCheckout?.quote ?? null, quoteReady: deliveryCheckout?.ready === true,
    cash: cashCheckout, paymentMethod: '', paymentKind
  }), [data.PRODUCT, data.discountType, data.discountPercent, data.discountAmount, deliveryCheckout?.quote, deliveryCheckout?.ready, cashCheckout, paymentKind])

  const client = useMemo(() => {
    const clients = Array.isArray(dataClientes) ? dataClientes : []
    return clients.find(item => item?.cliId === values?.cliId && Boolean(values?.cliId)) ?? {
      clientName: '', ccClient: '', ClientAddress: '', clientNumber: ''
    }
  }, [dataClientes, values?.cliId])

  // Limpia el temporizador del resaltado al desmontar para evitar fugas.
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) { clearTimeout(highlightTimerRef.current) }
      if (highlightFrameRef.current !== null) { cancelAnimationFrame(highlightFrameRef.current) }
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
    if (highlightFrameRef.current !== null) { cancelAnimationFrame(highlightFrameRef.current) }
    highlightFrameRef.current = requestAnimationFrame(() => {
      highlightFrameRef.current = null
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
    if (submitLockRef.current || cashOperationLocked || isOpeningCash || saleSuccess || print) { return }
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
  const scannedCodeRef = useRef(handleScannedCode)
  useEffect(() => { scannedCodeRef.current = handleScannedCode }, [handleScannedCode])
  useEffect(() => {
    const INTER_KEY_MS = 50 // scanners emit keys much faster than humans
    const MIN_LENGTH = 6 // ignore short/accidental sequences

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const tag = target?.tagName
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      if (isEditable || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
        scanBufferRef.current = { chars: '', lastTime: 0 }
        return
      }
      if (event.repeat) { return }

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
          Promise.resolve(scannedCodeRef.current(code)).catch(() => { })
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
  }, [])

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
    product: getProductById(product?.PRODUCT?.pId) ?? product?.PRODUCT,
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

  function updateProductQuantity(quantityChange: number) {
    const item = getProductById(product?.PRODUCT?.pId)
    if (!item) { return }
    // The reducer is the source of truth for stock, totals and courtesy flags.
    if (quantityChange < 0) {
      dispatch({ type: 'REMOVE_PRODUCT', payload: item })
      if (Number(item.ProQuantity) === 1) {
        setModalItem(false)
        setProduct({ PRODUCT: { pId: null } })
      }
    } else if (quantityChange > 0 && product?.PRODUCT) {
      dispatch({ type: 'ADD_TO_CART', payload: product.PRODUCT })
    }
  }

  function getProductById(pId: string | null | undefined) {
    if (!pId) { return undefined }
    return data?.PRODUCT?.find(item => item.pId === pId)
  }

  const handleSubmit = async () => {
    if (submitLockRef.current || loadingRegisterSale || cashOperationLocked || isOpeningCash || saleSuccess || completedCheckoutRef.current) { return }
    if (!data?.PRODUCT?.length) {
      sendNotification({ title: 'Carrito vacío', description: 'Agrega al menos un producto.', backgroundColor: 'warning' })
      return
    }
    if (!data?.payId) {
      sendNotification({ title: 'Método de pago', description: 'Selecciona un método de pago.', backgroundColor: 'warning' })
      return
    }
    if (!cashCheckout?.canSubmit) {
      sendNotification({ title: 'Verifica el cobro', description: cashCheckout?.message || 'Completa los datos del pago.', backgroundColor: 'warning' })
      return
    }
    submitLockRef.current = true
    setIsSubmitting(true)
    try {
      const preview = buildPreviewReceipt(previewInput)
      if (!preview.canConfirm) { throw new Error('La cotización o el checkout no está listo') }
      await submitSale()
    } catch (error) {
      sendNotification({ title: 'Verifica el cobro', description: error instanceof Error ? error.message : 'No fue posible completar la venta.', backgroundColor: 'warning' })
    } finally {
      submitLockRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleDownLoad = async () => {
    if (downloadLockRef.current || !confirmedCode || !dataStore?.idStore) { return }
    downloadLockRef.current = true
    try {
      const reference = confirmedCode
      const { data: result } = await apollo.query({ query: GET_CONFIRMED_RECEIPT, variables: { pCodeRef: reference }, fetchPolicy: 'no-cache', context: { queryDeduplication: false } })
      const response = result?.getOneSalesStore
      if (!response?.success || !response.data) { throw new Error(response?.message || 'No se pudo consultar la venta') }
      const invoice = createInvoiceSnapshot(response.data, reference, dataStore.idStore)
      const { downloadConfirmedReceipt } = await import('./receipt/download-pdf')
      await downloadConfirmedReceipt(invoice)
    } catch (error) {
      sendNotification({ title: 'Comprobante no disponible', description: error instanceof Error ? error.message : 'Consulta el detalle de la venta registrada.', backgroundColor: 'warning' })
    } finally { downloadLockRef.current = false }
  }

  const existComment = Boolean(oneProductToComment?.comment?.length)

  const handleCloseModal = () => {
    if (submitLockRef.current || loadingRegisterSale || pendingCashReference || cashStorageIssue || isOpeningCash) {
      sendNotification({ title: 'Operación pendiente', backgroundColor: 'warning', description: 'Termina la apertura o verifica el cobro antes de cerrar la venta.' })
      return false
    }
    dispatch({ type: 'REMOVE_ALL_PRODUCTS' })
    setValues({})
    setPreviewDate(null)
    onCloseModalSale()
    return true
  }

  const isLoading = loadingRegisterSale || loading || isSubmitting || isPrinting

  const fetchMoreProducts = async () => {
    if (fetchMoreLockRef.current || !productsFood?.length) { return }
    fetchMoreLockRef.current = true
    setFetchMoreLoader(true)
    const nextMax = showMore + 100
    try {
      await fetchMore({
        variables: { max: nextMax, min: 0 },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          const incoming = fetchMoreResult?.productFoodsAll ?? []
          if (!incoming.length) { return previousResult }
          const existing = previousResult?.productFoodsAll ?? []
          const seen = new Set(existing.map(item => item.pId))
          const additions = incoming.filter(item => {
            if (seen.has(item.pId)) { return false }
            seen.add(item.pId)
            return true
          })
          return { ...previousResult, ...fetchMoreResult, productFoodsAll: [...existing, ...additions] }
        }
      })
      setShowMore(nextMax)
    } catch {
      sendNotification({ title: 'Error al cargar productos', description: 'Intenta nuevamente.', backgroundColor: 'error' })
    } finally {
      fetchMoreLockRef.current = false
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
    setModalItem(true)
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
  // Existing buttons call without a boolean (or pass a click event).
  // AsideSales explicitly requests false; a repeated close cannot reopen it.
  const handleOpenAside = (requested?: unknown) => {
    const blocked = !show || print || saleSuccess
    const closeLocked = Boolean(isOpeningCash || pendingCashReference || cashStorageIssue || submitLockRef.current || loadingRegisterSale || recoveringCash || isRecoveringPayment)
    setOpenAside(previous => resolveAsideRequest(previous, requested, blocked, closeLocked))
  }
  const [handlePrintSale] = usePrintSaleTicket()
  const handlePrint = async () => {
    if (!confirmedCode || printLockRef.current) { return }
    printLockRef.current = true
    setIsPrinting(true)
    try {
      if (typeof handlePrintSale !== 'function') { throw new Error('Servicio de impresión no disponible') }
      const result = await handlePrintSale(confirmedCode)
      sendNotification({
        title: result?.success ? 'Impresión enviada' : 'Error al imprimir',
        description: result?.message ?? 'No se pudo enviar el comprobante a la impresora.',
        backgroundColor: result?.success ? 'success' : 'error'
      })
    } catch {
      sendNotification({ title: 'Error al imprimir', description: 'No se pudo enviar el comprobante a la impresora.', backgroundColor: 'error' })
    } finally {
      printLockRef.current = false
      setIsPrinting(false)
    }
  }
  const { data: paymentMethodsData } = useGetAllPaymentMethods()

  const legacyPaymentMethods = useMemo(() => (paymentMethodsData ?? []).map(method => ({
    id: method.payId,
    name: method.name,
    icon: method.icon
  })), [paymentMethodsData])

  const paymentMethods = checkoutPaymentMethods ?? legacyPaymentMethods

  // Selecciona "Efectivo" por defecto en cuanto cargan los métodos de pago y
  // aún no hay ninguno elegido. Esto resalta la tarjeta y, sobre todo, deja
  // `data.payId` poblado para que se envíe correctamente al backend aunque el
  // usuario no toque la selección. Si no existe "Efectivo", cae al primero.
  useEffect(() => {
    if (!cashControl.known || data?.payId || paymentMethods.length === 0) {
      return
    }
    const available = cashControl.enabled ? paymentMethods.filter(m => cashControl.methods.some(x => x.payId === m.id && x.state === 'active' && x.financialKind !== 'UNKNOWN')) : paymentMethods
    const defaultMethod =
      available.find((method) => {
        return cashControl.enabled ? cashControl.methods.some(m => m.payId === method.id && m.financialKind === 'CASH') : method.name?.toLowerCase().trim() === 'efectivo'
      }) ?? available[0]
    if (defaultMethod?.id) {
      dispatch({ type: 'PAYMENT_METHOD', payload: defaultMethod.id })
    }
  }, [paymentMethods, data?.payId, dispatch, cashControl.enabled, cashControl.known, cashControl.methods])

  const handleOpenSalePreview = () => {
    if (!show || print || submitLockRef.current || loadingRegisterSale || cashOperationLocked || isOpeningCash || saleSuccess) { return false }
    if (!cashCheckout?.canSubmit) {
      sendNotification({ title: 'Verifica el cobro', description: cashCheckout?.message || 'Completa los datos del pago.', backgroundColor: 'warning' })
      return false
    }
    completedCheckoutRef.current = false
    setOpenAside(false)
    setPreviewDate(Date.now())
    setPrint()
    return true
  }

  const handleCloseSalePreview = () => {
    if (!print || submitLockRef.current || loadingRegisterSale || recoveringCash) { return }
    setPrint()
    setPreviewDate(null)
  }

  const paymentBusy = isSubmitting || loadingRegisterSale || isRecoveringPayment || recoveringCash
  const pendingRecovery = Boolean(pendingCashReference || cashStorageIssue)
  const handleRecoverPayment = async (retry = false) => {
    if (recoveryLockRef.current || paymentBusy) { return }
    if (!retry && !window.confirm('Si se encuentra evidencia del cobro original, se recuperará el comprobante y se limpiará el carrito actual. ¿Continuar?')) { return }
    recoveryLockRef.current = true
    setIsRecoveringPayment(true)
    try {
      if (retry) { await retryPendingCashSale() }
      else { await resolvePendingCashReference() }
    } catch (e) {
      sendNotification({ title: 'Revisión de cobro', backgroundColor: 'warning', description: e instanceof Error ? e.message : 'No fue posible verificar el cobro.' })
    } finally { recoveryLockRef.current = false; setIsRecoveringPayment(false) }
  }
  // Recover inside the existing checkout; the panel must not be rendered in the printable receipt.
  const recoverySection = pendingRecovery ? <section role='status' style={{ padding: 12, border: '1px solid var(--color-border,#ddd)', borderRadius: 8 }}>
    <strong>{pendingCashReference ? `Cobro pendiente: ${pendingCashReference}` : 'Revisión de caja requerida'}</strong>
    <p>{cashStorageIssue || 'No vuelvas a cobrar. Verifica la venta original antes de continuar.'}</p>
    {pendingCashReference && <>
      <Button disabled={paymentBusy} onClick={() => void handleRecoverPayment(false)}>Verificar cobro anterior</Button>
      {canRetryPendingCashSale && <Button disabled={paymentBusy} onClick={() => void handleRecoverPayment(true)}>Reintentar el mismo registro</Button>}
    </>}
  </section> : null
  const paymentConfirmation = cashControl.enabled && cashCheckout?.hasItems ? (
    <Checkbox
      checked={paymentConfirmed}
      disabled={!paymentConfirmationReady || paymentBusy || isOpeningCash || pendingRecovery}
      id='_verify_payment'
      label={cashCheckout.amountsValid && cashCheckout.total === 0 ? 'Confirmo la venta sin cobro.' : 'Confirmo que recibí el pago.'}
      name='_verify_payment'
      onChange={e => confirmCurrentPayment(e.target.checked)}
    />
  ) : null
  // Checkout controls have independent slots: confirmation must never be inside a disclosure.
  const cashSection = (!cashControl.known || cashControl.enabled) ? (
    <>
      <CashRealtimeStatus connection={cashControl.connection} />
      <CashPOSPanel control={cashControl} disabled={paymentBusy || pendingRecovery} onOpeningChange={setIsOpeningCash} />
    </>
  ) : null
  const cashSectionSummary = !cashControl.known ? 'Consultando…'
    : cashControl.session?.status === 'OPEN' ? 'Caja abierta' : 'Requiere revisión'
  const deliverySection = <DeliveryCheckoutPanel checkout={deliveryCheckout} disabled={paymentBusy || pendingRecovery || isOpeningCash} />
  const accountingSummary = cashCheckout?.amountsValid && cashCheckout.hasItems && cartIntegrity?.valid
    ? { gross: cartIntegrity.gross, discount: cartIntegrity.discount, net: cartIntegrity.net }
    : undefined
  // Presentation hints never replace the hook's financial gate.
  const requiredAction = resolveCheckoutAction({
    busy: paymentBusy || isOpeningCash,
    pendingRecovery, recoveryMessage: cashStorageIssue,
    hasItems: Boolean(cashCheckout?.hasItems), canSubmit: Boolean(cashCheckout?.canSubmit),
    cashKnown: cashControl.known, cashBlocker: cashControl.blocking,
    methodIssue: paymentMethodIssue, paymentKind,
    deliveryReady: deliveryCheckout.ready, deliveryIssue: deliveryCheckout.blockingMessage,
    amountIssue: checkoutAmountIssue, cartValid: cartIntegrity?.valid !== false,
    amountsValid: Boolean(cashCheckout?.amountsValid), total: cashCheckout?.total ?? 0,
    received: cashCheckout?.received ?? null, missing: cashCheckout?.missing ?? 0,
    confirmationReady: paymentConfirmationReady, confirmed: paymentConfirmed,
    message: paymentConfirmationBlocker || cashCheckout?.message || ''
  })
  // The marker is written BEFORE the mutation; it is not by itself evidence
  // of an uncertain payment. Only offer recovery once the attempt has ended.
  const asideVisible = getAsideVisibility({ openAside, show, print, saleSuccess })
  useEffect(() => {
    if (!show || saleSuccess) {
      setOpenAside(false)
      return
    }
    if (shouldOpenRecoveryAside({
      show, print, saleSuccess, pendingRecovery,
      busy: paymentBusy || isOpeningCash || submitLockRef.current || recoveryLockRef.current
    })) {
      setOpenAside(true)
    }
  }, [pendingRecovery, show, print, saleSuccess, paymentBusy, isOpeningCash])

  const restPropsSalesModal = {
    code: null, // Sale reference is generated by useSales on submission. Never reuse the previous sale's code.
    saleDate: previewDate,
    data,
    paymentMethod: paymentMethods.find(method => method.id === data?.payId)?.name ?? 'Sin seleccionar',
    paymentKind,
    cashCheckout,
    previewInput: { ...previewInput, paymentMethod: paymentMethods.find(method => method.id === data?.payId)?.name ?? 'Sin seleccionar' },
    deliverySection: <DeliveryCheckoutPanel checkout={deliveryCheckout} disabled={paymentBusy || pendingRecovery || isOpeningCash} compact />,
    recoverySection,
    paymentConfirmationSection: paymentConfirmation ? (
      <Checkbox
        checked={paymentConfirmed}
        disabled={!paymentConfirmationReady || paymentBusy || isOpeningCash || pendingRecovery}
        id='_verify_payment_preview'
        name='_verify_payment_preview'
        label={cashCheckout.amountsValid && cashCheckout.total === 0 ? 'Confirmo la venta sin cobro.' : 'Confirmo que recibí el pago.'}
        onChange={e => confirmCurrentPayment(e.target.checked)}
      />
    ) : null,
    paymentBusy: paymentBusy || isOpeningCash,
    pendingRecovery,
    requiredAction,
    onCashReceivedChange: handleCashReceivedChange,
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
    isPrinting: false, // Server-side thermal printing does not use the DOM print handshake.
    dataClientes,
    setPrint: handleCloseSalePreview,
    loading: loading || paymentBusy,
    handleSubmit,
    handleDownLoad
  }

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

  /* Sales table configuration: USER > STORE > APP */
  const {
    value: savedSalesDividerPositions,
    loading: loadingSalesDividerPositions,
    error: salesDividerConfigurationError
  } = useGetResolvedConfiguration({
    componentName: SALES_TABLE_CONFIGURATION.componentName,
    key: SALES_TABLE_CONFIGURATION.key,
    defaultValue: DEFAULT_SALES_DIVIDER_POSITIONS
  })

  const salesDividerPosition = useMemo(
    () => normalizeSalesDividerPositions(savedSalesDividerPositions) ?? DEFAULT_SALES_DIVIDER_POSITIONS,
    [savedSalesDividerPositions]
  )

  /**
   * Mutation responsible for persisting configuration.
   */
  const {
    upsertConfiguration
  } = useUpsertConfiguration()

  /**
   * Holds the latest resize waiting for persistence.
   */
  const pendingSalesDividerPositionRef =
    useRef<SalesDividerPositions | null>(null)

  /**
   * Debounce timer.
   */
  const salesDividerTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null)

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


  const handleRedirectCreateProduct = () => {
    if (cashOperationLocked || isOpeningCash) { return }
    setSalesOpen(false)
    handleClick(MENU_OPTIONS.CREATE_PRODUCTS)

  }
  return (
    <>
      <SuccessSaleModal
        code={confirmedCode ?? ''}
        dispatch={dispatch}
        handleCloseModal={handleCloseModal}
        handleDownLoad={handleDownLoad}
        handlePrint={handlePrint}
        openCurrentSale={saleSuccess}
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
        handleSave={handleOpenSalePreview}
        isLoading={isLoading}
        isSubmittingSale={paymentBusy || pendingRecovery || isOpeningCash}
        loadingClients={loadingClients}
        loadingProduct={loading || fetchMoreLoader}
        numberFormat={numberFormat}
        onClick={(producto) => {
          return selectProduct(producto)
        }}
        openAside={asideVisible}
        pagination={pagination}
        paymentMethods={paymentMethods}
        paymentSettingsSection={
          <PaymentSetupNotice
            cashEnabled={cashControl.enabled}
            cashKnown={cashControl.known}
            sessionOpen={cashControl.session?.status === 'OPEN'}
            policyLoading={cashSessionPaymentPolicy.loading}
            policyError={Boolean(cashSessionPaymentPolicy.error)}
            configured={sessionPaymentSelection.configured}
            legacy={sessionPaymentSelection.legacy}
            availableCount={paymentMethods.length}
            unclassifiedCount={cashControl.methods.filter(m => m.financialKind === 'UNKNOWN' && m.state === 'active').length}
            issue={sessionPaymentSelection.issue}
          />
        }
        paymentKind={paymentKind}
        deliverySection={deliverySection}
        deliverySectionSummary={deliveryCheckout.ready ? 'Configurada' : 'Configurar'}
        deliverySectionRequired={Boolean(data?.PRODUCT?.length) && !deliveryCheckout.ready}
        cashSection={cashSection}
        cashSectionSummary={cashSectionSummary}
        cashSectionRequired={!cashControl.known || Boolean(cashControl.blocking)}
        recoverySection={recoverySection}
        paymentConfirmationSection={paymentConfirmation}
        accountingSummary={accountingSummary}
        requiredAction={requiredAction}
        checkoutBlocker={requiredAction?.message || cashCheckout?.message}
        onReturnToCart={() => handleOpenAside(false)}
        cashCheckout={cashCheckout}
        onCashReceivedChange={handleCashReceivedChange}
        productsFood={productsFood}
        propsSliderCategory={restPropsSliderCategory}
        setShow={(show) => {
          if (show === false && !handleCloseModal()) { return }
          setShow(show)
        }}
        show={show}
        storeTables={storeTables}
        discountableSubtotal={discountableSubtotal}
        totalProductPrice={formatReceiptMoney(totalProductPrice)}
        useAmountInput={useAmountInput}
        values={values}
        handleAddAllProductsToCart={handleAddAllProductsToCart}
        sendNotification={sendNotification}
        highlightedPid={highlightedPid ?? ''}
        dividerPosition={salesDividerPosition}
        dividerPositionLoading={loadingSalesDividerPositions}
        onDividerPositionChange={handleSalesDividerPositionChange}
        handleRedirectCreateProduct={handleRedirectCreateProduct}
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
            ProDescription={oneProductToComment?.ProDescription}
            ProDescuento={oneProductToComment?.ProDescuento}
            ProImage={oneProductToComment?.ProImage}
            ProPrice={oneProductToComment?.ProPrice}
            ProQuantity={oneProductToComment?.ProQuantity}
            ValueDelivery={oneProductToComment?.ValueDelivery}
            comment={false}
            edit={false}
            key={oneProductToComment?.pId}
            pName={oneProductToComment?.pName}
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
              disabled={!values.comment || !oneProductToComment?.pId}
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
