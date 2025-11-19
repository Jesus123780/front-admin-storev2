import { RippleButton } from 'pkg-components'
import React from 'react'

interface OrderActionsProps {
    handlePrint: () => void
}
export const OrderActions: React.FC<OrderActionsProps> = ({
    handlePrint,
}: OrderActionsProps) => {
  return (
    <div>
        <RippleButton onClick={handlePrint}>Imprimir</RippleButton>
    </div>
  )
}
