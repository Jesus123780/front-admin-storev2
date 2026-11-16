import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ModalSales } from './index'
import { buildPreviewReceipt } from '../receipt/financial-receipt'

jest.mock('pkg-components', () => ({
  AwesomeModal: ({ show, children }: any) => show ? <div role='dialog'>{children}</div> : null,
  CashPaymentFields: () => <input aria-label='Efectivo recibido' />,
  InputHooks: () => null,
  Icon: () => null,
  numberFormat: (value: number) => new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}))
jest.mock('pkg-components/stories/organisms/AwesomeModal/constanst', () => ({ MODAL_SIZES: { large: 'large', small: 'small' } }))
jest.mock('../modalLayers', () => ({ useModalLayer: () => 1 }))
jest.mock('../Printsale', () => ({ Prints: ({ handleSubmit }: any) => <div>{handleSubmit ? 'Acción duplicada' : 'Ticket'}</div> }))
jest.mock('../receipt/financial-receipt', () => ({ buildPreviewReceipt: jest.fn() }))

const Component = ModalSales as React.ComponentType<any>
const preview = buildPreviewReceipt as jest.Mock
const fixture = (overrides: Record<string, unknown> = {}) => ({
  print: true, setPrint: jest.fn(), delivery: false,
  paymentKind: 'cash', paymentMethod: 'Efectivo',
  data: { PRODUCT: [] }, previewInput: {},
  cashCheckout: { kind: 'cash', total: 4250, amountsValid: true, hasItems: true, canSubmit: true, received: 50000, missing: 0 },
  onCashReceivedChange: jest.fn(), handleSubmit: jest.fn(), ...overrides
})
beforeEach(() => { preview.mockReset().mockReturnValue({ canConfirm: true }) })

test('preserves a single submit action and a visible ticket', () => {
  render(<Component {...fixture()} />)
  expect(screen.getAllByRole('button', { name: 'Confirmar venta' })).toHaveLength(1)
  expect(screen.getByText('Ticket')).toBeInTheDocument()
  expect(screen.getByText(new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(4250))).toBeInTheDocument()
  expect(screen.queryByText('Acción duplicada')).not.toBeInTheDocument()
})
test('blocks a sale when receipt cannot be confirmed', () => {
  preview.mockReturnValue({ canConfirm: false })
  const props = fixture()
  render(<Component {...props} />)
  const button = screen.getByRole('button', { name: 'Confirmar venta' })
  expect(button).toBeDisabled()
  fireEvent.click(button)
  expect(props.handleSubmit).not.toHaveBeenCalled()
})
test('blocks an unconfirmed payment even with valid receipt', () => {
  const props = fixture({ cashCheckout: { kind: 'cash', total: 4250, canSubmit: false, amountsValid: true, hasItems: true, received: 50000, missing: 0 } })
  render(<Component {...props} />)
  expect(screen.getByRole('button', { name: 'Confirmar venta' })).toBeDisabled()
})
test('blocks a second submission while the first is unresolved', async () => {
  let done!: () => void
  const request = new Promise<void>(resolve => { done = resolve })
  const props = fixture({ handleSubmit: jest.fn(() => request) })
  render(<Component {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar venta' }))
  const busy = screen.getByRole('button', { name: 'Procesando…' })
  expect(busy).toBeDisabled()
  fireEvent.click(busy)
  expect(props.handleSubmit).toHaveBeenCalledTimes(1)
  await act(async () => { done(); await request })
})
test('directs attention to payment confirmation without confirming it', () => {
  render(<Component {...fixture({ cashCheckout: { kind: 'cash', total: 4250, canSubmit: false, amountsValid: true, hasItems: true, received: 50000, missing: 0 }, requiredAction: { target: 'confirmation', label: 'Ir a confirmar el pago', message: 'Confirma el pago' }, paymentConfirmationSection: <label><input type='checkbox' />Confirmo que recibí el pago.</label> })} />)
  fireEvent.click(screen.getByRole('button', { name: 'Ir a confirmar el pago' }))
  const checkbox = screen.getByRole('checkbox')
  expect(checkbox).toHaveFocus()
  expect(checkbox).not.toBeChecked()
})
test('prevents closing or submitting while recovering an earlier payment', () => {
  render(<Component {...fixture({ pendingRecovery: true })} />)
  expect(screen.getByRole('button', { name: 'Confirmar venta' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Volver' })).toBeDisabled()
})
