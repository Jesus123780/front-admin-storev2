import PropTypes from 'prop-types'
import React, {
  useState
} from 'react'
import {
  Column,
  ModalDetailOrder,
  Tag,
  Text,
  getGlobalStyle,
  DropdownMenu,
  numberFormat,
  Divider,
  DragDropContext,
  Droppable,
  Draggable,
  Option
} from 'pkg-components'
import { updateMultipleCache } from '../../../../utils'
import { useApolloClient, useMutation } from '@apollo/client'
import { CHANGE_STATE_STORE_ORDER, GET_ALL_ORDER } from '../../queries'
import {
  useGetSale,
  useStore,
  updateExistingOrders,
  useGetClients,
  statusOrder,
  GET_ALL_COUNT_SALES,
  useReactToPrint,
  useFormatDate
} from 'npm-pkg-hook'
import { useRouter, useSearchParams } from 'next/navigation'
// import { SubItems } from '../Sales/SubItems'
// import { Ticket } from '../Sales/Ticket'
import { dataToPrintProduct } from '../../helpers'
import { OrderStatusType, type OrderGroup } from '../../types'
import styles from './styles.module.css'

interface IDragOrders {
  list: OrderGroup[]
  statusTypes: OrderStatusType[]
  handleChangeState: (state: string, pCodeRef: string) => void
  onDragEnd: () => void
}
export const DragOrders: React.FC<IDragOrders> = ({
  list = [],
  statusTypes = [],
  onDragEnd = () => { },
  handleChangeState = () => { }
}) => {
  // // STATES
  // const searchParams = useSearchParams()
  // const [loading, setLoading] = useState(false)
  // const [dataStore] = useStore()
  // const initialState = {
  //   pCodeRef: null,
  //   pDatCre: null,
  //   channel: 0,
  //   change: 0,
  //   getStoreOrders: []
  // }
  // const invoiceClient = {
  //   clientName: '',
  //   ccClient: '',
  //   ClientAddress: '',
  //   clientNumber: ''
  // }
  // const [isPrinting, setIsPrinting] = useState(false)
  // const [openAction, setOpenAction] = useState(false)
  // const [openModalDetails, setOpenModalDetails] = useState(false)
  // const [pCodeRef, setPCodeRef] = useState(null)
  const [dataOrder, setDataOrder] = useState({
    pCodeRef: ''
  })
  // const [selectedItem, setSelectedItem] = useState({ initialState })
  const [selectedTempItem, setSelectedTempItem] = useState({
    pCodeRef: null
  })
  // const [stateSale, setStateSale] = useState(-1)
  // const router = useRouter()
  // const { query } = router
  // const { saleId } = query || {}
  // const client = useApolloClient()
  // const [modalItem, setModalItem] = useState(false)
  // const [dataOption, setDataOption] = useState({
  //   dataExtra: [],
  //   dataOptional: []
  // })
  // const [dataClientes, { loading: loadingClients }] = useGetClients()
  // const componentRef = useRef()
  // const promiseResolveRef = useRef(null)

  // const handleModalProductSale = (saleId) => {
  //   setOpenModalDetails(!openModalDetails)
  //   router.push(
  //     {
  //       query: {
  //         ...router.query,
  //         saleId: saleId
  //       }
  //     },
  //     undefined,
  //     { shallow: true }
  //   )

  // }
  // // QUERIES
  // const setItemSale = (data) => {
  //   setSelectedTempItem(data)
  //   setSelectedItem(data)
  // }

  // const { getStoreOrderById, loading: saleLoading } = useGetSale({ callback: setItemSale })
  // const sale = selectedItem ?? {
  //   pCodeRef: '',
  //   pDatCre: '',
  //   channel: 0,
  //   change: 0,
  //   getStoreOrders: []
  // }

  // const [changePPStateOrder, { loading: LoadingStatusOrder }] = useMutation(CHANGE_STATE_STORE_ORDER, {
  //   onError: (res) => {
  //     return sendNotification({
  //       title: 'Exitoso',
  //       description: res.changePPStateOrder.message,
  //       backgroundColor: 'error'
  //     })
  //   },
  //   onCompleted: (res) => {
  //     if (!res || !res.changePPStateOrder) {
  //       // No se recibió una respuesta válida o no hay datos en changePPStateOrder
  //       return
  //     }
  //     const { success, message } = res?.changePPStateOrder || {}

  //     if (success) {
  //       const codeRef = pCodeRef
  //       const pSState = stateSale

  //       if (!codeRef || !pSState) {
  //         // Verificar que codeRef y pSState tengan valores válidos
  //         return
  //       }
  //       client.cache.modify({
  //         fields: {
  //           getAllOrdersFromStore(existingOrders = []) {
  //             try {
  //               return updateExistingOrders(existingOrders, codeRef, pSState)
  //             } catch (e) {
  //               return existingOrders
  //             }
  //           }
  //         }
  //       })
  //       sendNotification({
  //         title: 'Exitoso',
  //         description: message,
  //         backgroundColor: 'success'
  //       })
  //       setPCodeRef(null)
  //     }
  //     if (!success) {
  //       sendNotification({
  //         title: 'Exitoso',
  //         description: message,
  //         backgroundColor: 'error'
  //       })
  //     }
  //   }
  // })

  // const handleOpenActions = () => {
  //   setOpenAction(!openAction)
  // }

  // const onClose = () => {
  //   router.push(
  //     {
  //       query: {
  //         ...router.query,
  //         saleId: ''
  //       }
  //     },
  //     undefined,
  //     { shallow: true }
  //   )
  // }

  // const handleCloseModal = () => {
  //   setOpenModalDetails(false)
  //   onClose()
  //   setSelectedItem({
  //     initialState
  //   })
  // }



  // const handleModalItem = (pid) => {
  //   const listShoppingCard = sale?.getStoreOrders?.find((Shopping) => {
  //     return Shopping?.getAllShoppingCard?.productFood?.pId === pid
  //   })
  //   const productModel = listShoppingCard?.getAllShoppingCard || {}
  //   const newSalesOptional = Array.isArray(productModel?.salesExtProductFoodOptional) ? productModel?.salesExtProductFoodOptional.map((sp) => {
  //     return {
  //       ...sp,
  //       ExtProductFoodsSubOptionalAll: sp?.saleExtProductFoodsSubOptionalAll?.map((subP) => {
  //         return {
  //           check: true,
  //           ...subP
  //         }
  //       })
  //     }
  //   }) : []
  //   const objetSubOption = {
  //     dataExtra: productModel?.ExtProductFoodsAll || [],
  //     dataOptional: newSalesOptional || []
  //   }
  //   if (Array.isArray(productModel?.ExtProductFoodsAll) || productModel?.ExtProductFoodsAll?.length || newSalesOptional.length) {
  //     setDataOption(objetSubOption)
  //   } else {
  //     setDataOption({
  //       dataExtra: [],
  //       dataOptional: []
  //     })
  //   }
  // }

  // useEffect(() => {
  //   if (!saleId) return
  //   setOpenModalDetails(true)
  //   setLoading(true)

  //   getStoreOrderById({
  //     variables: {
  //       pCodeRef: saleId || ''
  //     }
  //   }).then((res) => {
  //     const order = res?.data?.getStoreOrderById || {}
  //     if (order) {
  //       setSelectedItem(order || {})
  //       setSelectedTempItem(order || {})
  //     }
  //     setLoading(false)
  //   }).catch(() => {
  //     setLoading(false)
  //   })
  // }, [saleId])

  // const modalItems = {
  //   setModalItem,
  //   handleModalItem,
  //   loading: false,
  //   disabled: true,
  //   sumExtraProducts: 0,
  //   product: {},
  //   modalItem,
  //   dataExtra: dataOption?.dataExtra,
  //   dataOptional: dataOption?.dataOptional
  // }


  // const pDatCre = useFormatDate({ date: sale?.pDatCre })

  // const handlePrint = useReactToPrint({
  //   documentTitle: '',
  //   pageStyle: `padding: 20px`,
  //   content: () => { return componentRef.current },
  //   onBeforeGetContent: () => {
  //     return new Promise((resolve) => {
  //       console.log({promiseResolveRef})
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

  // useEffect(() => {

  //   if (isPrinting && promiseResolveRef.current) {
  //     // Resolves the Promise, letting `react-to-print` know that the DOM updates are completed
  //     promiseResolveRef.current()
  //   }
  //   // eslint-disable-next-line
  // }, [isPrinting])



  // const {
  //   ClientAddress
  // } = invoiceClient ?? {
  //   clientName: '',
  //   ccClient: '',
  //   ClientAddress: '',
  //   clientNumber: ''
  // }

  // const { yearMonthDay, longDayName, formatDateInTimeZone } = useFormatDate({})
  // const localDate = new Date().toLocaleTimeString()
  // const customDate = `${yearMonthDay + ' - ' + localDate + ' - ' + longDayName}`

  // const printProduct = dataToPrintProduct()

  // const dataToPrint = {
  //   srcLogo: '/images/DEFAULTBANNER.png',
  //   addressStore: ClientAddress,
  //   storePhone: dataStore?.storePhone || '',
  //   date: customDate,
  //   client: {
  //     ...invoiceClient
  //   },
  //   ref: sale?.pCodeRef || '',
  //   products: printProduct || [],
  //   total: numberFormat(Math.abs(sale?.totalProductsPrice)) || 0,
  //   change: sale?.change,
  //   NitStore: dataStore?.NitStore || '',
  //   storeName: dataStore?.storeName || ''
  // }

  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })


  const handleShowContextMenu = (e) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setShowContextMenu(!showContextMenu)
  }

  const options = statusTypes?.map((statusType: OrderStatusType) => {
    return {
      optionName: statusType?.name ?? '',
      action: () => handleChangeState(String(statusType?.idStatus), String(dataOrder?.pCodeRef))
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
      {/*
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
      } */}
      {/* <SubItems {...modalItems} /> */}
      {/* {false && <Ticket componentRef={componentRef} dataToPrint={dataToPrint} />} */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              className={styles.row_sales}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {list.map((grp, index) => {
                const { statusKey: title, items = [] } = grp ?? {}
                const bg = grp?.getStatusOrderType?.backgroundColor
                const color = grp?.getStatusOrderType?.color

                return (
                  <Draggable key={title} draggableId={title} index={index}>
                    {(draggableProvided) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                      >
                        <Column className={styles.column_list}>
                          <Text
                            as='h2'
                            className={styles.title}
                            font='light'
                          >
                            {title} ({items.length})
                          </Text>

                          {items.map((item) => {
                            const isSelected = false // Replace with logic if needed
                            const style = isSelected
                              ? {
                                backgroundColor: getGlobalStyle('--color-primary-pink-light'),
                                color: getGlobalStyle('--color-text-white')
                              }
                              : {}

                            return (
                              <Column
                                key={item?.pCodeRef}
                                className={styles.card}
                                style={style}
                                // onClick={() => handleGetOneOrder(item)}
                                onContextMenu={(e) => {
                                  setDataOrder({
                                    pCodeRef: item?.pCodeRef
                                  })
                                  handleShowContextMenu(e)
                                }}
                              >
                                <Text as='h2' size='lg'>
                                  {item?.pCodeRef}
                                </Text>

                                <Column>
                                  <Text>
                                    <Divider
                                      marginBottom={getGlobalStyle('--spacing-md')}
                                      marginTop={getGlobalStyle('--spacing-md')}
                                    />
                                    <Text
                                      color={isSelected ? 'white' : 'default'}
                                      size='sm'
                                      as='h2'
                                      weight='bold'
                                    >
                                      {numberFormat(item.totalProductsPrice)}
                                    </Text>
                                    <Divider
                                      marginBottom={getGlobalStyle('--spacing-md')}
                                      marginTop={getGlobalStyle('--spacing-md')}
                                    />
                                    <Tag
                                      label={title}
                                      style={{
                                        borderRadius: '6px',
                                        padding: '15px',
                                        backgroundColor: bg,
                                        color
                                      }}
                                    />
                                  </Text>
                                </Column>
                                <Divider
                                  marginBottom={getGlobalStyle('--spacing-md')}
                                  marginTop={getGlobalStyle('--spacing-md')}
                                />
                              </Column>
                            )
                          })}
                        </Column>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
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
