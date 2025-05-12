import { gql } from '@apollo/client'

export const CHANGE_STATE_STORE_PEDIDO = gql`
mutation changePPStatePPedido($pPStateP: Int, $pCodeRef: String, $pDatMod: String) {
  changePPStatePPedido(pPStateP: $pPStateP, pCodeRef: $pCodeRef,  pDatMod: $pDatMod){
    success
    message
  }
}

`
export const GET_ALL_PEDIDOS = gql`
query getStoreOrdersFinal($idStore: ID, $search: String, $min: Int, $max: Int, $statusOrder: Int) {
  getStoreOrdersFinal(idStore: $idStore, search: $search, min: $min, max: $max, statusOrder: $statusOrder) {
    pdpId
    idStore
    pCodeRef
    payMethodPState
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
        payMethodPState
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