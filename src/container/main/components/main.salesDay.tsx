import React from 'react'
import {
    Column,
    CounterAnimation,
    getGlobalStyle,
    Text
} from 'pkg-components'
import { useGetSalesAmountToday } from 'npm-pkg-hook'

export const SalesDay = () => {
    const [data, { loading }] = useGetSalesAmountToday()

    return (
        <Column style={{ height: 'min-content', padding: getGlobalStyle('--spacing-md') }}>
            <Text size="lg" weight="normal">
                Ventas del dia: {(data?.total && !loading) && <CounterAnimation number={data?.total ?? 0} size="2rem" />}
            </Text>
        </Column>
    )
}
