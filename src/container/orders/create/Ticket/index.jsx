'use client'
import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { Prints } from '../Printsale'
import { createInvoiceSnapshot } from '../sale-invoice-snapshot'

/** Legacy entry point: only accept confirmed financial data, never a raw Bill subtotal. */
export const Ticket = ({ componentRef, dataToPrint, snapshot, expectedStoreId }) => {
  const localRef=useRef(null)
  const pending=useRef(null)
  try {
    const document=snapshot ?? createInvoiceSnapshot(dataToPrint,dataToPrint?.pCodeRef,expectedStoreId)
    if(document?.view?.financials?.source!=='persisted')throw new Error('Comprobante no confirmado')
    return <Prints componentRef={componentRef??localRef} promiseResolveRef={pending} isPrinting={false} mode='receipt' code={document.reference} saleDate={document.date?.iso} data={[]} values={{}} paymentMethod={document.view.payment.name} change={document.view.payment.change} total={document.view.financials.total} persistedView={document.view} persistedStore={document.store} persistedClient={document.client}/>
  } catch { return <div role='status'>Consulta el detalle de la venta para obtener el comprobante conciliado.</div> }
}
Ticket.propTypes={componentRef:PropTypes.any,dataToPrint:PropTypes.object,snapshot:PropTypes.object,expectedStoreId:PropTypes.string}
