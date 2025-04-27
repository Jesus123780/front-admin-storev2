'use client'

import PropTypes from 'prop-types'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
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
  Loading,
  Orders,
  DeliveryTime,
  getGlobalStyle,
  AwesomeModal,
  Plan,
  Divider,
  PaymentAlert,
  Icon
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
// import { ScheduleTimings } from '../../container/Schedule'
// import { LateralModal } from '../../container/dashboard/styled'
// import { Clients } from '../../container/clients'
import { Footer } from './Footer/index'
// import { Categories } from '../../container/Categories'
// import { Food } from '../../container/update/Products/food'
// import useSound from 'use-sound'
import { heights, widths } from './helpers'
import { CreateSales } from '../orders/create'
import packageJson from '../../../package.json'
import styles from './styles.module.css'

// const DynamicGenerateSales = dynamic(
//   () => {
//     return import('../../container/Sales').then((module) => {
//       return module.GenerateSales
//     })
//   },
//   {
//     loading: () => {
//       return <Loading />
//     },
//     ssr: false
//   }
// )

export const MemoLayout = ({
  children,
  watch,
  settings
}) => {
  const location = useRouter()
  const pathname = usePathname()

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
    setShowComponentModal,
    setStatus
  } = useContext(Context)
  const dataLocation = usePosition(watch, settings)
  const { handleCleanQuery } = useManageQueryParams()
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
  const { isMobile } = useMobile()
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

    // If the value of `showModalComponent` is equal to 4, it cleans the categories query.
    if (showModalComponent === 4) {
      handleCleanQuery('categories')
    }
  }

  const components = {
    // 1: <ScheduleTimings isChart={true} />,
    // 2: <Clients />,
    // 3: <Food />,
    // 4: <Categories isDraggableItems={true} />
  }

  const {
    userConsent,
    pushNotificationSupported,
    onClickAskUserPermission,
    error: errorPush,
    loading: loadingPush
  } = usePushNotifications()

  const handleOpenMenu = ():null => {
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
    setOpenDeliveryTime(!openDeliveryTime)
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

  const heightsByRoute: Record<string, { [key: number]: string }> = {
    '/dashboard/[...name]': { 4: 'calc(100vh - 50px)' }
  }
  const customHeights = heightsByRoute[location?.route] ?? heights[showModalComponent]

  
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
      </AwesomeModal>}
      <Overline
        bgColor='rgba(119, 119, 119, 0.306)'
        onClick={() => {
          return setIsOpenOrder()
        }}
        show={isOpenOrder}
        zIndex={getGlobalStyle('--z-index-99999')}
      />
      {/* <DeliveryTime
        createDeliveryTime={createDeliveryTime}
        deliveryTime={deliveryTime}
        handleDeliveryTimeChange={handleDeliveryTimeChange}
        isOpen={openDeliveryTime}
        loading={loadingDeliveryTime}
        setDeliveryTimeOpen={handleOpenDeliveryTime}
      /> */}
      <Orders
        deliveryTimeMinutes={deliveryTimeMinutes}
        handleSetIsOpenOrder={handleSetIsOpenOrder}
        handleViewOrder={handleViewOrder}
        isOpen={isOpenOrder}
        orders={orders}
      />
      
      {/* <AlertBox err={error} /> */}

      {/* {showModal && !loading && <AlertInfo message= type='warning' />} */}
      <main className={`${styles.main} ${!Boolean('/' !== pathname) ? styles.noAside : ''}`}>
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
          countOrders={countOrders as number}
          dataStore={dataStore}
          handleClick={handleClick}
          handleOpenDeliveryTime={handleOpenDeliveryTime}
          isElectron={isElectron}
          isMobile={isMobile}
          loading={false}
          loadingDeliveryTime={loadingDeliveryTime}
          location={location}
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
            marginBottom: '4.6875rem'
          }}
        >
          <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
          <>
            {children}

            {!loading && <PaymentAlert text={daysRemaining > 0 ? `Disfruta de tu periodo de prueba, Quedan ${daysRemaining} día(s) de prueba gratuita.` : 'Tu período de prueba gratuita ha finalizado.'} />}
          </>
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
              position={'bottom-right'}
              toastList={messagesToast}
            />
          </div>
        </div>
        <Footer />

        <div style={{ gridArea: 'right' }}>
          <Overline
            onClick={() => {
              return onCloseLateralMenu()
            }}
            show={showModalComponent}
            zIndex='99990000'
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          />
          {/* <LateralModal
            height={customHeights ? customHeights[[showModalComponent]] : heights[showModalComponent]}
            open={showModalComponent}
            style={{ width: widths[showModalComponent] }}
          >
            <Button
              onClick={() => {
                return onCloseLateralMenu()
              }}
              style={{
                border: 'none',
                boxShadow: 'none',
                padding: 10
              }}
            >
              <Icon icon='IconCancel' size='25px' />
            </Button>
            {components[showModalComponent]}
          </LateralModal> */}

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

export const LayoutWithAlert = (page) => {
  const { error } = useContext(Context)
  return (
    <>
      <AlertBox err={error} />
      {page}
    </>
  )
}