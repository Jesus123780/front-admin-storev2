'use client'

import { 
  createContext, 
  useContext, 
  useMemo, 
  useState 
} from 'react'

/* ------------------------------------------
   Types
------------------------------------------- */
interface OrderTypesContextProps {
  loading: boolean
  setLoading: (value: boolean) => void
}

/* ------------------------------------------
   Default Value
------------------------------------------- */
const DEFAULT_ORDER_TYPES_CONTEXT: OrderTypesContextProps = {
  loading: false,
  setLoading: () => {}
}

/* ------------------------------------------
   Create Context
------------------------------------------- */
const OrderTypesContext = createContext<OrderTypesContextProps>(
  DEFAULT_ORDER_TYPES_CONTEXT
)

/* ------------------------------------------
   Hook
------------------------------------------- */
export const useOrderTypes = () => useContext(OrderTypesContext)

/* ------------------------------------------
   Provider
------------------------------------------- */
export const OrderTypesProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [loading, setLoading] = useState(false)

  const memoizedValue = useMemo(
    () => ({
      loading,
      setLoading
    }),
    [loading]
  )

  return (
    <OrderTypesContext.Provider value={memoizedValue}>
      {children}
    </OrderTypesContext.Provider>
  )
}
