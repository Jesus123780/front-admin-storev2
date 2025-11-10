'use client'

import { OrderStatusTypesQueryResult, useOrderStatusTypes } from 'npm-pkg-hook'
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
  data: OrderStatusTypesQueryResult[]
  setLoading: (value: boolean) => void
}

/* ------------------------------------------
   Default Value
------------------------------------------- */
const DEFAULT_ORDER_TYPES_CONTEXT: OrderTypesContextProps = {
  loading: false,
  data: [],
  setLoading: () => { }
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
  useOrderStatusTypes({
    callback: (data: OrderStatusTypesQueryResult) => {
      return setData(data as OrderStatusTypesQueryResult[])
    }
  })
  const [data, setData] = useState<OrderStatusTypesQueryResult[]>([])
  const [loading, setLoading] = useState(false)

  const memoizedValue = useMemo(
    () => ({
      loading,
      setLoading,
      data
    }),
    [loading, data]
  )

  return (
    <OrderTypesContext.Provider value={memoizedValue}>
      {children}
    </OrderTypesContext.Provider>
  )
}
