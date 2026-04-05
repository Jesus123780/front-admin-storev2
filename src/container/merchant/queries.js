import { gql } from '@apollo/client'

export const CREATE_ONE_STORE = gql`
mutation  newRegisterStore($input: IStore){
  newRegisterStore(input: $input){
    success
    message
    idStore
  }
}
`
export const GET_ONE_STORE = gql`
query getStore($id: ID){
 getStore(id: $id ){
cId
id
dId
idStore
ctId
neighborhoodStore
Viaprincipal
catStore
storeOwner
storeName
ImageName
emailStore
storePhone
socialRaz
Image
banner
  
documentIdentifier
uPhoNum
storeName
ULocation
upLat
upLon
uState
siteWeb
  
description
createdAt
secVia
NitStore
typeRegiments
typeContribute
addressStore
pais {
        cId
        cName
        cCalCod
        cState
      }
      city {
        ctId
        dId
        cName
        cState
      } 
      department {
        dId
        cId
        dName
        dState
      }
  getStoreSchedules {
      idStore
      schId
      id
      schDay
      schHoSta
      schHoEnd
      schState
  }
  cateStore {
    catStore
    cName
    cState
    csDescription
    
  }
}
}
`
export const GET_ONE_STORE_BY_ID = gql`
query getOneStore($idStore: ID){
 getOneStore(idStore: $idStore ){
cId
id
dId
idStore
ctId
neighborhoodStore
Viaprincipal
catStore
storeOwner
storeName
emailStore
storePhone
socialRaz
Image
banner
documentIdentifier
uPhoNum
ULocation
upLat
upLon
uState
siteWeb
description
secVia
NitStore
typeRegiments
typeContribute
addressStore
createAt
  cateStore {
    catStore
    cName
    cState
    cDatMod
    csDescription
    
  }
}
}
`