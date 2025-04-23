export const dataToPrintProduct = (sale) => {
  return sale?.getAllPedidoStore?.length ? sale?.getAllPedidoStore?.map((sale) => {
    const product = {
      ...sale?.getAllShoppingCard?.productFood,
      ProQuantity: sale?.getAllShoppingCard?.cantProducts || 0,
      unitPrice: sale?.getAllShoppingCard?.productFood?.ProPrice || 0
    }
    return {
      ...product,
      dataExtra: sale?.getAllShoppingCard?.ExtProductFoodsAll || [],
      dataOptional: !!sale?.getAllShoppingCard?.salesExtProductFoodOptional?.length && sale?.getAllShoppingCard?.salesExtProductFoodOptional?.map((extraOptional) => {
        return {
          ...extraOptional,
          ExtProductFoodsSubOptionalAll: extraOptional?.saleExtProductFoodsSubOptionalAll?.length ? extraOptional?.saleExtProductFoodsSubOptionalAll?.map((subExtra) => {
            return {
              OptionalSubProName: subExtra?.OptionalSubProName || ''
            }
          }) : []
        }
      }) || []
    }
  }) : []
}