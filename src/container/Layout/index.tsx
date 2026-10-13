'use client'

import { useApolloClient } from '@apollo/client'
import Head from 'next/head'
import {
  usePathname,
  useRouter,
  useSearchParams
} from 'next/navigation'
import {
  Cookies,
  newMessageSubscription,
  newStoreOrderSubscription,
  paymentMethodCards,
  useConnection,
  useCreateDeliveryTime,
  useDeliveryTime,
  useLogout,
  useManageNewOrder,
  useManageQueryParams,
  useMobile,
  useModules,
  usePosition,
  usePushNotifications,
  useScrollHook,
  useStore,
  useSubscriptionValidation,
  useTotalSales,
  useUpdateModuleOrder,
  useUser,
  version as logicalVersion
} from 'npm-pkg-hook'
import {
  AlertBox,
  Aside,
  AwesomeModal,
  Button,
  DeliveryTime,
  getGlobalStyle,
  Header,
  Icon,
  LateralModal,
  Orders,
  Overline,
  Plan,
  Toast
} from 'pkg-components'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import packageJson from '../../../package.json'
import { Context } from '../../context/Context'
import { Categories } from '../categories'
import { Clients } from '../clients'
import { CreateSales } from '../orders/create'
import { useDevServerStatus } from '../orders/view/hooks'
import { Product } from '../product'
import { ScheduleTimings } from '../schedule'
import { Footer } from './Footer/index'
import { heights, widths } from './helpers'
import styles from './styles.module.css'

interface MemoLayoutProps {
  children: React.ReactNode
  watch?: boolean
  settings?: {
    enableHighAccuracy: boolean
    timeout: number
    maximumAge: number
  }
}

interface CheckoutCookie {
  name: string
  value: string | undefined
}

interface DragResult {
  destination: { index: number } | null
  source: { index: number }
}

export const MemoLayout: React.FC<MemoLayoutProps> = ({
  children,
  watch,
  settings
}) => {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const searchParams = useSearchParams()

  const {
    collapsed,
    error,
    isOpenOrder,
    messagesToast,
    salesOpen,
    isElectron,
    showModalComponent,
    handleClick,
    sendNotification,
    setAlertBox,
    setCollapsed,
    setIsOpenOrder,
    setSalesOpen,
    theme,
    toggleTheme,
    deleteToast,
    setShowComponentModal,
    setStatus
  } = useContext(Context)

  const dataLocation = usePosition(watch, settings)
  useManageQueryParams({ router, searchParams })

  const [dataUser] = useUser()
  const [modulesOrder, setModulesOrder] = useState<unknown[]>([])
  const [updateModulesOrder] = useUpdateModuleOrder()

  useModules({
    dataUser,
    callback: (modules: unknown[]) => {
      setModulesOrder(modules)
    }
  })

  const [dataStore] = useStore()
  const idStore = dataStore?.idStore ?? ''
  const [count, { loading: loadingCount }] = useTotalSales()
  const style = useScrollHook()
  const [isCollapsedMenu, setIsCollapsedMenu] = useState(false)
  const { isMobile, isTablet } = useMobile({
    callback: ({ isMobile }: { isMobile: boolean }) => {
      setIsCollapsedMenu(isMobile ? false : isCollapsedMenu)
    }
  })

  const { onClickLogout } = useLogout({})

  // Push notifications: one hook instance shared with Header -> Options.
  const {
    userConsent,
    pushNotificationSupported,
    userSubscription,
    pushServerSubscriptionId,
    isSubscribed,
    onClickAskUserPermission,
    onClickSubscribeToPushNotification,
    onClickSendSubscriptionToPushServer,
    onClickSendNotification,
    onClickEnablePushNotifications,
    error: errorPush,
    loading: loadingPush
  } = usePushNotifications()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { latitude, longitude } = dataLocation ?? {
        latitude: null,
        longitude: null
      }

      if (latitude != null && longitude != null) {
        window.localStorage.setItem('latitude', String(latitude))
        window.localStorage.setItem('longitude', String(longitude))
        window.localStorage.setItem('location', JSON.stringify(dataLocation))
      }
    }

    setAlertBox({ message: '', color: 'success' })
    // This effect intentionally runs once for initial layout setup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const playNotificationSound = useCallback(() => {
    // Add your sound playback here if required.
  }, [])

  const handleNewMessage = useCallback(() => {
    playNotificationSound()
  }, [playNotificationSound])

  const [countOrders, setCountOrders] = useState(0)
  const client = useApolloClient()
  const [orders, { handleNewOrder }] = useManageNewOrder({
    playNotificationSound,
    setCountOrders,
    setIsOpenOrder,
    idStore,
    client,
    // Internal app toast notification, not a Web Push request.
    sendNotification,
    setAlertBox
  })

  // Tracks orders already pushed to avoid duplicate Web Push notifications
  // when the subscription re-delivers the same event (reconnections/retries).
  const notifiedOrdersRef = useRef<Set<string>>(new Set())

  // Fires a Web Push notification for a new sale, deep-linking to the order
  // detail (/orders/{pCodeRef}). The in-app toast is still handled by
  // handleNewOrder; this only adds the OS-level push via the shared hook.
  const notifyNewOrderPush = useCallback((pCodeRef: string): void => {
    if (!isSubscribed || !pCodeRef) {
      return
    }
    if (notifiedOrdersRef.current.has(pCodeRef)) {
      return
    }
    notifiedOrdersRef.current.add(pCodeRef)

    void onClickSendNotification({
      title: 'Nueva venta',
      description: `Pedido ${pCodeRef}`,
      url: `/orders/${encodeURIComponent(pCodeRef)}`,
      tag: `order-${pCodeRef}`
    })
  }, [isSubscribed, onClickSendNotification])

  // Wraps the existing handler so a single subscription event drives both the
  // in-app order management and the Web Push notification.
  const handleIncomingOrder = useCallback((order: { id: string; idStore: string; pCodeRef: string }): void => {
    handleNewOrder(order)
    notifyNewOrderPush(order?.pCodeRef)
  }, [handleNewOrder, notifyNewOrderPush])

  newMessageSubscription(idStore, handleNewMessage)
  newStoreOrderSubscription(idStore, handleIncomingOrder)

  const [connectionStatus, setConnectionStatus] = useState<boolean | 'initial'>('initial')
  const statusConnection = connectionStatus
    ? 'Conexión a internet restablecida.'
    : 'Conexión a internet perdida.'

  useConnection({ setConnectionStatus })

  useEffect(() => {
    if (connectionStatus === 'initial') return

    const timeoutId = window.setTimeout(() => {
      setConnectionStatus('initial')
    }, 3500)

    // Keep this as an in-app toast; it does not send a Web Push notification.
    sendNotification({
      title: 'Wifi',
      description: statusConnection,
      backgroundColor: connectionStatus ? 'success' : 'warning'
    })

    return () => window.clearTimeout(timeoutId)
    // sendNotification is supplied by Context and treated as the app's toast action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus, statusConnection])

  const onCloseLateralMenu = useCallback(() => {
    setShowComponentModal(false)
  }, [setShowComponentModal])

  const components: Record<number, JSX.Element> = {
    1: <ScheduleTimings isChart />,
    2: <Clients />,
    3: <Product />,
    4: <Categories isDragDisabled />
  }

  const handleOpenMenu = (): void => {
    setCollapsed(!collapsed)
    setStatus(collapsed ? 'open' : 'close')
  }

  const handleViewOrder = (pCodeRef: string): void => {
    setIsOpenOrder(false)
    router.push(`/pedidos?saleId=${encodeURIComponent(pCodeRef)}`)
  }

  const [openDeliveryTime, setOpenDeliveryTime] = useState(false)
  const handleOpenDeliveryTime = useCallback(() => {
    setOpenDeliveryTime(previous => !previous)
  }, [])

  const deliveryTimeMinutes = dataStore?.deliveryTimeMinutes
  const { deliveryTime, handleDeliveryTimeChange } = useDeliveryTime({
    initialTime: `${deliveryTimeMinutes}`
  })
  const { createDeliveryTime, loading: loadingDeliveryTime } = useCreateDeliveryTime({
    sendNotification
  })

  // Accept an explicit state from Header/Options, while preserving toggle behavior
  // for existing callers such as the Orders panel.
  const handleSetIsOpenOrder = (open?: boolean): void => {
    setIsOpenOrder(typeof open === 'boolean' ? open : !isOpenOrder)
  }

  const {
    loading: loadingSubscription,
    subscriptionData,
    daysRemaining
  } = useSubscriptionValidation(idStore)
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(true)

  useEffect(() => {
    if (subscriptionData && daysRemaining < 0) {
      setIsSubscriptionExpired(process.env.NODE_ENV !== 'development')
    }
    if (subscriptionData === null && loadingSubscription === false) {
      setIsSubscriptionExpired(process.env.NODE_ENV !== 'development')
    }
  }, [daysRemaining, subscriptionData, loadingSubscription])

  const title = `(${countOrders}) ${process.env.BUSINESS_TITLE}`
  const version = packageJson.version

  const sendCookieValuesAsQueryParams = (
    cookies: CheckoutCookie[],
    url: string
  ): void => {
    try {
      if (!Array.isArray(cookies)) {
        throw new TypeError('Input should be an array of cookies.')
      }

      const queryParams = cookies
        .map(cookie => `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value ?? '')}`)
        .join('&')

      const separator = url.includes('?') ? '&' : '?'
      window.location.href = `${url}${separator}${queryParams}`
    } catch {
      sendNotification({
        title: 'Error',
        description: 'Ocurrió un error al intentar pagar',
        backgroundColor: 'warning'
      })
    }
  }

  const handleRedirectToCheckout = async (): Promise<void> => {
    const token = Cookies.get('session')
    const usuario = Cookies.get('usuario')
    const cookies: CheckoutCookie[] = [
      { name: 'restaurant', value: idStore },
      { name: 'session', value: token },
      { name: 'usuario', value: usuario }
    ]

    const checkoutUrl = process.env.URL_WEB_CHECKOUT
    if (!checkoutUrl) {
      sendNotification({
        title: 'Error',
        description: 'No está configurada la URL de Checkout.',
        backgroundColor: 'warning'
      })
      return
    }

    sendCookieValuesAsQueryParams(cookies, `${checkoutUrl.replace(/\/$/, '')}/`)
  }

  const showModal = false

  const onDragEnd = async (result: unknown): Promise<void> => {
    const { destination, source } = result as DragResult
    if (!destination || destination.index === source.index) return

    const reorderedModules = Array.from(modulesOrder)
    const [removed] = reorderedModules.splice(source.index, 1)
    if (removed === undefined) return
    reorderedModules.splice(destination.index, 0, removed)

    const updatedModules = reorderedModules.map((module, index) => ({
      ...(typeof module === 'object' && module !== null ? module : {}),
      mPriority: index + 1
    }))

    setModulesOrder(updatedModules)
    await updateModulesOrder(updatedModules)
  }

  const handleCollapsedMenu = (): void => {
    setIsCollapsedMenu(previous => !previous)
  }

  const { connected } = useDevServerStatus()

  return (
    <>
      <Head>
        <title>{countOrders > 0 ? title : process.env.BUSINESS_TITLE}</title>
      </Head>

      {showModal && (
        <AwesomeModal
          customHeight='calc(100vh - 140px)'
          footer={false}
          height='calc(100vh - 140px)'
          onCancel={() => setIsSubscriptionExpired(false)}
          onConfirm={() => setIsSubscriptionExpired(false)}
          onHide={() => setIsSubscriptionExpired(false)}
          show={isSubscriptionExpired}
          size='medium'
          zIndex={getGlobalStyle('--z-index-high')}
        >
          {process.env.NODE_ENV === 'development' && (
            <Plan
              onRedirectTo={handleRedirectToCheckout}
              paymentMethodCards={paymentMethodCards}
              storeImage='/images/3dstore.png'
            />
          )}
        </AwesomeModal>
      )}

      <Overline
        bgColor='rgba(119, 119, 119, 0.306)'
        onClick={() => setIsOpenOrder()}
        show={isOpenOrder}
        zIndex={getGlobalStyle('--z-index-99999')}
      />

      <DeliveryTime
        createDeliveryTime={createDeliveryTime}
        deliveryTime={deliveryTime}
        handleDeliveryTimeChange={handleDeliveryTimeChange}
        isOpen={openDeliveryTime}
        loading={loadingDeliveryTime}
        setDeliveryTimeOpen={handleOpenDeliveryTime}
      />

      <Orders
        deliveryTimeMinutes={deliveryTimeMinutes}
        handleSetIsOpenOrder={handleSetIsOpenOrder}
        handleViewOrder={handleViewOrder}
        isOpen={isOpenOrder}
        orders={orders}
      />

      <AlertBox err={error} />

      <Toast
        toastList={messagesToast.map(toast => ({
          id: toast.id,
          title: String(toast.title ?? ''),
          description: String(toast.description ?? ''),
          backgroundColor: toast.backgroundColor,
          position: toast.position,
          createdAt: toast.createdAt,
          sequence: toast.sequence
        }))}
        autoDelete
        autoDeleteTime={5000}
        maxVisible={5}
        stackOffsetY={15}
        stackScaleStep={0.025}
        exitAnimationDuration={250}
        exitStagger={100}
        visibleCounter={false}
        showProgress
        dismissOnClick={false}
        stackHoverLift={false}
        usePortal
        deleteToast={deleteToast}
      />

      <main className={`${styles.main} ${pathname === '/' ? styles.noAside : ''} ${isCollapsedMenu ? styles.collapsed_main : ''}`}>
        <Header
          count={count}
          countOrders={countOrders}
          errorPush={errorPush}
          handleOpenMenu={handleOpenMenu}
          isMobile={isMobile}
          loadingCount={loadingCount}
          loadingPush={loadingPush}
          location={router}
          onClickAskUserPermission={onClickAskUserPermission}
          onClickSubscribeToPushNotification={onClickSubscribeToPushNotification}
          onClickSendSubscriptionToPushServer={onClickSendSubscriptionToPushServer}
          onClickSendNotification={onClickSendNotification}
          onClickEnablePushNotifications={onClickEnablePushNotifications}
          onClickLogout={onClickLogout}
          pushNotificationSupported={pushNotificationSupported}
          pushServerSubscriptionId={pushServerSubscriptionId}
          userConsent={userConsent}
          userSubscription={userSubscription}
          salesOpen={salesOpen}
          setIsOpenOrder={handleSetIsOpenOrder}
          setSalesOpen={setSalesOpen}
          style={style}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <Aside
          collapsed={collapsed ? true : undefined}
          dataStore={dataStore}
          pathname={pathname}
          isCollapsedMenu={isCollapsedMenu}
          handleCollapsedMenu={handleCollapsedMenu}
          handleClick={handleClick}
          handleOpenDeliveryTime={handleOpenDeliveryTime}
          isElectron={isElectron}
          connected={connected}
          isMobile={isMobile}
          loading={false}
          loadingDeliveryTime={loadingDeliveryTime}
          logicalVersion={logicalVersion}
          modules={modulesOrder}
          onDragEnd={onDragEnd}
          salesOpen={salesOpen}
          setCollapsed={setCollapsed}
          setSalesOpen={setSalesOpen}
          setShowComponentModal={setShowComponentModal}
          version={version}
        />

        <div
          style={{
            backgroundColor: getGlobalStyle('--color-neutral-gray-white'),
            gridArea: 'main',
            overflowY: 'auto',
            marginBottom: '35px'
          }}
          className={styles.main_app_content}
        >
          {children}
          <CreateSales setShow={setSalesOpen} show={salesOpen} />
        </div>

        <Footer />

        <div style={{ gridArea: 'right' }} className={styles.area_right_container}>
          <LateralModal
            handleClose={onCloseLateralMenu}
            open={Boolean(showModalComponent)}
            style={{
              zIndex: getGlobalStyle('--z-index-modal'),
              width: isTablet
                ? '100%'
                : widths[showModalComponent as keyof typeof widths],
              height: heights[showModalComponent as keyof typeof heights]
            } as React.CSSProperties}
            direction='right'
          >
            <Button
              border='none'
              className={styles.button_lateral_close}
              onClick={onCloseLateralMenu}
            >
              <Icon
                icon='IconCancel'
                size={30}
                color={getGlobalStyle('--color-icons-primary')}
              />
            </Button>
            {components[showModalComponent as keyof typeof components] as React.ReactNode ?? null}
          </LateralModal>
        </div>
      </main>
    </>
  )
}

export const Layout = React.memo(MemoLayout)

interface LayoutWithAlertProps {
  page: React.ReactNode
}

export const LayoutWithAlert: React.FC<LayoutWithAlertProps> = ({ page }) => {
  const { error } = useContext(Context)
  return (
    <>
      <AlertBox err={error} />
      {page}
    </>
  )
}
