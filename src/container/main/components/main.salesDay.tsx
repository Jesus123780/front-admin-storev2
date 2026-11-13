import { useGetSalesAmountToday } from 'npm-pkg-hook'
import {
    Column,
    CounterAnimation,
    getGlobalStyle,
    Text
} from 'pkg-components'

export const SalesDay = () => {
    const [data, { loading }] = useGetSalesAmountToday()
    return (
        <Column style={{ height: 'min-content', padding: getGlobalStyle('--spacing-md') }}>
            <Text size='lg' weight='normal'>
                Ventas del dia: {!loading && <CounterAnimation
                    number={data?.total ?? 0}
                    size="24px"
                    minimumFractionDigits={0}
                    maximumFractionDigits={0}
                    tone="neutral"
                    animation="reel"
                    direction="decrease"
                    duration={900}
                    stagger={45}
                    animated
                />}
            </Text>
        </Column>
    )
}
