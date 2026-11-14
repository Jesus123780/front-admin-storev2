import {
 AwesomeModal, 
  CashPaymentFields,
 InputHooks,
Loading 
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import PropTypes from 'prop-types'
import React from 'react'

import { useModalLayer } from '../modalLayers'
import { Prints } from '../Printsale'

export const ModalSales = ({
  print,
  setPrint,
  totalProductPrice = 0,
  dataClientes = {},
  values = {},
  code,
  data,
  delivery,
  loading,
  discount = {},
  paymentKind,
  setDelivery = () => { return },
  handleChange = () => { return },
  handleSubmit = () => { return },
  cashCheckout,
  onCashReceivedChange,
  ...rest
}) => {
  const printZIndex = useModalLayer(Boolean(print))
  const deliveryZIndex = useModalLayer(Boolean(delivery))
  const paymentName = typeof rest.paymentMethod === 'string'
    ? rest.paymentMethod.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
    : ''
  const resolvedKind = paymentKind ?? (paymentName && paymentName !== 'sin seleccionar'
    ? /^(efectivo|cash|pago en efectivo|dinero en efectivo)$/.test(paymentName) ? 'cash' : 'non-cash'
    : 'unknown')
  const canEditChange = resolvedKind === 'cash' && !loading
  // Preserve raw change for unknown methods so the receipt can still alert.
  const receiptChange = resolvedKind === 'non-cash' ? 0 : values?.change
  const receiptValues = resolvedKind === 'non-cash' ? { ...values, change: 0 } : values
  return (
    <div>
      {loading && <Loading />}
      <AwesomeModal
        backgroundColor='#ecebeb'
        cancel='Cancelar'
        confirm='Guardar y salir'
        footer={false}
        header={true}
        onConfirm={() => { return handleSubmit() }}
        onHide={() => { return setPrint(!print) }}
        show={print}
        size={MODAL_SIZES.large}
        useScroll={true}
        zIndex={printZIndex}
      >
        {cashCheckout && onCashReceivedChange && (
          <CashPaymentFields checkout={cashCheckout} onReceivedChange={onCashReceivedChange} disabled={Boolean(loading)} />
        )}
        <Prints
          change={receiptChange}
          paymentKind={resolvedKind}
          code={code}
          data={data?.PRODUCT || []}
          dataClientes={dataClientes}
          discount={discount}
          handleSubmit={cashCheckout && !cashCheckout.canSubmit ? undefined : handleSubmit}
          total={totalProductPrice}
          values={receiptValues}
          {...rest}
        />
      </AwesomeModal>

      <AwesomeModal
        borderRadius='5px'
        btnCancel={true}
        btnConfirm={false}
        footer={false}
        header={true}
        onCancel={() => { return false }}
        onHide={() => { return setDelivery(!delivery) }}
        padding='25px'
        show={delivery}
        size='small'
        title='Añade el costo del envío'
        zIndex={deliveryZIndex}
      >
        <InputHooks
          autoComplete='off'
          name='valueDelivery'
          onChange={handleChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.target.blur()
              setDelivery(!delivery)
            }
          }}
          placeholder='Costo de envió'
          value={values?.valueDelivery}
        />
        {cashCheckout && onCashReceivedChange ? (
          <CashPaymentFields checkout={cashCheckout} onReceivedChange={onCashReceivedChange} disabled={Boolean(loading)} />
        ) : (
          <InputHooks
          key={resolvedKind === 'cash' ? 'change-cash' : 'change-disabled'}
          autoComplete='off'
          name='change'
          disabled={!canEditChange}
          onChange={(event, hasError) => {
            if (canEditChange) {handleChange(event, hasError)}
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.target.blur()
              setDelivery(!delivery)
            }
          }}
          placeholder='Cambio'
          value={resolvedKind === 'cash' ? (values?.change ?? '') : ''}
        />
        )}
      </AwesomeModal>
    </div>
  )
}

ModalSales.propTypes = {
  cashCheckout: PropTypes.object,
  onCashReceivedChange: PropTypes.func,
  code: PropTypes.any,
  data: PropTypes.shape({
    PRODUCT: PropTypes.array
  }),
  dataClientes: PropTypes.object,
  delivery: PropTypes.any,
  discount: PropTypes.object,
  handleChange: PropTypes.func,
  handleSubmit: PropTypes.func,
  loading: PropTypes.any,
  paymentKind: PropTypes.oneOf(['cash', 'non-cash', 'unknown']),
  print: PropTypes.any,
  setDelivery: PropTypes.func,
  setPrint: PropTypes.func,
  totalProductPrice: PropTypes.number,
  values: PropTypes.shape({
    valueDelivery: PropTypes.any,
    change: PropTypes.any
  })
}
