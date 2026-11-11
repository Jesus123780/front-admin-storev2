
'use client'

import { useApolloClient } from '@apollo/client'
import Head from 'next/head'
import {
  usePathname,
  useRouter,
  useSearchParams
} from 'next/navigation'
import {
  ConfigurationScope,
  Cookies,
  newMessageSubscription,
  newStoreOrderSubscription,
  paymentMethodCards,
  useConnection,
  useCreateDeliveryTime,
  useDeliveryTime,
  useGetResolvedConfiguration,
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
  useUpsertConfiguration,
  useUpsertGoal,
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
  GoalModal,
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

type ThemePreference = 'light' | 'dark' | 'system'

type EffectiveTheme = 'light' | 'dark'

/**
 * Resolves a theme preference into its effective visual theme.
 *
 * `system` uses the operating system preference.
 */
const resolveThemePreference = (
  preference: ThemePreference
): EffectiveTheme => {
  if (preference !== 'system') {
    return preference
  }

  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches
    ? 'dark'
    : 'light'
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
    toggleTheme,
    deleteToast,
    setShowComponentModal,
    setStatus
  } = useContext(Context)

    const {
    value: theme
  } = useGetResolvedConfiguration({
    componentName: 'AppShell',
    key: 'theme',
    defaultValue: 'light'
  })

  // --------------------------------------------------
  // Application configuration
  // --------------------------------------------------

  /**
   * Centralized configuration mutation.
   *
   * The current visual theme remains managed by Context.
   * Apollo persists the preference and synchronizes
   * configuration consumers through its shared cache.
   */
  const {
    upsertConfiguration,
    loading: savingTheme
  } = useUpsertConfiguration()

  /**
   * Persist a theme preference and synchronize the
   * current application theme.
   *
   * The database is updated first. The visual theme
   * changes only after a successful backend response.
   */
  const handleThemeChange = useCallback(
    async (
      nextTheme: ThemePreference
    ): Promise<void> => {
      if (savingTheme) {return}

      try {
        const response = await upsertConfiguration({
          scope: ConfigurationScope.USER,
          componentName: 'AppShell',
          key: 'theme',
          value: nextTheme
        })

        if (!response?.success) {
          sendNotification({
            title: 'No se pudo actualizar el tema',
            description:
              response?.message ??
              'Ocurrió un error al guardar tu preferencia visual.',
            backgroundColor: 'error'
          })

          return
        }

        // Resolve the effective theme.
        const effectiveTheme =
          resolveThemePreference(nextTheme)

        const currentTheme: EffectiveTheme =
          theme === 'dark' ? 'dark' : 'light'

        // Context exposes a toggle, so only invoke it
        // when the effective theme actually needs to change.
        if (effectiveTheme !== currentTheme) {
          toggleTheme()
        }

        sendNotification({
          title: 'Tema actualizado',
          description:
            nextTheme === 'system'
              ? `Se aplicó el tema del sistema (${effectiveTheme}).`
              : `El tema ${effectiveTheme === 'dark' ? 'oscuro' : 'claro'} se aplicó correctamente.`,
          backgroundColor: 'success'
        })
      } catch (err) {
        console.error(
          'MemoLayout.handleThemeChange:',
          err
        )

        sendNotification({
          title: 'Error al actualizar el tema',
          description:
            err instanceof Error
              ? err.message
              : 'No fue posible actualizar la configuración del tema.',
          backgroundColor: 'error'
        })
      }
    },
    [
      savingTheme,
      upsertConfiguration,
      theme,
      toggleTheme,
      sendNotification
    ]
  )

  /**
   * Keeps compatibility with the existing Header API.
   *
   * Header currently exposes toggleTheme without arguments,
   * so this wrapper calculates the next preference and
   * persists it before changing the UI.
   */
  const handleToggleTheme = useCallback(() => {
    const currentTheme: EffectiveTheme =
      theme === 'dark' ? 'dark' : 'light'

    const nextTheme: ThemePreference =
      currentTheme === 'dark' ? 'light' : 'dark'

    void handleThemeChange(nextTheme)
  }, [theme, handleThemeChange])

  // --------------------------------------------------
  // Location and navigation
  // --------------------------------------------------

  const dataLocation = usePosition(watch, settings)

  useManageQueryParams({
    router,
    searchParams
  })

  // --------------------------------------------------
  // User and modules
  // --------------------------------------------------

  const [dataUser] = useUser()

  const [modulesOrder, setModulesOrder] =
    useState<unknown[]>([])

  const [updateModulesOrder] =
    useUpdateModuleOrder()

  useModules({
    dataUser,
    callback: (modules: unknown[]) => {
      setModulesOrder(modules)
    }
  })

  // --------------------------------------------------
  // Store
  // --------------------------------------------------

  const [dataStore] = useStore()
  
  const idStore = dataStore?.idStore ?? ''

  const [count, { loading: loadingCount }] =
    useTotalSales()

  // --------------------------------------------------
  // Layout
  // --------------------------------------------------

  const style = useScrollHook()

  const [isCollapsedMenu, setIsCollapsedMenu] =
    useState(false)

  const { isMobile, isTablet } = useMobile({
    callback: ({ isMobile }: { isMobile: boolean }) => {
      setIsCollapsedMenu(
        isMobile ? false : isCollapsedMenu
      )
    }
  })

  // --------------------------------------------------
  // Authentication
  // --------------------------------------------------

  const { onClickLogout } = useLogout({})

  // --------------------------------------------------
  // Push notifications
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Initial layout setup
  // --------------------------------------------------

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const {
        latitude,
        longitude
      } = dataLocation ?? {
        latitude: null,
        longitude: null
      }

      if (
        latitude != null &&
        longitude != null
      ) {
        window.localStorage.setItem(
          'latitude',
          String(latitude)
        )

        window.localStorage.setItem(
          'longitude',
          String(longitude)
        )

        window.localStorage.setItem(
          'location',
          JSON.stringify(dataLocation)
        )
      }
    }

    setAlertBox({
      message: '',
      color: 'success'
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --------------------------------------------------
  // Order notifications
  // --------------------------------------------------

  const playNotificationSound = useCallback(() => {
    // Add your sound playback here if required.
  }, [])

  const handleNewMessage = useCallback(() => {
    playNotificationSound()
  }, [playNotificationSound])

  const [countOrders, setCountOrders] = useState(0)

  const client = useApolloClient()

  const [orders, { handleNewOrder }] =
    useManageNewOrder({
      playNotificationSound,
      setCountOrders,
      setIsOpenOrder,
      idStore,
      client,
      sendNotification,
      setAlertBox
    })

  // Prevent duplicated Web Push notifications.
  const notifiedOrdersRef = useRef<Set<string>>(
    new Set()
  )

  const notifyNewOrderPush = useCallback(
    (pCodeRef: string): void => {
      if (!isSubscribed || !pCodeRef) {
        return
      }

      if (
        notifiedOrdersRef.current.has(pCodeRef)
      ) {
        return
      }

      notifiedOrdersRef.current.add(pCodeRef)

      void onClickSendNotification({
        title: 'Nueva venta',
        description: `Pedido ${pCodeRef}`,
        url: `/orders/${encodeURIComponent(pCodeRef)}`,
        tag: `order-${pCodeRef}`
      })
    },
    [
      isSubscribed,
      onClickSendNotification
    ]
  )

  const handleIncomingOrder = useCallback(
    (
      order: {
        id: string
        idStore: string
        pCodeRef: string
      }
    ): void => {
      handleNewOrder(order)
      notifyNewOrderPush(order?.pCodeRef)
    },
    [
      handleNewOrder,
      notifyNewOrderPush
    ]
  )

  newMessageSubscription(
    idStore,
    handleNewMessage
  )

  newStoreOrderSubscription(
    idStore,
    handleIncomingOrder
  )

  // --------------------------------------------------
  // Connection status
  // --------------------------------------------------

  const [
    connectionStatus,
    setConnectionStatus
  ] = useState<boolean | 'initial'>('initial')

  const statusConnection = connectionStatus
    ? 'Conexión a internet restablecida.'
    : 'Conexión a internet perdida.'

  useConnection({
    setConnectionStatus
  })

  useEffect(() => {
    if (connectionStatus === 'initial') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setConnectionStatus('initial')
    }, 3500)

    sendNotification({
      title: 'Wifi',
      description: statusConnection,
      backgroundColor: connectionStatus
        ? 'success'
        : 'warning'
    })

    return () => {
      window.clearTimeout(timeoutId)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connectionStatus,
    statusConnection
  ])

  // --------------------------------------------------
  // Lateral menu
  // --------------------------------------------------

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

    setStatus(
      collapsed ? 'open' : 'close'
    )
  }

  // --------------------------------------------------
  // Orders
  // --------------------------------------------------

  const handleViewOrder = (
    pCodeRef: string
  ): void => {
    setIsOpenOrder(false)

    router.push(
      `/pedidos?saleId=${encodeURIComponent(pCodeRef)}`
    )
  }

  const handleSetIsOpenOrder = (
    open?: boolean
  ): void => {
    setIsOpenOrder(
      typeof open === 'boolean'
        ? open
        : !isOpenOrder
    )
  }

  // --------------------------------------------------
  // Delivery time
  // --------------------------------------------------

  const [
    openDeliveryTime,
    setOpenDeliveryTime
  ] = useState(false)

  const handleOpenDeliveryTime = useCallback(() => {
    setOpenDeliveryTime(previous => !previous)
  }, [])

  const handleCloseDeliveryTime = useCallback(() => {
    setOpenDeliveryTime(false)
  }, [])

  const deliveryTimeMinutes =
    dataStore?.deliveryTimeMinutes

  const {
    deliveryTime,
    handleDeliveryTimeChange
  } = useDeliveryTime({
    initialTime: `${deliveryTimeMinutes}`
  })

  const {
    createDeliveryTime,
    loading: loadingDeliveryTime
  } = useCreateDeliveryTime({
    sendNotification
  })

  // --------------------------------------------------
  // Daily goal
  // --------------------------------------------------

  const [openGoal, setOpenGoal] =
    useState(false)

  const handleOpenGoal = useCallback(() => {
    setOpenGoal(previous => !previous)
  }, [])

  const handleCloseGoal = useCallback(() => {
    setOpenGoal(false)
  }, [])

  const [goalValue, setGoalValue] =
    useState('')

  const [
    upsertGoalMutation,
    { loading: loadingGoal }
  ] = useUpsertGoal({
    sendNotification
  })

  useEffect(() => {
    if (dataStore?.dailyGoal != null) {
      setGoalValue(
        `${dataStore.dailyGoal}`
      )
    }
  }, [dataStore?.dailyGoal])

  const handleUpsertGoal = (
    value: string
  ): void => {
    upsertGoalMutation({
      idStore,
      dailyGoal: Number(value)
    })
  }

  // --------------------------------------------------
  // Subscription validation
  // --------------------------------------------------

  const {
    loading: loadingSubscription,
    subscriptionData,
    daysRemaining
  } = useSubscriptionValidation(idStore)

  const [
    isSubscriptionExpired,
    setIsSubscriptionExpired
  ] = useState(true)

  useEffect(() => {
    if (
      subscriptionData &&
      daysRemaining < 0
    ) {
      setIsSubscriptionExpired(
        process.env.NODE_ENV !== 'development'
      )
    }

    if (
      subscriptionData === null &&
      loadingSubscription === false
    ) {
      setIsSubscriptionExpired(
        process.env.NODE_ENV !== 'development'
      )
    }
  }, [
    daysRemaining,
    subscriptionData,
    loadingSubscription
  ])

  // --------------------------------------------------
  // Application title and version
  // --------------------------------------------------

  const title = `(${countOrders}) ${process.env.BUSINESS_TITLE}`

  const version = packageJson.version

  // --------------------------------------------------
  // Checkout
  // --------------------------------------------------

  const sendCookieValuesAsQueryParams = (
    cookies: CheckoutCookie[],
    url: string
  ): void => {
    try {
      if (!Array.isArray(cookies)) {
        throw new TypeError(
          'Input should be an array of cookies.'
        )
      }

      const queryParams = cookies
        .map(cookie =>
          `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value ?? '')}`
        )
        .join('&')

      const separator = url.includes('?')
        ? '&'
        : '?'

      window.location.href =
        `${url}${separator}${queryParams}`
    } catch {
      sendNotification({
        title: 'Error',
        description: 'Ocurrió un error al intentar pagar',
        backgroundColor: 'warning'
      })
    }
  }

  const handleRedirectToCheckout =
    async (): Promise<void> => {
      const token = Cookies.get('session')
      const usuario = Cookies.get('usuario')

      const cookies: CheckoutCookie[] = [
        {
          name: 'restaurant',
          value: idStore
        },
        {
          name: 'session',
          value: token
        },
        {
          name: 'usuario',
          value: usuario
        }
      ]

      const checkoutUrl =
        process.env.URL_WEB_CHECKOUT

      if (!checkoutUrl) {
        sendNotification({
          title: 'Error',
          description: 'No está configurada la URL de Checkout.',
          backgroundColor: 'warning'
        })

        return
      }

      sendCookieValuesAsQueryParams(
        cookies,
        `${checkoutUrl.replace(/\/$/, '')}/`
      )
    }

  // --------------------------------------------------
  // Drag and drop modules
  // --------------------------------------------------

  const onDragEnd = async (
    result: unknown
  ): Promise<void> => {
    const {
      destination,
      source
    } = result as DragResult

    if (
      !destination ||
      destination.index === source.index
    ) {
      return
    }

    const reorderedModules =
      Array.from(modulesOrder)

    const [removed] =
      reorderedModules.splice(
        source.index,
        1
      )

    if (removed === undefined) {
      return
    }

    reorderedModules.splice(
      destination.index,
      0,
      removed
    )

    const updatedModules =
      reorderedModules.map(
        (module, index) => ({
          ...(typeof module === 'object' &&
          module !== null
            ? module
            : {}),
          mPriority: index + 1
        })
      )

    setModulesOrder(updatedModules)

    await updateModulesOrder(
      updatedModules
    )
  }

  // --------------------------------------------------
  // Collapsed menu
  // --------------------------------------------------

  const handleCollapsedMenu = (): void => {
    setIsCollapsedMenu(previous => !previous)
  }

  const { connected } = useDevServerStatus()

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  const showModal = false

  return (
    <>
      <Head>
        <title>
          {countOrders > 0
            ? title
            : process.env.BUSINESS_TITLE}
        </title>
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
        setDeliveryTimeOpen={handleCloseDeliveryTime}
      />

      <GoalModal
        dailyGoal={goalValue}
        handleGoalChange={setGoalValue}
        isOpen={openGoal}
        loading={loadingGoal}
        setGoalOpen={handleCloseGoal}
        upsertGoal={handleUpsertGoal}
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

      <main
        className={`
          ${styles.main}
          ${pathname === '/' ? styles.noAside : ''}
          ${isCollapsedMenu ? styles.collapsed_main : ''}
        `}
      >
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
          toggleTheme={handleToggleTheme}
        />

        <Aside
          collapsed={collapsed ? true : undefined}
          dataStore={dataStore}
          pathname={pathname}
          isCollapsedMenu={isCollapsedMenu}
          handleCollapsedMenu={handleCollapsedMenu}
          handleClick={handleClick}
          handleOpenDeliveryTime={handleOpenDeliveryTime}
          handleOpenGoal={handleOpenGoal}
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
            backgroundColor: getGlobalStyle(
              '--color-neutral-gray-white'
            ),
            gridArea: 'main',
            overflowY: 'auto',
            marginBottom: '35px'
          }}
          className={styles.main_app_content}
        >
          {children}

          <CreateSales
            setShow={setSalesOpen}
            show={salesOpen}
          />
        </div>

        <Footer />

        <div
          style={{ gridArea: 'right' }}
          className={styles.area_right_container}
        >
          <LateralModal
            handleClose={onCloseLateralMenu}
            open={Boolean(showModalComponent)}
            style={{
              zIndex: getGlobalStyle('--z-index-modal'),
              width: isTablet
                ? '100%'
                : widths[
                    showModalComponent as keyof typeof widths
                  ],
              height:
                heights[
                  showModalComponent as keyof typeof heights
                ]
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

            {components[
              showModalComponent as keyof typeof components
            ] as React.ReactNode ?? null}
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

export const LayoutWithAlert: React.FC<
  LayoutWithAlertProps
> = ({ page }) => {
  const { error } = useContext(Context)

  return (
    <>
      <AlertBox err={error} />
      {page}
    </>
  )
}