
'use client'

import {
  usePathname,
  useRouter,
  useSearchParams
} from 'next/navigation'
import { useTheme } from 'npm-pkg-hook'
import { ContainerToastProps } from 'pkg-components/stories/molecules/AlertBox/types'
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { MENU_OPTIONS } from './helpers'

/**
 * Toast message structure.
 */
export type ToastMessage = {
  id: string
  title?: string
  description?: string
  backgroundColor?: string

  position?:
    | 'bottom-left'
    | 'bottom-right'
    | 'top-left'
    | 'top-right'
    | string
    | null

  /**
   * Creation timestamp used for deterministic
   * auto-delete orchestration.
   */
  createdAt?: number

  /**
   * Monotonic appearance order.
   */
  sequence?: number
}

/**
 * Context state shape.
 */
export interface AppContextState {
  authData: { isSession?: unknown }
  isElectron: boolean
  collapsed: boolean
  countPedido: number
  error: ContainerToastProps | null
  hidden: boolean
  isSession: unknown
  menu: number | false
  messagesToast: ToastMessage[]
  salesOpen: boolean
  selectedStore: unknown | null
  isOpenOrder: boolean
  show: number | false | null
  showModalComponent: number | false
  status: string
  modalsLector: number | boolean

  theme?: unknown
  toggleTheme?: () => void
  initTheme?: () => void

  handleClick: (index: number) => void
  handleMenu: (index: number | false) => void
  toggleModal: (index: number) => void
  sendNotification: (
    opts?: Partial<ToastMessage>
  ) => void

  setIsOpenOrder: Dispatch<SetStateAction<boolean>>
  setCollapsed: Dispatch<SetStateAction<boolean>>
  setCountPedido: Dispatch<SetStateAction<number>>
  setHidden: Dispatch<SetStateAction<boolean>>
  setIsSession: Dispatch<SetStateAction<unknown>>
  setMessagesToast: Dispatch<SetStateAction<ToastMessage[]>>
  setSalesOpen: (value?: boolean) => void
  setSelectedStore: Dispatch<SetStateAction<unknown | null>>
  setShowComponentModal: (index: number) => void
  setStatus: Dispatch<SetStateAction<string>>
  deleteToast: (id: string) => void
  setAlertBox: (err: ContainerToastProps | null) => void
}

/**
 * Default initial context.
 */
const initialStateContext: AppContextState = {
  authData: {},
  collapsed: false,
  countPedido: 0,
  error: null,
  hidden: false,
  isElectron: false,
  isOpenOrder: false,
  isSession: null,
  menu: 0,
  messagesToast: [],
  modalsLector: false,
  salesOpen: false,
  selectedStore: null,
  show: null,
  showModalComponent: Object.values(MENU_OPTIONS)[0] as number | false,
  status: 'close',

  handleClick: () => {},
  handleMenu: () => {},
  toggleModal: () => {},
  sendNotification: () => {},

  setIsOpenOrder: (() => {}) as Dispatch<
    SetStateAction<boolean>
  >,

  setCollapsed: (() => {}) as Dispatch<
    SetStateAction<boolean>
  >,

  setCountPedido: (() => {}) as Dispatch<
    SetStateAction<number>
  >,

  setHidden: (() => {}) as Dispatch<
    SetStateAction<boolean>
  >,

  setIsSession: (() => {}) as Dispatch<
    SetStateAction<unknown>
  >,

  setMessagesToast: (() => {}) as Dispatch<
    SetStateAction<ToastMessage[]>
  >,

  setSalesOpen: () => {},

  setSelectedStore: (() => {}) as Dispatch<
    SetStateAction<unknown | null>
  >,

  setShowComponentModal: () => {},

  setStatus: (() => {}) as Dispatch<
    SetStateAction<string>
  >,

  deleteToast: () => {},

  setAlertBox: () => {}
}

export const Context = createContext<AppContextState>(
  initialStateContext
)

interface ProviderProps {
  children: React.ReactNode
}

/**
 * Application provider.
 *
 * @param props Provider properties.
 * @param props.children React children.
 * @returns Provider tree.
 */
const Provider = ({ children }: ProviderProps) => {
  const {
    toggleTheme,
    initTheme,
    theme
  } = useTheme()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [
    isOpenOrder,
    setIsOpenOrder
  ] = useState<boolean>(false)

  const [
    collapsed,
    setCollapsed
  ] = useState<boolean>(false)

  const [
    countPedido,
    setCountPedido
  ] = useState<number>(0)

  const [
    error,
    setError
  ] = useState<ContainerToastProps | null>(null)

  const [
    hidden,
    setHidden
  ] = useState<boolean>(false)

  const [
    isSession,
    setIsSession
  ] = useState<unknown>(null)

  const [
    menu,
    setMenu
  ] = useState<number | false>(0)

  const [
    messagesToast,
    setMessagesToast
  ] = useState<ToastMessage[]>([])

  const [
    salesOpen,
    setSalesOpenModal
  ] = useState<boolean>(false)

  const [
    selectedStore,
    setSelectedStore
  ] = useState<unknown | null>(null)

  const [
    show,
    setShow
  ] = useState<number | false | null>(null)

  const [
    showModalComponent,
    setShowComponentModal
  ] = useState<number | false>(false)

  const [
    status,
    setStatus
  ] = useState<string>('close')

  const [
    modalsLector,
    setModalsLector
  ] = useState<boolean | number>(false)

  const [
    isElectron,
    setIsElectron
  ] = useState<boolean>(false)

  /**
   * Global monotonic toast sequence.
   *
   * This value must not be derived from array length because
   * the array can be capped and items can be removed.
   */
  const toastSequenceRef = useRef<number>(0)

  /**
   * Electron detection.
   */
  useEffect(() => {
    if (
      typeof globalThis.window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      /Electron/.test(navigator.userAgent)
    ) {
      setIsElectron(true)
    } else {
      setIsElectron(false)
    }
  }, [])

  /**
   * Initializes application theme once.
   */
  useEffect(() => {
    initTheme?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Auth state.
   */
  const authData = useMemo(
    () => ({
      isSession
    }),
    [isSession]
  )

  /**
   * Toggles QR/barcode modals.
   *
   * @param index Modal identifier.
   */
  const toggleModal = useCallback(
    (index: number) => {
      setModalsLector((previous) =>
        previous === index ? false : index
      )
    },
    []
  )

  /**
   * Toggles component modal.
   *
   * @param index Modal identifier.
   */
  const handleMenuLateral = useCallback(
    (index: number) => {
      setShowComponentModal((previous) =>
        previous === index ? false : index
      )
    },
    []
  )

  /**
   * Handles general section clicks.
   *
   * @param index Section index.
   */
  const handleClick = useCallback(
    (index: number) => {
      const food = searchParams?.get?.('food')

      if (food) {
        const newParams = new URLSearchParams(
          searchParams.toString()
        )

        newParams.delete('food')

        const queryStr = newParams.toString()

        const url = queryStr
          ? `${pathname}?${queryStr}`
          : pathname || '/'

        router.push(url)
      }

      setShow((previous) =>
        previous === index ? false : index
      )
    },
    [pathname, router, searchParams]
  )

  /**
   * Deletes toast by id.
   *
   * @param id Toast identifier.
   */
  const deleteToast = useCallback(
    (id: string) => {
      if (!id) {
        return
      }

      setMessagesToast((previous) =>
        previous.filter((toast) => toast.id !== id)
      )
    },
    []
  )

  /**
   * Adds a toast notification.
   *
   * Each notification receives:
   *
   * 1. A timestamp.
   * 2. A monotonic sequence.
   *
   * This gives the Toast component a deterministic
   * chronological ordering even after items are removed.
   *
   * @param opts Notification options.
   */
  const sendNotification = useCallback(
    (opts: Partial<ToastMessage> = {}) => {
      const id =
        typeof globalThis.crypto !== 'undefined' &&
        typeof globalThis.crypto.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 9)}`

      const createdAt = Date.now()
      const sequence = toastSequenceRef.current++

      const newMsg: ToastMessage = {
        id,

        title: String(opts.title ?? ''),

        description: String(opts.description ?? ''),

        backgroundColor: opts.backgroundColor ?? '',

        position: opts.position ?? 'bottom-left',

        createdAt,

        sequence
      }

      setMessagesToast((previous) => {
        const next = [...previous]

        /**
         * Preserve the original maximum
         * of 10 notifications.
         */
        if (next.length >= 10) {
          next.shift()
        }

        return [...next, newMsg]
      })
    },
    []
  )

  /**
   * Opens/closes sales and keeps the URL synchronized.
   *
   * IMPORTANT:
   * Do not execute router.push inside a state updater.
   * React can evaluate state updater functions while rendering,
   * and navigation inside them can cause:
   *
   * "Cannot update a component (Router) while rendering
   * a different component (Provider)".
   *
   * Calculate the next value first, update the state,
   * and perform navigation separately.
   *
   * @param value Optional forced state.
   */
  const setSalesOpen = useCallback(
    (value?: boolean) => {
      const next =
        typeof value === 'boolean'
          ? value
          : !salesOpen

      // Update React state without side effects in an updater.
      setSalesOpenModal(next)

      // Build the URL independently of the state update.
      const newParams = new URLSearchParams(
        searchParams?.toString() || ''
      )

      if (next) {
        newParams.set('saleOpen', 'true')
      } else {
        newParams.delete('saleOpen')
      }

      const queryStr = newParams.toString()

      const url = queryStr
        ? `${pathname}?${queryStr}`
        : pathname || '/'

      // Navigation takes place outside the state updater.
      router.push(url)
    },
    [
      pathname,
      router,
      searchParams,
      salesOpen
    ]
  )

  /**
   * Synchronizes sales state with URL.
   */
  useEffect(() => {
    const isSaleOpen =
      searchParams?.get('sale') === 'true' ||
      searchParams?.get('saleOpen') === 'true'

    setSalesOpenModal(isSaleOpen)

    setMenu(false)
    setCollapsed(false)
    setStatus('close')
  }, [pathname, searchParams])

  /**
   * Clears AlertBox after configured duration.
   */
  useEffect(() => {
    if (!error?.message) {
      return
    }

    const timeout = globalThis.setTimeout(
      () => setError(null),
      error.duration ?? 3000
    )

    return () => {
      globalThis.clearTimeout(timeout)
    }
  }, [error])

  /**
   * Memoized context value.
   */
  const value = useMemo<AppContextState>(
    () => ({
      authData,
      isElectron,
      collapsed,
      countPedido,
      error,
      hidden,
      isSession,
      menu,
      messagesToast,
      salesOpen,
      selectedStore,
      isOpenOrder,
      show,
      showModalComponent,
      theme,
      status,
      modalsLector,

      handleClick,
      toggleTheme,
      toggleModal,

      handleMenu: (index: number | false) => {
        setMenu((previous) =>
          previous === index ? false : index
        )
      },

      sendNotification,

      setIsOpenOrder,
      setCollapsed,
      setCountPedido,
      setHidden,
      setIsSession,
      setMessagesToast,
      setSalesOpen,
      setSelectedStore,

      setShowComponentModal: handleMenuLateral,

      setStatus,

      deleteToast,

      setAlertBox: (err: ContainerToastProps | null) => {
        setError(err)
      }
    }),
    [
      authData,
      isElectron,
      collapsed,
      countPedido,
      error,
      hidden,
      isSession,
      menu,
      messagesToast,
      salesOpen,
      selectedStore,
      isOpenOrder,
      show,
      showModalComponent,
      theme,
      status,
      modalsLector,
      handleClick,
      toggleTheme,
      toggleModal,
      sendNotification,
      setSalesOpen,
      handleMenuLateral,
      deleteToast
    ]
  )

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  )
}

/**
 * Hook to consume application context.
 *
 * @returns Application context.
 */
const useAuth = () => useContext(Context)

export {
  Provider as default,
  useAuth
}
