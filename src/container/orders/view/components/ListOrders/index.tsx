'use client'
import {
    Button,
    getGlobalStyle,
    Icon,
    Row,
    Section,
    Table,
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
    if (orders?.length === 0) { return null }
    return (
        <div>
            <Table
                pointer={false}
                data={orders}
                titles={[
                    { justify: 'flex-start', name: 'Estado', key: 'state', width: '1fr' },
                    { justify: 'flex-start', name: 'Orden', key: 'pCodeRef', width: '.8fr' },
                    { justify: 'flex-start', name: 'Fecha', key: 'date', width: '1fr' },
                    { justify: 'flex-start', name: 'Acciones', width: '1fr' },
                ]}
                renderBody={(dataB, titles) => {
                    return dataB.map((order: OrderItem) => {
                        const {
                            state,
                            pCodeRef,
                            createdAt
                        } = order
                        return (
                            <Section
                                key={`${state}-${pCodeRef}`}
                                columnWidth={titles}
                                padding={`${getGlobalStyle('--spacing-lg')} 0`}
                            >
                                <Row>
                                    <Text weight="bold">
                                        {state}
                                    </Text>
                                </Row>
                                <Text>
                                    #{pCodeRef}
                                </Text>
                                <Text>
                                    {createdAt}
                                </Text>
                                <Row>
                                    <Button
                                        border='none'
                                        onClick={() => handleCopy(pCodeRef)}>
                                        <Text color="gray-dark">
                                            <Icon icon="IconCopy" size={20} />
                                        </Text>
                                    </Button>
                                    <Button
                                        border='none'
                                        onClick={() => handlePrint(pCodeRef)}>
                                        <Text color="gray-dark">
                                            <Icon icon="IconPrint" size={20} />
                                        </Text>
                                    </Button>
                                    <Button
                                        border='none'
                                        onClick={() => handleOpenSale(pCodeRef)}>
                                        <Text color="gray-dark">
                                            <Icon icon="IconDost" size={20} />
                                        </Text>
                                    </Button>
                                </Row>
                            </Section>
                        )
                    })
                }}
            />
        </div>
    )
}
