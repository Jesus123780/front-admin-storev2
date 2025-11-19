'use client'
import groupBy from 'lodash/groupBy'
import {
    useFormTools,
    useGetSale,
    useManageQueryParams,
    useMobile,
    useOrdersFromStore,
    useOrderStatusTypes,
    usePrintSaleTicket,
    UtilDateRange
} from 'npm-pkg-hook'
import {
    Column,
    DateRange,
    Divider,
    getGlobalStyle,
    HorizontalScrollWrapper,
    Icon,
    InputQuery,
    LayoutSwitcher,
    ModalDetailOrder,
    Row,
    Text
} from 'pkg-components'
import { EOrderQueryParams } from 'pkg-components/stories/organisms/ModalDetailOrder/type'
import React, {
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react'

import { Context } from '@/context/Context'

import { GetAllOrdersFromStoreResponse, OrderGroup } from '../types'
import { DragOrders } from './components/DragOrders'
import { ListOrders } from './components/ListOrders'
import { ModalQueries } from './components/ModalQueries'
import { ModalStatusTypes } from './components/ModalStatusTypes'
import { StepperOrderStatus } from './components/Stepper'
import { HORIZONTAL_SCROLL_WRAPPER } from './constants'
import styles from './styles.module.css'

interface IOrdersView {
    query?: EOrderQueryParams,
}
export const OrdersView = ({
    query,
}: IOrdersView) => {
    // STATES
    const [openModalQueries, setOpenModalQueries] = useState(false)
    const [layout, setLayout] = useState<'list' | 'columns'>('list')
    const [inCludeRange, setInCludeRange] = useState(true)
    const [openModalStatusTypes, setOpenModalStatusTypes] = useState(false)
    const [showStepper] = useState<boolean>(false)
    const [orders, setOrders] = useState<Record<string, OrderGroup[]>>({})
    const [ordersList, setOrdersList] = useState<OrderGroup[]>([])
    const { sendNotification } = useContext(Context)
    const [activeStep, setActiveStep] = useState(0)
    const initialDates = useMemo(() => {
        const todayRange = new UtilDateRange()
        const { start, end } = todayRange.getRange()
        return { fromDate: start, toDate: end }
    }, [])

    // HOOKS
    const { data: statusTypes } = useOrderStatusTypes()
    const { isTablet } = useMobile()
    const [handlePrintSale] = usePrintSaleTicket()

    const { handleQuery, getParams } = useManageQueryParams()
    const queryPCodeRef = getParams<{ CODE: string }>(EOrderQueryParams.CODE)
    const [openSaleDetailOrder, setOpenSaleDetailOrder] = useState(false)
    const { handleGetSale } = useGetSale()

    const [handleChange, handleSubmit, setDataValue, { dataForm }] = useFormTools({
        initialValues: initialDates
    })

    interface StatusType {
        name: string
    }
    const [, { refetch }] = useOrdersFromStore({
        fromDate: dataForm.fromDate,
        toDate: dataForm.toDate,
        callback: (data: GetAllOrdersFromStoreResponse) => {
            const key = 'status'
            setOrdersList(data?.getAllSalesStore ?? [])
            const grouped = groupBy(data?.getAllSalesStore ?? [], key)
            // 🔹 Asegura que todos los statusTypes existan aunque no haya órdenes


            type GroupedOrdersByStatus = Record<string, OrderGroup[]>

            const fillGroupedByStatusTypes = statusTypes?.reduce<GroupedOrdersByStatus>(
                (acc: GroupedOrdersByStatus, statusType: StatusType) => {
                    acc[statusType.name] = (grouped as GroupedOrdersByStatus)[statusType.name] ?? []
                    return acc
                },
                {} as GroupedOrdersByStatus
            )
            if (statusTypes) {
                return setOrders(fillGroupedByStatusTypes)
            }
            return setOrders(grouped)
        }
    })

    const handleClickPrint = async (pCodeRef: string) => {
        await handlePrintSale(pCodeRef)
    }

    useEffect(() => {
        type GroupedOrdersByStatus = Record<string, OrderGroup[]>
        setDataValue({ fromDate: initialDates.fromDate, toDate: initialDates.toDate })
        const fillGroupedByStatusTypes = statusTypes?.reduce<GroupedOrdersByStatus>(
            (acc: GroupedOrdersByStatus, statusType: StatusType) => {
                acc[statusType.name] = (orders as GroupedOrdersByStatus)[statusType.name] ?? []
                return acc
            },
            {} as GroupedOrdersByStatus
        )
        if (statusTypes) {
            return setOrders(fillGroupedByStatusTypes)
        }
    }, [])


    useEffect(() => {
        if (query === EOrderQueryParams.CODE) {
            (async () => {
                const { data } = await handleGetSale(queryPCodeRef)
                console.log('🚀 ~ OrdersView ~ data:', data)
                setOpenSaleDetailOrder(true)

            })()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryPCodeRef])

    return (
        <div
            className={styles.container}
        >
            {(query === EOrderQueryParams.CODE && queryPCodeRef !== undefined) &&
                <ModalDetailOrder
                    open={openSaleDetailOrder}
                    onHide={() => setOpenSaleDetailOrder(false)}
                />
            }
            <Column>
                <ModalQueries
                    open={openModalQueries}
                    inCludeRange={inCludeRange}
                    dataForm={dataForm}
                    setInCludeRange={setInCludeRange}
                    handleChange={handleChange}
                    onClose={() => setOpenModalQueries(!openModalQueries)}
                />
                <Row justifyContent='space-between'>
                    <DateRange
                        endDate={dataForm.toDate ?? initialDates.toDate}
                        startDate={dataForm.fromDate ?? initialDates.fromDate}
                    />
                    <>
                        <div className={styles.container_query}>
                            <InputQuery
                                className={styles.input_query}
                                dataForm={dataForm}
                                handleChange={(e) => {
                                    handleChange(e)
                                    refetch({
                                        fromDate: dataForm.fromDate,
                                        toDate: dataForm.toDate,
                                        search: e.target.value
                                    })
                                }}
                                placeholder='Buscar'
                            />
                        </div>
                        <button
                            onClick={() => setOpenModalQueries(true)}
                            style={{
                                padding: getGlobalStyle('--spacing-none'),
                                height: '50px',
                                backgroundColor: getGlobalStyle('--color-base-transparent'),
                                margin: `0 ${getGlobalStyle('--spacing-xl')}`,
                                cursor: 'pointer'
                            }}
                        >
                            <Row alignItems='center'>
                                <Icon
                                    icon='IconConfig'
                                    size={20}
                                    color={getGlobalStyle(openModalQueries ? '--color-icons-primary' : '--color-text-black')}
                                />
                                <Text>
                                    Filtros
                                </Text>
                            </Row>
                        </button>
                        <LayoutSwitcher
                            setLayout={setLayout}
                            layout={layout}
                        />
                    </>
                </Row>
                <Divider marginTop={getGlobalStyle('--spacing-xl')} />
                {showStepper
                    && <StepperOrderStatus
                        callBack={() => {
                            setOpenModalStatusTypes(!openModalStatusTypes)
                        }}
                        active={activeStep}
                        steps={statusTypes?.map((status: StatusType) => status.name) ?? []}
                        setActive={async (step: number) => {
                            setActiveStep(step)
                        }}
                    />
                }
                {layout === 'columns' &&
                    <>
                        <HorizontalScrollWrapper
                            targetId={HORIZONTAL_SCROLL_WRAPPER}
                            columns={statusTypes?.length ?? 1}
                            className={styles['horizontal-scroll-wrapper']}
                            style={isTablet ? { bottom: getGlobalStyle('--spacing-6xl') } : {}}
                        />
                        <div
                            id={HORIZONTAL_SCROLL_WRAPPER}
                            style={{
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                gap: '1rem',
                                padding: '1rem'
                            }}
                        >
                            <DragOrders
                                orders={orders}
                                statusTypes={statusTypes}
                                onPrint={handleClickPrint}
                            />
                        </div>
                    </>
                }
                {layout === 'list' &&
                    <ListOrders
                        orders={ordersList}
                        handlePrint={handleClickPrint}
                        handleCopy={async (pCodeRef: string) => {
                            try {
                                await navigator.clipboard.writeText(pCodeRef)
                                sendNotification({
                                    description: `  Código de orden ${pCodeRef} copiado al portapapeles.`,
                                    title: 'Éxito',
                                    backgroundColor: 'success',
                                })
                            } catch (e) {
                                if (e instanceof Error) {
                                    sendNotification({
                                        description: 'No se pudo copiar el código de la orden.',
                                        title: 'Error',
                                        backgroundColor: 'error',

                                    })
                                }
                            }
                        }}
                        handleOpenSale={async (pCodeRef: string) => {
                            handleQuery('sale', pCodeRef)
                            await handleGetSale(pCodeRef)
                            setOpenSaleDetailOrder(true)
                        }}
                    />
                }
                <ModalStatusTypes
                    openModalStatusTypes={openModalStatusTypes}
                    setOpenModalStatusTypes={setOpenModalStatusTypes}
                />
            </Column>
        </div>
    )
}
