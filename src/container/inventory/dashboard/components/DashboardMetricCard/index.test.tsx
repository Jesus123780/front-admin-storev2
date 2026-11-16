import { render, screen } from '@testing-library/react'
import React from 'react'
import { DashboardMetricCard } from './index'

describe('DashboardMetricCard', () => {
  it('renders currency and label', () => {
    render(<DashboardMetricCard label='Ingresos' iconName='IconDollar' isCurrency value={15000}/>)
    expect(screen.getByText('$')).toBeInTheDocument()
    expect(screen.getByText('Ingresos')).toBeInTheDocument()
  })
  it('preserves positive changes above 100%', () => {
    render(<DashboardMetricCard label='Pedidos' iconName='IconShopping' value={50} metric={{percentageChange: 400, trend:'up'}}/>)
    expect(screen.getByText('+400.0%')).toBeInTheDocument()
  })
  it('shows unknown comparisons without a positive trend', () => {
    render(<DashboardMetricCard label='Pedidos' iconName='IconShopping' value={3} comparisonLabel='vs. día anterior' metric={{percentageChange:null, trend:'up'}}/>)
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })
  it('does not display nonexistent series', () => {
    render(<DashboardMetricCard label='Productos' iconName='IconInventory' value={1}/>)
    expect(screen.queryByRole('img', {name:'Tendencia de Productos'})).not.toBeInTheDocument()
  })
  it('distinguishes missing value from zero', () => {
    render(<DashboardMetricCard label='Pedidos' iconName='IconShopping' value={undefined}/>)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
