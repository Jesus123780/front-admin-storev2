import { gql } from '@apollo/client'
// Minimal independent read; does not replace GET_ONE_SALE elsewhere in the app.
export const GET_CONFIRMED_RECEIPT = gql`
query getOneSalesStore($pCodeRef: String) {
  getOneSalesStore(pCodeRef: $pCodeRef) {
    success
    message
    errors {
      message
      path
      type
      context { key label limit value __typename }
    }
    data {
      statusOrder { idStatus name description color backgroundColor priority state createdAt updatedAt }
      paymentMethod { payId name icon state paymentPriority createdAt updatedAt }
      totals { key name value unit numericValue exactValue }
      financials {
        source valid issues breakdownVerified currency
        gross discountAmount netTotal delivery tip payableTotal change
        persisted { gross discountAmount netTotal delivery tip change }
        exact { gross discountAmount netTotal delivery tip payableTotal change }
        summary { key name value exactValue unit effect }
        calculated {
          subtotal totalExtras totalVat totalDiscounts grandTotal
          globalDiscountValue globalDiscountPercent grandTotalAfterGlobalDiscount
          globalDiscountType globalDiscountRequestedValue
          productGross nominalGross courtesyAmount discountableSubtotal protectedExtras
          productNet extraNet discountAmount netTotal delivery tip payableTotal
          warnings
          totals { key name value unit numericValue exactValue }
          exact {
            subtotal productGross extraGross totalVat totalDiscounts grandTotal
            discountableSubtotal globalDiscountValue discountAmount netTotal
            productNet extraNet delivery tip payableTotal courtesyAmount nominalGross
          }
          lines {
            id unitPrice quantity extrasTotal lineSubtotal vatAmount discountAmount
            free originalProductTotal courtesyAmount productGross discountableSubtotal
            globalDiscountAmount commercialDiscountAmount productNet extrasNet netTotal
            extras { id quantity gross discountAmount net }
          }
        }
      }
      createdAt change channel pCodeRef id idStore payId locationUser pdpId ppState
      shoppingCartRefCode pSState totalProductsPrice discountType discountValue
      discountAmount netTotal valueDelivery tip unidProducts updatedAt
      store {
        addressStore banner cId createdAt dailyGoal description upLon upLat
        deliveryTimeMinutes emailStore Image documentIdentifier Viaprincipal uState
      }
      client {
        cliId idStore idUser clState clientNumber ClientAddress ccClient gender
        clientLastName clientName createAt updateAt
      }
      shoppingCarts {
        shoppingCartId id pId shoppingCartRefCode priceProduct comments cantProducts
        refCodePid idUser idStore sState createdAt updatedAt
        products {
          pId free carProId sizeId colorId idStore cId caId dId ctId tpId fId
          pName pCode ProPrice ProDescuento ProUniDisponibles ProDescription ValueDelivery
          ProProtegido ProAssurance ProImage ProStar ProWidth ProHeight ProLength
          ProWeight ProQuantity ProOutstanding ProDelivery ProVoltaje pState tgId
          sTateLogistic ProBarCode stock manageStock vat
          ExtProductFoodOptional {
            pId opExPid OptionalProName state code required numbersOptionalOnly createdAt updatedAt
            ExtProductFoodsSubOptionalAll { pId opExPid idStore opSubExPid OptionalSubProName exCodeOptionExtra exCode state }
          }
          ExtProductFoodsAll { pId exPid exState extraName extraPrice quantity newExtraPrice state createdAt updatedAt }
          createdAt updatedAt
        }
      }
      __typename
    }
  }
}

`
