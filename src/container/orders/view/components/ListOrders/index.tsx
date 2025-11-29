'use client'
import {
    Button,
    Icon,
    Section,
    StatusBadge,
    Table,
    TableCell,
    Text,
} from 'pkg-components'
import React from 'react'

import { type OrderGroup, OrderItem } from '../../../types'

interface IListOrders {
    orders: OrderGroup[]
    handlePrint: (pCodeRef: string) => void
    handleCopy: (pCodeRef: string) => void
    handleOpenSale: (pCodeRef: string) => void
}

export const ListOrders: React.FC<IListOrders> = ({
    orders = [],
    handlePrint,
    handleCopy,
    handleOpenSale
}) => {
    if (!orders?.length) { return null }

    return (
        <div>
            <Table
                pointer={false}
                data={orders}

                /** 🔥 Nuevo comportamiento */
                enableKeyboardNav
                enableColumnResize
                enableColumnDrag    // ⬅ habilita drag & drop
                titles={[
                    {
                        justify: 'flex-start',
                        name: 'Estado',
                        key: 'state',
                        width: '1fr'
                    },
                    {
                        justify: 'flex-start',
                        name: 'Orden',
                        key: 'pCodeRef',
                        width: '.8fr'
                    },
                    {
                        justify: 'flex-start',
                        name: 'Fecha',
                        key: 'date',
                        width: '1fr'
                    },
                    {
                        justify: 'flex-start',
                        name: 'Acciones',
                        key: 'actions',
                        width: '1fr'
                    },
                ]}

                renderBody={(dataB, titles) => {
                    return dataB.map((order: OrderItem, rowIndex: number) => {
                        const { statusOrder, pCodeRef, createdAt } = order

                        return (
                            <Section
                                key={pCodeRef}
                                columnWidth={titles}
                            >
                                {/* ---- Columna 1 ---- */}
                                <TableCell row={rowIndex} col={0}>
                                    <StatusBadge
                                        id={order.pCodeRef}
                                        size='md'
                                        statusOrder={statusOrder}
                                    />
                                </TableCell>

                                {/* ---- Columna 2 ---- */}
                                <TableCell row={rowIndex} col={1}>
                                    <Text>#{pCodeRef}</Text>
                                </TableCell>

                                {/* ---- Columna 3 ---- */}
                                <TableCell row={rowIndex} col={2}>
                                    <Text>{createdAt}</Text>
                                </TableCell>

                                {/* ---- Columna 4 ---- */}
                                <TableCell row={rowIndex} col={3}>
                                    <>
                                        <Button border='none' onClick={() => handleCopy(pCodeRef)}>
                                            <Icon icon="IconCopy" size={20} />
                                        </Button>
                                        <Button border='none' onClick={() => handlePrint(pCodeRef)}>
                                            <Icon icon="IconPrint" size={20} />
                                        </Button>
                                        <Button border='none' onClick={() => handleOpenSale(pCodeRef)}>
                                            <Icon icon="IconDost" size={20} />
                                        </Button>
                                    </>
                                </TableCell>

                            </Section>
                        );
                    })
                }}
            />
        </div>
    )
}
