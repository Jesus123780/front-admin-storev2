import PropTypes from 'prop-types'
import React, {
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import {
  Column,
  ModalDetailOrder,
  Tag,
  Row,
  Text,
  getGlobalStyle,
  DropdownMenu,
  numberFormat,
  Divider,
  BGColor,
  PColor
} from 'pkg-components'
import { Context } from '../../context/Context'
import { updateMultipleCache } from '../../utils'
import { useApolloClient, useMutation } from '@apollo/client'
import { CHANGE_STATE_STORE_PEDIDO, GET_ALL_PEDIDOS } from './queries'
import {
  useGetSale,
  useStore,
  updateExistingOrders,
  useGetClients,
  statusOrder,
  GET_ALL_COUNT_SALES,
  // useReactToPrint,
  useFormatDate
} from 'npm-pkg-hook'
import { useRouter, useSearchParams } from 'next/navigation'
// import { SubItems } from '../Sales/SubItems'
// import { Ticket } from '../Sales/Ticket'
import { dataToPrintProduct } from './helpers'
import styles from './styles.module.css'

export const DragOrders = ({
  list = []
}) => {
  // STATES
  const { sendNotification } = useContext(Context)
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [dataStore] = useStore()
  const initialState = {
    pCodeRef: null,
    pDatCre: null,
    channel: 0,
    change: 0,
    getStoreOrders: []
  }
  const invoiceClient = {
    clientName: '',
    ccClient: '',
    ClientAddress: '',
    clientNumber: ''
  }
  const [isPrinting, setIsPrinting] = useState(false)
  const [openAction, setOpenAction] = useState(false)
  const [openModalDetails, setOpenModalDetails] = useState(false)
  const [pCodeRef, setPCodeRef] = useState(null)
  const [dataOrder, setDataOrder] = useState({
    pSState: '',
    pCodeRef: ''
  })
  const [selectedItem, setSelectedItem] = useState({ initialState })
  const [selectedTempItem, setSelectedTempItem] = useState({
    pCodeRef: null
  })
  const [stateSale, setStateSale] = useState(-1)
  const router = useRouter()
  const { query } = router
  const { saleId } = query || {}
  const client = useApolloClient()
  const [modalItem, setModalItem] = useState(false)
  const [dataOption, setDataOption] = useState({
    dataExtra: [],
    dataOptional: []
  })
  const [dataClientes, { loading: loadingClients }] = useGetClients()
  const componentRef = useRef()
  const promiseResolveRef = useRef(null)

  const handleModalProductSale = (saleId) => {
    setOpenModalDetails(!openModalDetails)
    router.push(
      {
        query: {
          ...router.query,
          saleId: saleId
        }
      },
      undefined,
      { shallow: true }
    )

  }
  // QUERIES
  const setItemSale = (data) => {
    setSelectedTempItem(data)
    setSelectedItem(data)
  }

  const { getStoreOrderById, loading: saleLoading } = useGetSale({ callback: setItemSale })
  const sale = selectedItem ?? {
    pCodeRef: '',
    pDatCre: '',
    channel: 0,
    change: 0,
    getStoreOrders: []
  }

  const [changePPStatePPedido, { loading: LoadingStatusOrder }] = useMutation(CHANGE_STATE_STORE_PEDIDO, {
    onError: (res) => {
      return sendNotification({
        title: 'Exitoso',
        description: res.changePPStatePPedido.message,
        backgroundColor: 'error'
      })
    },
    onCompleted: (res) => {
      if (!res || !res.changePPStatePPedido) {
        // No se recibió una respuesta válida o no hay datos en changePPStatePPedido
        return
      }
      const { success, message } = res?.changePPStatePPedido || {}

      if (success) {
        const codeRef = pCodeRef
        const pSState = stateSale

        if (!codeRef || !pSState) {
          // Verificar que codeRef y pSState tengan valores válidos
          return
        }
        client.cache.modify({
          fields: {
            getAllOrdersFromStore(existingOrders = []) {
              try {
                return updateExistingOrders(existingOrders, codeRef, pSState)
              } catch (e) {
                return existingOrders
              }
            }
          }
        })
        sendNotification({
          title: 'Exitoso',
          description: message,
          backgroundColor: 'success'
        })
        setPCodeRef(null)
      }
      if (!success) {
        sendNotification({
          title: 'Exitoso',
          description: message,
          backgroundColor: 'error'
        })
      }
    }
  })

  const handleOpenActions = () => {
    setOpenAction(!openAction)
  }

  const onClose = () => {
    router.push(
      {
        query: {
          ...router.query,
          saleId: ''
        }
      },
      undefined,
      { shallow: true }
    )
  }

  const handleCloseModal = () => {
    setOpenModalDetails(false)
    onClose()
    setSelectedItem({
      initialState
    })
  }

  const handleChangeState = async (stateSale, pCodeRef) => {
    try {
      setPCodeRef(pCodeRef)
      setShowContextMenu(false)
      setStateSale(stateSale)
      setDataOrder({
        pSState: stateSale,
        pCodeRef: ''
      })
      await changePPStatePPedido({
        variables: {
          pPStateP: stateSale,
          pCodeRef: pCodeRef,
          pDatMod: new Date()
        },
        update: async (cache, { data: { getStoreOrdersFinal } }) => {
          const updatedData = {
            nameFun1: getStoreOrdersFinal
          }
          if (pCodeRef !== 4) {
            client.query({
              query: GET_ALL_COUNT_SALES,
              fetchPolicy: 'network-only',
              onCompleted: (data) => {
                client.writeQuery({ query: GET_ALL_COUNT_SALES, data: { getTodaySales: data.countSales.todaySales } })
              }
            })
          }
          return updateMultipleCache({
            cache,
            queries: [
              { query: GET_ALL_PEDIDOS, dataNew: updatedData.nameFun1, nameFun: 'getStoreOrdersFinal' }
            ]
          })
        }
      })
    } catch (error) {
      sendNotification({
        title: 'Error',
        description: error.message ?? 'Error al cambiar el estado de la orden',
        backgroundColor: 'error'
      })
    }

  }


  const handleModalItem = (pid) => {
    const listShoppingCard = sale?.getStoreOrders?.find((Shopping) => {
      return Shopping?.getAllShoppingCard?.productFood?.pId === pid
    })
    const productModel = listShoppingCard?.getAllShoppingCard || {}
    const newSalesOptional = Array.isArray(productModel?.salesExtProductFoodOptional) ? productModel?.salesExtProductFoodOptional.map((sp) => {
      return {
        ...sp,
        ExtProductFoodsSubOptionalAll: sp?.saleExtProductFoodsSubOptionalAll?.map((subP) => {
          return {
            check: true,
            ...subP
          }
        })
      }
    }) : []
    const objetSubOption = {
      dataExtra: productModel?.ExtProductFoodsAll || [],
      dataOptional: newSalesOptional || []
    }
    if (Array.isArray(productModel?.ExtProductFoodsAll) || productModel?.ExtProductFoodsAll?.length || newSalesOptional.length) {
      setDataOption(objetSubOption)
    } else {
      setDataOption({
        dataExtra: [],
        dataOptional: []
      })
    }
  }

  useEffect(() => {
    if (!saleId) return
    setOpenModalDetails(true)
    setLoading(true)

    getStoreOrderById({
      variables: {
        pCodeRef: saleId || ''
      }
    }).then((res) => {
      const order = res?.data?.getStoreOrderById || {}
      if (order) {
        setSelectedItem(order || {})
        setSelectedTempItem(order || {})
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [saleId])

  const modalItems = {
    setModalItem,
    handleModalItem,
    loading: false,
    disabled: true,
    sumExtraProducts: 0,
    product: {},
    modalItem,
    dataExtra: dataOption?.dataExtra,
    dataOptional: dataOption?.dataOptional
  }


  const pDatCre = useFormatDate({ date: sale?.pDatCre })

  // const handlePrint = useReactToPrint({
  //   documentTitle: '',
  //   pageStyle: `padding: 20px`,
  //   content: () => { return componentRef.current },
  //   onBeforeGetContent: () => {
  //     return new Promise((resolve) => {
  //       promiseResolveRef.current = resolve
  //       setIsPrinting(true)
  //     })
  //   },
  //   onAfterPrint: () => {
  //     // Reset the Promise resolve so we can print again
  //     promiseResolveRef.current = null
  //     setIsPrinting(false)
  //   }
  // })
  const handlePrint = () => {
    console.log("Print function called");
  }
  useEffect(() => {

    if (isPrinting && promiseResolveRef.current) {
      // Resolves the Promise, letting `react-to-print` know that the DOM updates are completed
      promiseResolveRef.current()
    }
    // eslint-disable-next-line
  }, [isPrinting])

  const handleGetOneOrder = async (item) => {
    const { pSState } = item || {}
    setStateSale(pSState)
    const { pCodeRef } = item || {}
    await getStoreOrderById({
      variables: {
        pCodeRef: pCodeRef === undefined || pCodeRef === null ? '' : pCodeRef
      }
    })
    const params = new URLSearchParams(searchParams.toString())
    params.set('saleId', pCodeRef) // añade o actualiza el query param

    router.push(`?${params.toString()}`)
    handleModalProductSale(pCodeRef)
  }

  const {
    ClientAddress
  } = invoiceClient ?? {
    clientName: '',
    ccClient: '',
    ClientAddress: '',
    clientNumber: ''
  }

  const { yearMonthDay, longDayName, formatDateInTimeZone } = useFormatDate({})
  const localDate = new Date().toLocaleTimeString()
  const customDate = `${yearMonthDay + ' - ' + localDate + ' - ' + longDayName}`

  const printProduct = dataToPrintProduct()

  const dataToPrint = {
    srcLogo: '/images/DEFAULTBANNER.png',
    addressStore: ClientAddress,
    storePhone: dataStore?.storePhone || '',
    date: customDate,
    client: {
      ...invoiceClient
    },
    ref: sale?.pCodeRef || '',
    products: printProduct || [],
    total: numberFormat(Math.abs(sale?.totalProductsPrice)) || 0,
    change: sale?.change,
    NitStore: dataStore?.NitStore || '',
    storeName: dataStore?.storeName || ''
  }


  const color = {
    0: '#63ba3c',
    1: getGlobalStyle('--color-feedback-warning-light'),
    2: getGlobalStyle('--color-feedback-warning-light'),
    3: '#ff9a1f',
    4: '#63ba3c',
    5: PColor
  }

  const bgColor = {
    1: '#FDF6B2',
    2: '#FEE4E2',
    3: getGlobalStyle('--color-primary-red-bg'),
    4: getGlobalStyle('--color-primary-red-bg'),
    5: getGlobalStyle('--color-primary-red-bg')
  }
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })


  const handleShowContextMenu = (e) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setShowContextMenu(!showContextMenu)
  }
  const options = Object.keys(statusOrder).slice(1).map((status, index) => {
    return {
      optionName: statusOrder[status],
      action: () => { return handleChangeState(index + 1, dataOrder?.pCodeRef) }
    }
  })
  return (
    <div>
      {showContextMenu && (
        <DropdownMenu
          options={options}
          position={contextMenuPosition}
          show={showContextMenu}
        />
      )}
      {(openModalDetails) &&
        <ModalDetailOrder
          LoadingStatusOrder={LoadingStatusOrder}
          dataModal={sale}
          dataStore={dataStore}
          disabledPrint={loadingClients}
          handleChangeState={handleChangeState}
          handleModalItem={handleModalItem}
          handleModalProductSale={handleModalProductSale}
          handleOpenActions={handleOpenActions}
          handlePrint={handlePrint}
          loading={loading || saleLoading}
          onClose={handleCloseModal}
          onPress={handleGetOneOrder}
          openAction={openAction}
          pDatCre={pDatCre}
          setModalItem={setModalItem}
          setStateSale={setStateSale}
          stateSale={stateSale}
          totalProductsPrice={numberFormat(Math.abs(sale?.totalProductsPrice)) || 0}
        />
      }
      {/* <SubItems {...modalItems} /> */}
      {/* {false && <Ticket componentRef={componentRef} dataToPrint={dataToPrint} />} */}
      <Column>
        <Row className={styles.row_sales} >
          {(list?.length > 0 && Array.isArray(list)) && list.map((grp) => {
            const uniqueItems = grp?.items?.length > 0 && grp?.items?.filter((item, itemIdx, arr) => {
              const foundIdx = arr.findIndex(
                (otherItem, otherItemIdx) => { return item?.pCodeRef === otherItem?.pCodeRef && itemIdx !== otherItemIdx }
              )
              return foundIdx === -1
            })
            return (
              <Column key={grp.title}>
                <Column>
                  <Text as='h2' className={styles.title} >
                    {grp.title} {(Number(grp?.items?.length ?? 0))}
                  </Text>
                </Column>
                {uniqueItems?.length > 0 && Array.from(new Set(uniqueItems?.map((item) => {
                  const isSelected = selectedTempItem && selectedTempItem?.pCodeRef === item?.pCodeRef

                  const style = {
                    backgroundColor: isSelected ? getGlobalStyle('--color-primary-pink-light') : BGColor,
                    zIndex: isSelected ? 1 : 0,
                    color: getGlobalStyle('--color-text-white')
                  }
                  const status = item.pSState
                  return (
                    <Column
                      className={styles.card}
                      draggable={false}
                      justifyContent='space-between'
                      key={item?.pCodeRef}
                      onClick={() => {
                        return handleGetOneOrder(item)
                      }}
                      onContextMenu={(e) => {
                        setDataOrder({
                          pSState: status,
                          pCodeRef: item?.pCodeRef
                        })
                        handleShowContextMenu(e)
                      }}
                      style={isSelected ? style : {}}
                    >
                      <Column>
                        {item?.pCodeRef}
                      </Column>
                      <Column>
                        <Text
                          className='ghx-summary'
                        >
                          <Text
                            color={isSelected ? 'white' : 'default'}
                            size='sm'
                            weight='bold'
                          >
                            {numberFormat(item.totalProductsPrice)}
                          </Text>
                          <Tag
                            label={statusOrder[status]}
                            style={{
                              borderRadius: '6px',
                              padding: '15px',
                              backgroundColor: bgColor[status],
                              color: color[status]
                            }}
                          >
                          </Tag>
                        </Text>
                      </Column>
                      <Column>
                        <Text color={isSelected ? 'white' : 'default'} size='sm'>
                          {formatDateInTimeZone(item?.pDatCre)}
                        </Text>
                      </Column>
                      <Divider
                        borderBottom
                        marginBottom={getGlobalStyle('--spacing-md')}
                        marginTop={getGlobalStyle('--spacing-md')}
                      />
                      <Row alignItems='center' justifyContent='space-between'>
                        <div color={color[item?.pSState || null]}>
                          <span className='bubble-outer-dot'>
                            <span className='bubble-inner-dot'></span>
                          </span>
                        </div>
                        <Tag label={item?.channel === 0 ? `${process.env.BUSINESS_TITLE}` : 'Restaurante'} />
                      </Row>
                    </Column>
                  )
                })))}
              </Column>
            )
          })}
        </Row>
      </Column>
    </div>
  )
}

DragOrders.propTypes = {
  data: PropTypes.array,
  dataConcludes: PropTypes.array,
  dataProgressOrder: PropTypes.array,
  dataReadyOrder: PropTypes.array,
  dataRechazados: PropTypes.array,
  list: PropTypes.shape({
    length: PropTypes.number,
    map: PropTypes.func
  }),
  setList: PropTypes.func
}

export default DragOrders