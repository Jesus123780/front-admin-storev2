'use client'
import groupBy from 'lodash/groupBy'
import {
    useChangeStateOrder,
    useFormTools,
    useOrdersFromStore,
    useOrderStatusTypes,
    useUpdateOrderStatusPriorities,
    UtilDateRange,
} from 'npm-pkg-hook'
import {
    AlertInfo,
    Column,
    DateRange,
    Divider,
    getGlobalStyle,
    InputDate,
    InputQuery,
    ToggleSwitch
} from 'pkg-components'
import React, {
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react'

import { Context } from '@/context/Context'

import { GetAllOrdersFromStoreResponse, OrderGroup } from '../types'
import { DragOrders } from './components/DragOrders'
import { ModalStatusTypes } from './components/ModalStatusTypes'
import { StepperOrderStatus } from './components/Stepper'
import styles from './styles.module.css'

export const OrdersView = () => {

    // STATES
    const [inCludeRange, setInCludeRange] = useState(true)
    const [openModalStatusTypes, setModalStatusTypes] = useState(false)
    const [orders, setOrders] = useState<Record<string, OrderGroup[]>>({})
    const { sendNotification } = useContext(Context)
const [activeStep, setActiveStep] = useState(0)
    const initialDates = useMemo(() => {
        const todayRange = new UtilDateRange()
        const { start, end } = todayRange.getRange()
        return { fromDate: start, toDate: end }
    }, [])


    // HOOKS
    const { data: statusTypes } = useOrderStatusTypes()
    const [changeStateOrder] = useChangeStateOrder({
        sendNotification
    })
    const [updatePriorities] = useUpdateOrderStatusPriorities({
        sendNotification
    })

    const [handleChange, handleSubmit, setDataValue, { dataForm }] = useFormTools({
        initialValues: initialDates
    })

    interface StatusType {
        name: string
    }

    const [_data, { refetch }] = useOrdersFromStore({
        fromDate: dataForm.fromDate,
        toDate: dataForm.toDate,
        callback: (data: GetAllOrdersFromStoreResponse) => {
            const key = 'status'
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

    const handleChangeState = async (idStatus: string, pCodeRef: string) => {
        await changeStateOrder({
            idStatus,
            pCodeRef: pCodeRef,
            pDatMod: new Date()
        })
    }

    useEffect(() => {
        type GroupedOrdersByStatus = Record<string, OrderGroup[]>

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


    return (
        <div style={{ padding: getGlobalStyle('--spacing-xl') }} className={styles.container}>
            <Column>
                <AlertInfo
                    message='Permite actualizar y gestionar el estado actual de los pedidos en el sistema, 
                    proporcionando control sobre su flujo operativo y asegurando trazabilidad mediante un 
                    identificador de referencia y fecha de modificación.'
                    type='warning'
                />
                <Divider marginTop={getGlobalStyle('--spacing-xl')} />
                <div className={styles['quick-filters']}>
                    {!inCludeRange &&
                        <ToggleSwitch
                            checked={inCludeRange}
                            id='include-range'
                            label='Incluir rango de fechas en la busqueda'
                            onChange={() => {
                                setInCludeRange(!inCludeRange)
                            }}
                            successColor='green'
                        />
                    }
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
                            placeholder='buscar por ref de orden'
                        />
                    </div>
                    <InputDate
                        date={dataForm.fromDate}
                        label='Desde'
                        disabled={!inCludeRange}
                        onChange={(value) => {
                            handleChange({
                                target: {
                                    name: 'fromDate',
                                    value
                                }
                            })
                        }}
                        value={dataForm.fromDate}
                    />
                    <InputDate
                        disabled={!inCludeRange}
                        date={dataForm.toDate}
                        label='Hasta'
                        onChange={(value) => {
                            handleChange({
                                target: {
                                    name: 'toDate',
                                    value
                                }
                            })
                        }}
                        value={dataForm.toDate}
                    />
                </div>
                <Divider marginTop={getGlobalStyle('--spacing-xl')} />
                <DateRange
                    endDate={dataForm.toDate ?? initialDates.toDate}
                    startDate={dataForm.fromDate ?? initialDates.fromDate}
                />
                <Divider marginTop={getGlobalStyle('--spacing-xl')} />
                <StepperOrderStatus
                    callBack={() => {
                        setModalStatusTypes(!openModalStatusTypes)
                    }}
                    active={activeStep}
                    steps={statusTypes?.map((status: StatusType) => status.name) ?? []}
                    setActive={async (step: number) => {
                        setActiveStep(step)
                    }}
                />
                <DragOrders
                    orders={orders}
                    statusTypes={statusTypes ?? []}
                />
                <ModalStatusTypes
                    openModalStatusTypes={openModalStatusTypes}
                    setModalStatusTypes={setModalStatusTypes}
                />
            </Column>
        </div>
    )
}
