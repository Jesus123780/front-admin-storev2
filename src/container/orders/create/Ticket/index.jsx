'use client'

import PropTypes from 'prop-types'
import React from 'react'
import { numberFormat, generateStoreURL } from 'npm-pkg-hook'
import { Bill } from 'pkg-components'

export const Ticket = ({ componentRef, dataToPrint }) => {
  const {
    date,
    products,
    total,
    storeName,
    paymentMethod,
    NitStore,
    ref,
    client,
    change,
    city,
    uPhoNum,
    department,
    addressStore,
    discount,
    idStore,
    storePhone
  } = dataToPrint || {}
  const restaurant = {
    storeName,
    paymentMethod,
    address: addressStore,
    ref: ref,
    change: change,
    NitStore: NitStore,
    tlf: storePhone || uPhoNum
  }
  const bill = {
    date
  }
  const urlStore = generateStoreURL({ city, department, storeName, idStore })

  return (
    <div ref={componentRef}>
      <Bill
        bill={bill}
        client={client}
        discount={discount}
        numberFormat={numberFormat}
        products={products}
        restaurant={restaurant}
        total={total}
        urlStore={urlStore}
      />
    </div>

  )
}

Ticket.propTypes = {
  componentRef: PropTypes.any,
  dataToPrint: PropTypes.object
}
