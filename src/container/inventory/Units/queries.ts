import { gql } from '@apollo/client'

/**
 * Listado paginado (en backend) de unidades en inventario: productos y
 * complementos que se manejan por inventario y tienen existencias
 * (`manageStock = true`, `stock > 0`).
 *
 * El backend (query `getManagedUnitsInStock` del módulo stock) hace el UNION de
 * ambas fuentes, aplica el filtro de inventario y pagina con LIMIT/OFFSET sobre
 * el conjunto combinado, devolviendo `{ data, pagination }` con el mismo
 * contrato que `productFoodsAll`. Así la vista escala sin traer todo el
 * catálogo al cliente.
 */
export const GET_MANAGED_UNITS_IN_STOCK = gql`
  query getManagedUnitsInStock($page: Int, $pageSize: Int, $search: String) {
    getManagedUnitsInStock(page: $page, pageSize: $pageSize, search: $search) {
      success
      message
      pagination {
        totalRecords
        totalPages
        currentPage
        __typename
      }
      data {
        id
        kind
        name
        stock
        price
        active
        __typename
      }
      __typename
    }
  }
`
