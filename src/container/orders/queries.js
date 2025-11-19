import { gql } from '@apollo/client'

export const CHANGE_STATE_STORE_ORDER = gql`
mutation changePPStateOrder($pPStateP: Int, $pCodeRef: String, $pDatMod: String) {
  changePPStateOrder(pPStateP: $pPStateP, pCodeRef: $pCodeRef,  pDatMod: $pDatMod){
    success
    message
  }
}
`
export const GET_ALL_ORDER = gql`
query getStoreOrdersFinal($idStore: ID, $search: String, $min: Int, $max: Int, $statusOrder: Int) {
  getStoreOrdersFinal(idStore: $idStore, search: $search, min: $min, max: $max, statusOrder: $statusOrder) {
    pdpId
    idStore
    pCodeRef
    payId
    pPRecoger
    totalProductsPrice
    pSState
    pDatCre
    channel
    locationUser
    pDatMod
    getStoreOrders{
        pdpId
        pId
        idStore
        ShoppingCard
        pCodeRef
        pPStateP
        payId
        pPRecoger
        pDatCre
        pDatMod
        getAllShoppingCard {
          ShoppingCard
          comments
          cantProducts
          pId
        productFood{
          pId
          carProId
          colorId
          idStore
          pName
          ProPrice
          ProDescuento
          ProDescription
          ValueDelivery
          ProImage
          ProStar
          pState
          pDatCre
          pDatMod
        }
      }
    }
  }
}
`