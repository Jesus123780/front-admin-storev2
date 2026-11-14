// lib/orders.mock.ts

import { ResponseSalesStore } from '../../types/order';

export const MOCK_ORDER_RESPONSE: ResponseSalesStore = {
  message: 'Order status found successfully',
  errors: null,
  data: {
    change: null,
    channel: null,
    id: 'BILL00124',
    totalProductsPrice: 435,
    createdAt: '2025-11-16T23:11:40.389Z',
    store: {
      createdAt: '2025-11-16T05:23:27.103Z',
      description: 'Remo comidas',
      emailStore: 'test@gmail.com',
      __typename: 'Store'
    },
    client: {
      cliId: 'c55cc172-bd40-467c-8ff4-ca9d6675efbb',
      clientName: 'John',
      clientLastName: 'Doe',
      ClientAddress: 'Jl. Pulo Raya V/34, Kebayoran Baru, Jakarta Selatan 12170',
      clientNumber: '555-1234',
      __typename: 'Clients'
    },
    shoppingCarts: [
      {
        shoppingCartId: '6067e4b1-19f9-4903-8948-874483b1715e',
        pId: 'bb08c204-07e2-41ce-872c-05609f0de043',
        priceProduct: 300,
        cantProducts: 1,
        products: {
          pId: 'bb08c204-07e2-41ce-872c-05609f0de043',
          pName: 'Treatment',
          pCode: 'TRT-001',
          ProPrice: 300,
          ProQuantity: 1,
          ProImage: '/images/placeholder-image.webp',
          vat: 0,
          __typename: 'Product'
        },
        __typename: 'ShoppingCart'
      },
      {
        shoppingCartId: 's2',
        pId: 'p2',
        priceProduct: 120,
        cantProducts: 1,
        products: {
          pId: 'p2',
          pName: 'Component used',
          pCode: 'CMP-02',
          ProPrice: 120,
          ProQuantity: 1,
          ProImage: '/images/placeholder-image.webp',
          vat: 0,
          __typename: 'Product'
        },
        __typename: 'ShoppingCart'
      },
      {
        shoppingCartId: 's3',
        pId: 'p3',
        priceProduct: 15,
        cantProducts: 1,
        products: {
          pId: 'p3',
          pName: 'Medicine',
          pCode: 'MED-03',
          ProPrice: 15,
          ProQuantity: 1,
          ProImage: '/images/placeholder-image.webp',
          vat: 0,
          __typename: 'Product'
        },
        __typename: 'ShoppingCart'
      }
    ],
    __typename: 'StoreOrders'
  },
  __typename: 'ResponseSalesStore'
};

export const fetchOrderMock = async (orderId: string) => {
  // Simulate async fetch
  await new Promise((r) => setTimeout(r, 150));
  // In real life, filter by orderId. For mock, inject id.
  const copy = JSON.parse(JSON.stringify(MOCK_ORDER_RESPONSE));
  copy.data.id = orderId || copy.data.id;
  return copy as ResponseSalesStore;
};
