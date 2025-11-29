import { GetAllShoppingCard } from 'pkg-components/stories/organisms/ModalDetailOrder/type'

export interface OrderStatusType {
  idStatus: string
  name: string
  description?: string
  backgroundColor?: string
  color?: string
  priority: number
  state: number
  createdAt: string
  updatedAt: string
}

export interface StoreOrder {
  pdpId: string
  pId: string
  idStore: string
  ShoppingCard: string
  pCodeRef: string
  pPStateP: number
  payId: string
  pPRecoger: boolean
  pDatCre: string
  pDatMod: string
  getAllShoppingCard: GetAllShoppingCard[]
}

export interface OrderItem {
  pdpId: string
  idStore: string
  pCodeRef: string
  payId: string
  status: string
  pPRecoger: boolean
  totalProductsPrice: number
  pSState: number
  createdAt: string
  updatedAt: string
  channel: string
  locationUser: string
  getStatusOrderType: OrderStatusType
  getStoreOrders: StoreOrder[]
}

export interface OrderGroup {
  createdAt: string
  pCodeRef: string
  totalProductsPrice: string
}

export interface GetAllOrdersFromStoreResponse {
  getAllSalesStore: OrderGroup[]
}