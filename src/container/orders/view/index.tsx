'use client'

import React, {
    useState,
    useMemo,
    useContext
} from 'react'
import {
    Button,
    InputQuery,
    DateRange,
    AlertInfo,
    EmptyData,
    getGlobalStyle,
    InputDate,
    Divider,
    ToggleSwitch,
    Column,
    DropResult
} from 'pkg-components'
import {
    useFormTools,
    useOrdersFromStore,
    UtilDateRange,
    useOrderStatusTypes,
    useChangeStateOrder,
    useUpdateOrderStatusPriorities,
} from 'npm-pkg-hook'
import { Context } from '@/context/Context'
import { DragOrders } from './components/DragOrders'
import styles from './styles.module.css'
import { GetAllOrdersFromStoreResponse, OrderGroup } from '../types'

export const OrdersView = () => {

    // STATES
    const [inCludeRange, setInCludeRange] = useState(true)
    const [loading, setLoading] = useState(false)
    const [orders, setOrders] = useState<OrderGroup[]>([])
    const { sendNotification } = useContext(Context)

    const initialDates = useMemo(() => {
        const todayRange = new UtilDateRange()
        const { start, end } = todayRange.getRange()
        return { fromDate: start, toDate: end }
    }, [])


    // HOOKS
    const { statusTypes } = useOrderStatusTypes()
    const [changeStateOrder] = useChangeStateOrder({
        sendNotification
    })
    const [updatePriorities] = useUpdateOrderStatusPriorities({
        sendNotification
    })

    const [handleChange, handleSubmit, setDataValue, { dataForm }] = useFormTools({
        initialValues: initialDates
    })
    console.log("🚀 ~ OrdersView ~ dataForm:", dataForm)

    const [_data, { refetch }] = useOrdersFromStore({
        fromDate: dataForm.fromDate,
        toDate: dataForm.toDate,
        callback: (data: GetAllOrdersFromStoreResponse) => {
            const { getAllOrdersFromStore } = data ?? []
            setOrders(getAllOrdersFromStore ?? [] as OrderGroup[])
        }
    })

    // HANDLESS
    const handleClearFilters = async () => {
        setLoading(true)
        await refetch({
            fromDate: initialDates.fromDate,
            toDate: initialDates.toDate,
            search: ''
        })
        setLoading(false)
    }

    /**
     * Handles drag end for reordering orders and updates priority in DB.
     * @param {import('react-beautiful-dnd').DropResult} result - DnD result object
     */
    const onDragEnd = async (result: DropResult) => {
        const { source, destination } = result

        if (!destination) return

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) return

        if (!Array.isArray(orders) || orders.length === 0) return

        const updatedOrders = [...orders]

        if (
            source.index < 0 ||
            source.index >= updatedOrders.length ||
            destination.index < 0 ||
            destination.index > updatedOrders.length
        ) return

        const [movedOrder] = updatedOrders.splice(source.index, 1)
        updatedOrders.splice(destination.index, 0, movedOrder)

        const reordered = updatedOrders.map((order, index) => ({
            ...order,
            getStatusOrderType: {
                ...order.getStatusOrderType,
                priority: index + 1,
            },
        }))

        setOrders(reordered)

        const payload = reordered.map((order) => ({
            idStatus: order.getStatusOrderType?.idStatus,
            priority: order.getStatusOrderType?.priority,
        }))

        await updatePriorities(payload)
    }

    const handleChangeState = async (idStatus: string, pCodeRef: string) => {
        await changeStateOrder({
            idStatus,
            pCodeRef: pCodeRef,
            pDatMod: new Date()
        })
    }



    return (
        <div style={{ padding: getGlobalStyle('--spacing-xl') }}>
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
                                // Espera a que termine de escribir antes de llamar a refetch
                                if (window.searchTimeout) clearTimeout(window.searchTimeout)
                                window.searchTimeout = setTimeout(() => {
                                    refetch({
                                        fromDate: dataForm.fromDate,
                                        toDate: dataForm.toDate,
                                        search: e.target.value
                                    })
                                }, 500)
                            }}
                            placeholder='busca por ref de orden'
                        />
                    </div>
                    <InputDate
                        date={dataForm.fromDate}
                        label='Desde'
                        disabled={!inCludeRange}
                        onChange={(value) => {
                            console.log("🚀 ~ value:", value)
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
                    <Button
                        borderRadius='5px'
                        onClick={handleClearFilters}
                        padding='0 10px'
                        loading={loading}
                        primary
                        styles={{
                            height: '3.75rem'
                        }}
                    >
                        Quitar filtros
                    </Button>
                    <Button
                        type='submit'
                        borderRadius='5px'
                        onClick={(e) => {
                            handleSubmit({
                                event: e,
                                action: () => {
                                    setLoading(true)
                                    refetch({
                                        fromDate: dataForm.fromDate,
                                        toDate: dataForm.toDate,
                                        search: dataForm.search
                                    })
                                    setLoading(false)
                                }
                            })

                        }}
                        padding='0 10px'
                        primary
                        styles={{
                            height: '3.75rem'
                        }}
                    >
                        Realizar busqueda
                    </Button>
                </div>
                <Divider marginTop={getGlobalStyle('--spacing-xl')} />
                <DateRange
                    endDate={dataForm.toDate ?? initialDates.toDate}
                    startDate={dataForm.fromDate ?? initialDates.fromDate}
                />
                <Divider marginTop={getGlobalStyle('--spacing-xl')} />
                <div className='form-container-orders'></div>
                {!Array.isArray(orders) ? (
                    <EmptyData />
                ) : (
                    <DragOrders
                        list={orders}
                        statusTypes={statusTypes ?? []}
                        onDragEnd={onDragEnd}
                        handleChangeState={handleChangeState}
                    />
                )}
            </Column>
        </div>
    )
}
