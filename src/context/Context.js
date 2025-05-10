import PropTypes from 'prop-types'
import { useRouter, usePathname } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

const initialCompanyState = {
  idStore: undefined
}
const initialStateContext = {
  alert: false,
  isElectron: false,
  authData: {},
  collapsed: false,
  company: initialCompanyState,
  countPedido: 0,
  DataCompany: {},
  error: {},
  hidden: false,
  isCompany: {},
  isSession: null,
  menu: 0,
  messagesToast: [],
  salesOpen: false,
  selectedStore: null,
  isOpenOrder: false,
  show: null,
  showModalComponent: null,
  status: 'close',
  handleClick: (number) => { return number },
  handleMenu: () => { return },
  sendNotification: ({
    title = '',
    description = '',
    backgroundColor = ''
  }) => {
    return {
      title,
      description,
      backgroundColor
    }
  },
  setIsOpenOrder: (state) => { return state },
  setCollapsed: (boolean) => { return boolean },
  setCompanyLink: () => { return },
  setCountPedido: () => { return },
  setHidden: () => { return },
  setIsSession: () => { return },
  setMessagesToast: (array) => { return array },
  setSalesOpen: (state) => { return state },
  setSelectedStore: () => { return },
  setSessionActive: () => { return },
  setShowComponentModal: (boolean) => { return boolean },
  setStatus: (string) => { return string },
  setStoreChatActive: () => { return },
  useCompany: () => { return },
  setAlertBox: ({
    message = '',
    color = '',
    duration = 3000
  }) => {
    return {
      message,
      color,
      duration
    }
  }
}
export const Context = createContext(initialStateContext)
// 22/05/2023 VALERIA
const Provider = ({ children }) => {
  // STATE
  const [alert] = useState(false)
  const [isOpenOrder, setIsOpenOrder] = useState(false)

  const [collapsed, setCollapsed] = useState(false)
  const [company, setCompanyId] = useState(initialCompanyState)
  const [countPedido, setCountPedido] = useState(0)
  const [error, setError] = useState({})
  const [hidden, setHidden] = useState(false)
  const [isCompany, setCompany] = useState({})
  const [isSession, setIsSession] = useState()
  const [menu, setMenu] = useState(0)
  const [messagesToast, setMessagesToast] = useState([])
  const [salesOpen, setSalesOpenModal] = useState(false)
  const [selectedStore, setSelectedStore] = useState(null)
  const [show, setShow] = useState(null)
  const [showModalComponent, setShowComponentModal] = useState(false)
  const [status, setStatus] = useState('close')
  const router = useRouter()

  const setSessionActive = useCallback(sessionValue => { return setIsSession(sessionValue) }, [])
  console.log({ pathname: router.pathname })
  // const pathname = router.pathname === '/dashboard/[...name]'
  const pathname = usePathname()

  const food = router?.query?.food
  /**
 * Handles the lateral menu interaction and sets the component modal accordingly.
 * @param {number} index - The index of the selected menu option.
 * @returns {void}
 */
  const handleMenuLateral = (index) => {
    const MENU_OPTIONS = {
      HIDE_MODAL: 3,
      SHOW_DASHBOARD_MODAL: 4
    }

    const isFood = !!food

    // Check if the current menu option should hide the modal
    const shouldHideModal = index === MENU_OPTIONS.HIDE_MODAL && pathname

    // Check if food is selected, then redirect to remove the food parameter from the URL
    const shouldRedirectFood = isFood
    if (shouldRedirectFood) {
      router?.push({ query: { ...router.query, food: '' } }, undefined, { shallow: true })
      return
    }

    let showComponentModal
    if (shouldHideModal) {
      showComponentModal = false
    } else if (index === MENU_OPTIONS.SHOW_DASHBOARD_MODAL) {
      showComponentModal = MENU_OPTIONS.SHOW_DASHBOARD_MODAL
    } else {
      showComponentModal = index
    }
    setShowComponentModal(showComponentModal)
  }


  const handleClick = index => {
    if (food) {
      router.push(
        {
          query: {
            ...router.query,
            food: ''
          }
        },
        undefined,
        { shallow: true }
      )
    }
    return setShow(index === show ? false : index)
  }

  useEffect(() => {
    if (error?.message) {
      const timeout = setTimeout(() => {
        setError(null)
      }, error.duration || 3000)

      return () => { return clearTimeout(timeout) }
    }
    return () => { return }
  }, [error])

  // Context to setCompanyLink
  const DataCompany = useMemo(() => { return { isCompany } }, [isCompany])
  const setCompanyLink = useCallback(sessionValue => { return setCompany(sessionValue) }, [])
  const handleMenu = index => { return setMenu(index === menu ? false : index) }

  const useCompany = useCallback(idStore => {
    setCompanyId({
      ...company,
      idStore
    })
    if (typeof idStore !== 'undefined') {
      localStorage.setItem('idStore', idStore)
    }
  }, [company])
  useEffect(() => {
    if (localStorage.getItem('idStore') !== company.idStore) {
      setCompanyId({
        ...company,
        idStore: localStorage.getItem('idStore')
      })
    }
  }, [company])


  const setSalesOpen = () => {
    setSalesOpenModal(!salesOpen)
    const newQuery = {
      ...router.query,
      saleOpen: !salesOpen
    }
    if (typeof router.push !== "function") return
    router.push(pathname, {
      query: newQuery,
    })
  }
  useEffect(() => {
    if (router.query?.sale === 'true') {
      setSalesOpenModal(true)
    }
    handleMenu(false)
    setCollapsed(false)
    setStatus('close')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    if (!isSession) {
      setIsSession(null)
    } else {
      setIsSession(isSession)
    }
  }, [isSession])

  const sendNotification = ({
    title = '',
    description = '',
    backgroundColor = '',
    position = null
  }) => {
    if (messagesToast.length >= 10) {
      const deleteToast = (id) => {
        const listItemIndex = messagesToast.findIndex((e) => { return e.id === id })
        messagesToast.splice(listItemIndex, 1)
        setMessagesToast([...messagesToast])
      }
      deleteToast(messagesToast[0].id)
    }
    const id = Math.floor(Math.random() * 101 + 1)
    const newMessage = {
      id,
      title: title?.toString() || '',
      backgroundColor,
      description,
      position
    }
    setMessagesToast([...messagesToast, newMessage])
  }
  const authData = useMemo(
    () => {
      return {
        isSession
      }
    },
    [isSession]
  )
  const setStoreChatActive = useCallback(sessionValue => {
    setSelectedStore(sessionValue)
  }, [selectedStore, hidden])

    const [isElectron, setIsElectron] = useState(false);
    useEffect(() => {
      if (typeof window !== "undefined" && /Electron/.test(navigator.userAgent)) {
        setIsElectron(true);
      } else {
        setIsElectron(false);
      }
    }, []);

  const value = useMemo(
    () => {
      return {
        alert,
        authData,
        isElectron,
        collapsed,
        company,
        countPedido,
        DataCompany,
        error,
        hidden,
        isCompany,
        isSession,
        menu,
        messagesToast,
        salesOpen,
        selectedStore,
        isOpenOrder,
        show,
        showModalComponent,
        status,
        handleClick,
        handleMenu,
        sendNotification,
        setIsOpenOrder,
        setCollapsed,
        setCompanyLink,
        setCountPedido,
        setHidden,
        setIsSession,
        setMessagesToast,
        setSalesOpen,
        setSelectedStore,
        setSessionActive,
        setShowComponentModal: handleMenuLateral,
        setStatus,
        setStoreChatActive,
        useCompany,
        setAlertBox: err => { return setError(err) }
      }
    },
    [
      alert,
      authData,
      collapsed,
      company,
      countPedido,
      DataCompany,
      isOpenOrder,
      isElectron,
      error,
      hidden,
      isCompany,
      isSession,
      menu,
      messagesToast,
      salesOpen,
      selectedStore,
      show,
      showModalComponent,
      status,
      handleClick,
      handleMenu,
      sendNotification,
      setCompanyLink,
      setIsOpenOrder,
      setMessagesToast,
      setSalesOpen,
      setSessionActive,
      setShowComponentModal,
      setStoreChatActive,
      useCompany
    ]
  )

  return <Context.Provider value={value}>
    {children}
  </Context.Provider>
}

Provider.propTypes = {
  children: PropTypes.any
}
const useAuth = () => { return useContext(Context) }

export { Provider as default, useAuth }

