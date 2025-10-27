'use client'

import { InMemoryCache, makeVar } from '@apollo/client'
import { concatPagination } from '@apollo/client/utilities'

export const isLoggedVar = makeVar({ state: true, expired: false, message: '', code: '' })

const mergeArraysWithDuplicates = (existing = [], incoming = [], max = Infinity, uniqueKey = null) => {
  const merged = Array.isArray(existing) ? existing?.slice(0) : []
  if (Array.isArray(incoming)) {
    for (let i = 0; i < incoming?.length && merged.length < max; ++i) {
      const item = incoming[i]
      if (uniqueKey) {
        const index = merged.findIndex((existingItem) => {return existingItem[uniqueKey] === item[uniqueKey]})
        if (index >= 0) {
          merged[index] = item
        } else {
          merged.push(item)
        }
      } else {
        merged.push(item)
      }
    }
  }
  return merged
}


export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        isLogged: {
          read: () => {return isLoggedVar()}
        },
        allPosts: concatPagination(),
        getStoreOrderById: {
          keyArgs: ['pCodeRef'],
          merge(existing, incoming) {
            if (!incoming) {return existing}
            if (!existing) {return incoming}

            // Creamos una copia de los resultados existentes y entrantes
            const merged = {
              ...existing,
              ...incoming,
              getStoreOrderById: [
                ...(existing.getStoreOrders || []),
                ...(incoming.getStoreOrders || [])
              ]
            }

            return merged
          }
        },
        getStoreOrdersFinal: {
          keyArgs: ['idStore', 'search', 'statusOrder'],
          merge(existing, incoming, { args: { max = Infinity } }) {
            try {
              // Verificar que el objeto exista y tenga la propiedad getStoreOrders
              const existingResults = existing?.getStoreOrders ?? []
              const incomingResults = incoming?.getStoreOrders ?? []
              // Concatenamos los resultados entrantes con los existentes
              const merged = [...existingResults]
              for (let i = 0; i < incomingResults.length && merged.length < max; ++i) {
                const incomingResult = incomingResults[i]
                // Verificar que el objeto exista y tenga la propiedad pCodeRef
                if (incomingResult?.pCodeRef && !merged.some(existingResult => {return existingResult.pCodeRef === incomingResult.pCodeRef})) {
                  merged.push(incomingResult)
                }
              }
              return {
                ...incoming,
                getStoreOrdersFinal: merged
              }
            } catch (error) {
              return existing
            }
          }
        },
        getAllSalesStoreTotal: {
          merge(existing = {}, incoming) {
            return { ...existing, ...incoming }
          }
        },
        getAllSalesStore: {
          keyArgs: ['idStore', 'search', 'max', 'fromDate', 'toDate'],
          merge(existing, incoming, { args: { max = Infinity } }) {
            try {
              // Verificar que el objeto exista y tenga la propiedad getAllSalesStore
              const existingResults = existing?.getAllSalesStore ?? []
              const incomingResults = incoming?.getAllSalesStore ?? []
              // Concatenamos los resultados entrantes con los existentes
              const merged = [...existingResults]
              for (let i = 0; i < incomingResults.length && merged.length < max; ++i) {
                const incomingResult = incomingResults[i]
                // Verificar que el objeto exista y tenga la propiedad pCodeRef
                if (incomingResult?.pCodeRef && !merged.some(existingResult => {return existingResult.pCodeRef === incomingResult.pCodeRef})) {
                  merged.push(incomingResult)
                }
              }
              return {
                ...incoming,
                getAllSalesStore: merged
              }
            } catch (error) {
              return existing
            }
          }
        },
        // productFoodsAll: {
        //   keyArgs: ['categories', 'desc', 'fromDate', 'gender', 'pState', 'search', 'toDate'],
        //   merge(existing, incoming, { args: { max = Infinity } }) {
        //     const merged = Array.isArray(existing) ? existing?.slice(0) : []
        //     for (let i = 0; i < incoming?.length && merged.length < max; ++i) {
        //       const item = incoming[i]
        //       const index = merged.findIndex((existingItem) => {return existingItem.pId === item.pId})
        //       if (index >= 0) {
        //         merged[index] = item
        //       } else {
        //         merged.push(item)
        //       }
        //     }
        //     return merged
        //   }
        // },
        getCatProductsWithProduct: {
          keyArgs: ['search', 'min', 'max', 'gender', 'desc', 'categories'],
          merge(existing, incoming, { args: { max = Infinity } }) {
            const merged = {
              ...incoming,
              catProductsWithProduct: mergeArraysWithDuplicates(
                existing?.catProductsWithProduct,
                incoming?.catProductsWithProduct,
                max,
                'carProId'
              )
            }
            return merged
          }
        },
        getAllContacts: {
          keyArgs: ['search', 'min', 'max', 'idStore', 'pState'],
          merge(existing, incoming, { args: { max = Infinity } }) {
            const merged = {
              ...incoming,
              getAllContacts: mergeArraysWithDuplicates(
                existing?.getAllContacts,
                incoming?.getAllContacts,
                max,
                'contactId'
              )
            }
            return merged
          }
        },
        // getAllOrdersFromStore: {
        //   keyArgs: [
        //     'idStore',
        //     'cId',
        //     'dId',
        //     'ctId',
        //     'search',
        //     'min',
        //     'fromDate',
        //     'toDate',
        //     'max',
        //     'statusOrder'
        //   ],
        //   merge(existing, incoming, { args: { max = Infinity } }) {
        //     const merged = {
        //       ...incoming,
        //       getAllOrdersFromStore: mergeArraysWithDuplicates(
        //         existing?.getAllOrdersFromStore,
        //         incoming?.getAllOrdersFromStore,
        //         max,
        //         'pCodeRef'
        //       )
        //     }
        //     return merged
        //   }
        // },
        getAllClients: {
          keyArgs: ['search', 'min', 'max', 'idStore'],
          merge(existing, incoming, { args: { max = Infinity } }) {
            const merged = {
              ...incoming,
              getAllContacts: mergeArraysWithDuplicates(
                existing?.getAllClients,
                incoming?.getAllClients,
                max,
                'cliId'
              )
            }
            return merged
          }
        }
      }
    }
  }
})
