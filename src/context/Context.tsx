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
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { MENU_OPTIONS } from './helpers'

/**
 * Toast message structure
 */
export type ToastMessage = {
  id: string
  title?: string
  description?: string
  backgroundColor?: string
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | string | null
}

/**
 * Context state shape
 */
export interface AppContextState {
  // Values
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

  // Theme
  theme?: unknown
  toggleTheme?: () => void
  initTheme?: () => void

  // Actions / setters
  handleClick: (index: number) => void
  handleMenu: (index: number | false) => void
  sendNotification: (opts?: Partial<ToastMessage>) => void
  setIsOpenOrder: Dispatch<SetStateAction<boolean>>
  setCollapsed: Dispatch<SetStateAction<boolean>>
  setCountPedido: Dispatch<SetStateAction<number>>
  setHidden: Dispatch<SetStateAction<boolean>>
  setIsSession: Dispatch<SetStateAction<unknown>>
  setMessagesToast: Dispatch<SetStateAction<ToastMessage[]>>
  setSalesOpen: () => void
  setSelectedStore: Dispatch<SetStateAction<unknown | null>>
  setShowComponentModal: (index: number) => void
  setStatus: Dispatch<SetStateAction<string>>
  deleteToast: (id: string) => void
  setAlertBox: (err: ContainerToastProps | null) => void
}

/**
 * Default initial context with safe no-op implementations.
 */
const initialStateContext = {
  authData: {},
  collapsed: false,
  countPedido: 0,
  error: null as ContainerToastProps | null,
  hidden: false,
  isElectron: false,
  isOpenOrder: false,
  isSession: null as unknown,
  menu: 0 as number | false,
  messagesToast: [] as ToastMessage[],
  modalsLector: false as boolean | number,
  salesOpen: false,
  selectedStore: null as unknown | null,
  show: null as number | null,
  showModalComponent: Object.values(MENU_OPTIONS)[0] as number | false,
  status: 'close',

  handleClick: () => {},
  handleMenu: () => {},
  sendNotification: () => {},
  setIsOpenOrder: (() => {}) as Dispatch<SetStateAction<boolean>>,
  setCollapsed: (() => {}) as Dispatch<SetStateAction<boolean>>,
  setCountPedido: (() => {}) as Dispatch<SetStateAction<number>>,
  setHidden: (() => {}) as Dispatch<SetStateAction<boolean>>,
  setIsSession: (() => {}) as Dispatch<SetStateAction<unknown>>,
  setMessagesToast: (() => {}) as Dispatch<SetStateAction<ToastMessage[]>>,
  setSalesOpen: () => {},
  setSelectedStore: (() => {}) as Dispatch<SetStateAction<null>>,
  setShowComponentModal: () => {},
  setStatus: (() => {}) as Dispatch<SetStateAction<string>>,
  deleteToast: () => {},
  setAlertBox: () => {}
} as AppContextState

export const Context = createContext<AppContextState>(initialStateContext)

interface ProviderProps {
  children: React.ReactNode
}

/**
 * App context provider (Next 15 compatible)
 * - Uses useSearchParams to read query params
 * - Uses usePathname for current path
 * - Uses router.push with full URL to update search params safely
 */
const Provider = ({ children }: ProviderProps) => {
  // Theme
  const { toggleTheme, initTheme, theme } = useTheme()

  // Router + url helpers (Next 15)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // state
  const [isOpenOrder, setIsOpenOrder] = useState<boolean>(false)
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [countPedido, setCountPedido] = useState<number>(0)
  const [error, setError] = useState<ContainerToastProps | null>(null)
  const [hidden, setHidden] = useState<boolean>(false)
  const [isSession, setIsSession] = useState<unknown>(null)
  const [menu, setMenu] = useState<number | false>(0)
  const [messagesToast, setMessagesToast] = useState<ToastMessage[]>([])
  const [salesOpen, setSalesOpenModal] = useState<boolean>(false)
  const [selectedStore, setSelectedStore] = useState<unknown | null>(null)
  const [show, setShow] = useState<number | false | null>(null)
  const [showModalComponent, setShowComponentModal] = useState<number | false>(false)
  const [status, setStatus] = useState<string>('close')
  const [modalsLector, setModalsLector] = useState<boolean | number>(false)

  // Electron detection
  const [isElectron, setIsElectron] = useState<boolean>(false)
  useEffect(() => {
    if (typeof globalThis.window !== 'undefined' && typeof navigator !== 'undefined' && /Electron/.test(navigator.userAgent)) {
      setIsElectron(true)
    } else {
      setIsElectron(false)
    }
  }, [])

  // initialize theme once
  useEffect(() => {
    initTheme?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep authData memoized
  const authData = useMemo(() => ({ isSession }), [isSession])

  /**
   * Toggle a small group of modals by index (qr/barcode)
   * @param index index or id of modal to toggle
   */
  const toggleModal = (index: number) => setModalsLector((prev) => (prev === index ? false : index))

  /**
   * Toggle component modal for lateral menu
   * @param index index of menu component
   */
  const handleMenuLateral = (index: number) => {
    setShowComponentModal((prev) => (prev === index ? false : index))
  }

  /**
   * Handle general click that toggles small sections
   * @param index index to toggle
   */
  const handleClick = (index: number) => {
    // read 'food' query param using useSearchParams
    const food = searchParams?.get?.('food')
    if (food) {
      // rebuild search params without 'food'
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('food')
      const queryStr = newParams.toString()
      const url = queryStr ? `${pathname}?${queryStr}` : pathname || '/'
      router.push(url)
    }
    setShow((prev) => (prev === index ? false : index))
  }

  /**
   * Delete toast immutably
   * @param id toast id
   */
  const deleteToast = (id: string) => {
    if (!id) {return}
    setMessagesToast((prev) => prev.filter((t) => t.id !== id))
  }

  /**
   * Send a notification toast
   * - caps at 10 items
   * - uses crypto.randomUUID if available
   * @param opts partial toast options
   */
  const sendNotification = (opts: Partial<ToastMessage> = {}) => {
    setMessagesToast((prev) => {
      const list = [...prev]
      const id =
        (globalThis?.crypto !== undefined && globalThis.crypto.randomUUID !== undefined)
          ? (globalThis.crypto).randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      const newMsg: ToastMessage = {
        id,
        title: String(opts.title ?? ''),
        description: String(opts.description ?? ''),
        backgroundColor: opts.backgroundColor ?? '',
        position: opts.position ?? 'bottom-left'
      }

      // keep list capped to 10
      if (list.length >= 10) {
        list.shift()
      }
      return [...list, newMsg]
    })
  }

  /**
   * Toggle sales open state and persist state in URL search params.
   * Uses useSearchParams() for current params and router.push() to update URL.
   */
  const setSalesOpen = () => {
    setSalesOpenModal((prev) => {
      const next = !prev
      // update query param saleOpen
      const newParams = new URLSearchParams(searchParams?.toString() || '')
      if (next) {
        newParams.set('saleOpen', 'true')
      } else {
        newParams.delete('saleOpen')
      }

      const queryStr = newParams.toString()
      const url = queryStr ? `${pathname}?${queryStr}` : pathname || '/'
      router.push(url)
      return next
    })
  }

  // sync local state with URL params on mount / change of searchParams
  useEffect(() => {
    if (searchParams?.get?.('sale') === 'true' || searchParams?.get?.('saleOpen') === 'true') {
      setSalesOpenModal(true)
    } else {
      setSalesOpenModal(false)
    }
    // reset menu and collapsed status on navigation change to keep UI sane
    setMenu(false)
    setCollapsed(false)
    setStatus('close')
     
  }, [searchParams, pathname])

  // Error timeout cleanup
  useEffect(() => {
    if (!error?.message) {return}
    const timeout = setTimeout(() => setError(null), error.duration ?? 3000)
    return () => clearTimeout(timeout)
  }, [error])

  // Memoize context value to avoid unnecessary re-renders
  const value = useMemo<AppContextState>(() => {
    return {
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
      handleMenu: (index: number | false) => setMenu((m) => (m === index ? false : index)),
      toggleModal,
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
      setAlertBox: (err: ContainerToastProps | null) => setError(err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
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
    sendNotification
  ])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

/**
 * Hook to consume the app auth/context
 */
const useAuth = () => useContext(Context)

export { Provider as default, useAuth }
