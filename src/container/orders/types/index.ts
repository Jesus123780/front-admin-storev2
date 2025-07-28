import { GetAllShoppingCard } from "pkg-components/stories/organisms/ModalDetailOrder/type"

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
  payMethodPState: number
  pPRecoger: boolean
  pDatCre: string
  pDatMod: string
  getAllShoppingCard: GetAllShoppingCard[]
}

export interface OrderItem {
  pdpId: string
  idStore: string
  pCodeRef: string
  payMethodPState: number
  pPRecoger: boolean
  totalProductsPrice: number
  pSState: number
  pDatCre: string
  pDatMod: string
  channel: string
  locationUser: string
  getStatusOrderType: OrderStatusType
  getStoreOrders: StoreOrder[]
}

export interface OrderGroup {
  statusKey: string
  priority: number
  state: number
  getStatusOrderType: OrderStatusType
  items: OrderItem[]
}

export interface GetAllOrdersFromStoreResponse {
  getAllOrdersFromStore: OrderGroup[]
}