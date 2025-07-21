'use client'

import PropTypes from 'prop-types'
import Head from 'next/head'
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams
} from 'next/navigation'
import React, {
  useContext,
  useEffect,
  useState
} from 'react'
import { useApolloClient } from '@apollo/client'
import {
  Aside,
  Header,
  AlertBox,
  Overline,
  Button,
  Toast,
  Orders,
  DeliveryTime,
  getGlobalStyle,
  AwesomeModal,
  LateralModal,
  Plan,
  PaymentAlert,
  Icon,
  AlertInfo,
  FloatingScanButtons
} from 'pkg-components'
import {
  // useConnection,
  useManageQueryParams,
  useTotalSales,
  useMobile,
  useStore,
  useScrollHook,
  useLogout,
  useScrollColor,
  useCreateDeliveryTime,
  useManageNewOrder,
  useModules,
  paymentMethodCards,
  usePosition,
  newMessageSubscription,
  newStoreOrderSubscription,
  useDeliveryTime,
  useUser,
  useSubscriptionValidation,
  useUpdateModuleOrder,
  version as logicalVersion,
  Cookies,
  usePushNotifications
} from 'npm-pkg-hook'

import { Context } from '../../context/Context'
import { Footer } from './Footer/index'
// import useSound from 'use-sound'
import { heights, widths } from './helpers'
import { CreateSales } from '../orders/create'
import packageJson from '../../../package.json'
import { Clients } from '../clients'
import { ScheduleTimings } from '../schedule'
import { Product } from '../product'
import { Categories } from '../categories'
import styles from './styles.module.css'
import { ModalScanner } from '../ModalScanner'

interface MemoLayoutProps {
  children: React.ReactNode
  watch?: any
  settings?: any
}

export const MemoLayout: React.FC<MemoLayoutProps> = ({
  children,
  watch,
  settings
}: MemoLayoutProps) => {
  const location = useRouter()
  const pathname = usePathname()
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
    toggleModal,
    modalsLector,
    setShowComponentModal,
    setStatus
  } = useContext(Context)
  const dataLocation = usePosition(watch, settings)
  const { handleCleanQuery } = useManageQueryParams({ router: location, searchParams: searchParams })
  const [dataUser] = useUser()
  const [modulesOrder, setModulesOrder] = useState<any[]>([])
  const [updateModulesOrder] = useUpdateModuleOrder()

  useModules({
    dataUser,
    callback: (modules: any) => {
      setModulesOrder(modules)
    }
  })
  const [dataStore] = useStore()
  const [count, { loading: loadingCount }] = useTotalSales()
  const style = useScrollHook()
  const { scrollNav } = useScrollColor()
  const [isColapsedMenu, setIsColapsedMenu] = useState(false)
  const { isMobile, isTablet } = useMobile({
    callback: ({ isMobile }: { isMobile: boolean }) => {
      return setIsColapsedMenu(isMobile ? false : isColapsedMenu)
    }
  })

  const [onClickLogout] = useLogout({})
  // const [play] = useSound('/sounds/notification.mp3')

  useEffect(() => {
    const { latitude, longitude } = dataLocation
    if (latitude) {
      window.localStorage.setItem('latitude', latitude)
      window.localStorage.setItem('longitude', longitude)
      window.localStorage.setItem('location', JSON.stringify(dataLocation))
    }
    setAlertBox({ message: '', color: 'success' })
    // eslint-disable-next-line
  }, []);

  const playNotificationSound = () => {
    // play()
  }

  const handleNewMessage = () => {
    playNotificationSound()
  }
  const [countOrders, setCountOrders] = useState(0)
  const client = useApolloClient()
  const idStore = dataStore?.idStore ?? ''
  const [orders, { handleNewOrder }] = useManageNewOrder({
    playNotificationSound,
    setCountOrders,
    setIsOpenOrder,
    idStore,
    client,
    sendNotification,
    setAlertBox
  })
  newMessageSubscription(idStore, handleNewMessage)
  newStoreOrderSubscription(idStore, handleNewOrder)

  const [connectionStatus, setConnectionStatus] = useState('initial')
  const statusConnection = connectionStatus
    ? 'Conexión a internet restablecida.'
    : 'Conexión a internet perdida.'

  // useConnection({ setConnectionStatus })

  useEffect(() => {
    if (connectionStatus === 'initial') return
    if (connectionStatus) {
      setTimeout(() => {
        setConnectionStatus('initial')
      }, 3500)
    }

    sendNotification({
      title: 'Wifi',
      description: statusConnection,
      backgroundColor: !connectionStatus ? 'warning' : 'success'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus])

  /**
   * Closes the lateral menu and performs additional actions.
   */
  const onCloseLateralMenu = () => {
    setShowComponentModal(false)
  }

  const components: Record<number, JSX.Element> = {
    1: <ScheduleTimings isChart={true} />,
    2: <Clients />,
    3: <Product />,
    4: <Categories isDragDisabled={true} />
  }

  const {
    userConsent,
    pushNotificationSupported,
    onClickAskUserPermission,
    error: errorPush,
    loading: loadingPush
  } = usePushNotifications()

  const handleOpenMenu = (): null => {
    setCollapsed(!collapsed)
    setStatus(collapsed ? 'open' : 'close')
    return null
  }

  const handleViewOrder = (pCodeRef: string) => {
    setIsOpenOrder(false)
    location.push(`/pedidos?saleId=${encodeURIComponent(pCodeRef)}`)
  }
  const [openDeliveryTime, setOpenDeliveryTime] = useState(false)
  const handleOpenDeliveryTime = () => {
    setOpenDeliveryTime((prev) => !prev)
  }
  const deliveryTimeMinutes = dataStore?.deliveryTimeMinutes
  const { deliveryTime, handleDeliveryTimeChange } = useDeliveryTime({
    initialTime: `${deliveryTimeMinutes}`
  })
  const { createDeliveryTime, loading: loadingDeliveryTime } = useCreateDeliveryTime({
    sendNotification
  })
  const handleSetIsOpenOrder = () => {
    setIsOpenOrder(!isOpenOrder)
  }
  const {
    loading,
    subscriptionData,
    daysRemaining
  } = useSubscriptionValidation(idStore)
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(true)

  useEffect(() => {
    if (subscriptionData && daysRemaining < 0) {
      setIsSubscriptionExpired(process.env.NODE_ENV !== 'development')
    }
    if (subscriptionData === null && loading === false) {
      setIsSubscriptionExpired(process.env.NODE_ENV !== 'development')
    }
  }, [daysRemaining, subscriptionData, location, loading])

  const title = `(${countOrders}) ${process.env.BUSINESS_TITLE}`

  const version = packageJson.version

  const sendCookieValuesAsQueryParams = (cookies, url) => {
    try {
      if (!Array.isArray(cookies)) {
        throw new Error('Input should be an array of cookies.')
      }

      // Construct the query parameter string
      const queryParams = cookies.map(cookie => { return `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}` }).join('&')

      // Construct the final URL with query parameters
      const finalUrl = `${url}?${queryParams}`

      // Redirect to the final URL
      window.location.href = finalUrl
    } catch (error) {
      sendNotification({
        title: 'Error',
        description: 'Ocurrió un erro al intentar pagar',
        backgroundColor: 'warning'
      })
    }
  }

  const handleRedirectToCheckout = async () => {
    const token = Cookies.get('session')
    const usuario = Cookies.get('usuario')
    const cookies = [
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
    const url = `${process.env.URL_WEB_CHECKOUT}/`
    sendCookieValuesAsQueryParams(cookies, url)
  }
  const showModal = false

  const params = useParams<{ name?: string[] }>()
  const heightsByRoute: Record<string, { [key: number]: string }> = {
    '/dashboard/[...name]': { 4: heights[4] },
    '/dashboard': { 3: heights[3] }
  }
  const customHeights = heightsByRoute[pathname] || heights[showModalComponent as keyof typeof heights]
  const onDragEnd = async (result) => {
    const { destination, source } = result;

    // Si no se ha movido el ítem (destino es null o es el mismo), no hacer nada
    if (!destination || destination.index === source.index) return;

    // Reordenar los módulos
    const reorderedModules = Array.from(modulesOrder);

    // Sacar el módulo que se está moviendo
    const [removed] = reorderedModules.splice(source.index, 1);

    // Insertar el módulo en su nueva posición
    reorderedModules.splice(destination.index, 0, removed);

    // Ajustar las prioridades
    const updatedModules = reorderedModules.map((module, index) => {
      return {
        ...module,
        mPriority: index + 1  // La prioridad se asigna según la nueva posición en el arreglo
      };
    });
    setModulesOrder(updatedModules);
    // Actualizamos el estado con el nuevo orden y prioridades
    await updateModulesOrder(updatedModules)
  };


  const handleColapsedMenu = () => {
    setIsColapsedMenu(!isColapsedMenu)
  }
  return (
    <>
      <Head>
        <title>{countOrders > 0 ? title : process.env.BUSINESS_TITLE}</title>
      </Head>
      {showModal && <AwesomeModal
        customHeight='calc(100vh - 140px)'
        footer={false}
        height='calc(100vh - 140px)'
        onCancel={() => {
          setIsSubscriptionExpired(false)
        }}
        onConfirm={() => {
          setIsSubscriptionExpired(false)
        }}
        onHide={() => {
          setIsSubscriptionExpired(false)
        }}
        show={isSubscriptionExpired}
        size='medium'
        zIndex={getGlobalStyle('--z-index-high')}
      >
        {process.env.NODE_ENV == 'development' && <Plan
          onRedirectTo={handleRedirectToCheckout}
          paymentMethodCards={paymentMethodCards}
          storeImage='/images/3dstore.png'
        />}
      </AwesomeModal>
      }
      <Overline
        bgColor='rgba(119, 119, 119, 0.306)'
        onClick={() => {
          return setIsOpenOrder()
        }}
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
      <main className={`${styles.main} ${!Boolean('/' !== pathname) ? styles.noAside : ''} ${Boolean(isColapsedMenu) ? styles.collapsed_main : ''}`}>
        <Header
          count={count}
          countOrders={countOrders}
          errorPush={errorPush}
          handleOpenMenu={handleOpenMenu}
          isMobile={isMobile}
          isOpenOrder={isOpenOrder}
          loadingCount={loadingCount}
          loadingPush={loadingPush}
          location={location}
          onClickAskUserPermission={onClickAskUserPermission}
          onClickLogout={onClickLogout}
          pushNotificationSupported={pushNotificationSupported}
          salesOpen={salesOpen}
          scrollNav={scrollNav}
          setIsOpenOrder={handleSetIsOpenOrder}
          setSalesOpen={setSalesOpen}
          style={style}
          userConsent={userConsent}
        />

        <Aside
          collapsed={collapsed ? true : undefined}
          dataStore={dataStore}
          pathname={pathname}
          isColapsedMenu={isColapsedMenu}
          handleColapsedMenu={handleColapsedMenu}
          handleClick={handleClick}
          handleOpenDeliveryTime={handleOpenDeliveryTime}
          isElectron={isElectron}
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
            scrollbarColor: getGlobalStyle('--color-neutral-gray-light'),
            marginBottom: '35px'
          }}
        >
          <React.Fragment>
            {children}
            <div className={styles.fade_main_button} />
            {/* {false && !loading && <PaymentAlert text={daysRemaining > 0 ? `Disfruta de tu periodo de prueba, Quedan ${daysRemaining} día(s) de prueba gratuita.` : 'Tu período de prueba gratuita ha finalizado.'} />} */}
            {false &&
              <>
                <FloatingScanButtons
                  onOpenQRModal={() => toggleModal('barcode')}
                  onOpenBarcodeModal={() => toggleModal('qr')}
                />
                <ModalScanner
                  show={modalsLector}
                  onHide={() => {
                    toggleModal(false)
                  }}
                />
              </>
            }
          </React.Fragment>
          <CreateSales setShow={setSalesOpen} show={salesOpen} />
          <div
            style={{
              position: 'fixed',
              left: '50px',
              zIndex: 9999999999,
              bottom: 0,
              width: 'min-content'
            }}
          >
            <Toast
              autoDelete={true}
              autoDeleteTime={7000}
              position='bottom-right'
              toastList={messagesToast}
            />
          </div>
        </div>
        <Footer />
        <div style={{ gridArea: 'right' }} className={styles.area_right_container}>
          <LateralModal
            handleClose={onCloseLateralMenu}
            open={Boolean(showModalComponent)}
            style={{
              zIndex: getGlobalStyle('--z-index-modal'),
              width:
                isTablet ? '100%' : widths[showModalComponent as keyof typeof widths],
              height: heights[showModalComponent as keyof typeof heights]
            } as React.CSSProperties}
            direction='right'
          >
            <Button
              border='none'
              className={styles.button_lateral_close}
              onClick={() => {
                return onCloseLateralMenu()
              }}
            >
              <Icon
                icon='IconCancel'
                size={30}
                color={getGlobalStyle('--color-icons-primary')}
              />
            </Button>
            {components[showModalComponent]}
          </LateralModal>

        </div>

      </main>
    </>
  )
}

MemoLayout.propTypes = {
  children: PropTypes.any,
  settings: PropTypes.any,
  watch: PropTypes.any
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