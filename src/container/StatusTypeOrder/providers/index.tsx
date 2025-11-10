import { OrderTypesProvider } from '../context'
import { StatusTypeOrderView } from '../view'

export default function OrderTypesContextProviders() {
    return (
        <OrderTypesProvider>
            <StatusTypeOrderView />
        </OrderTypesProvider>
    )
}
