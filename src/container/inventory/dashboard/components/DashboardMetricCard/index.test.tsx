import { render, screen } from '@testing-library/react'
import React from 'react'

import { DashboardMetricCard } from './index'

describe('DashboardMetricCard', () => {
  it('renders the label and the currency symbol for a currency card', () => {
    render(
      <DashboardMetricCard
        currencySymbol='$'
        iconName='IconDollar'
        isCurrency
        label='Ingresos totales'
        metric={{ value: 24582, previousValue: 20000, percentageChange: 18.2, trend: 'up' }}
        value={24582}
      />
    )
    // The numeric value is animated digit-by-digit (CounterAnimation), so we
    // assert the label and the currency symbol rather than a single text node.
    expect(screen.getByText('Ingresos totales')).toBeInTheDocument()
    expect(screen.getByText('$')).toBeInTheDocument()
  })

  it('shows a positive percentage with a sign', () => {
    render(
      <DashboardMetricCard
        iconName='IconDollar'
        label='Ingresos'
        metric={{ value: 100, previousValue: 80, percentageChange: 25, trend: 'up' }}
        value={100}
      />
    )
    expect(screen.getByText('+25.0%')).toBeInTheDocument()
  })

  it('shows "Sin datos" when there is no comparison', () => {
    render(
      <DashboardMetricCard
        iconName='IconUser'
        label='Clientes'
        metric={{ value: 10, previousValue: null, percentageChange: null, trend: 'unknown' }}
        value={10}
      />
    )
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
  })

  it('does not render a currency symbol for a count card', () => {
    render(
      <DashboardMetricCard
        iconName='IconShopping'
        label='Pedidos'
        metric={{ value: 42, previousValue: 40, percentageChange: 5, trend: 'up' }}
        value={42}
      />
    )
    expect(screen.queryByText('$')).not.toBeInTheDocument()
  })

  it('renders a busy skeleton while loading', () => {
    const { container } = render(
      <DashboardMetricCard iconName='IconDollar' label='Ingresos' loading value={0} />
    )
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    // The definitive value must not be shown as if it were real data.
    expect(screen.queryByText('Ingresos')).not.toBeInTheDocument()
  })
})
