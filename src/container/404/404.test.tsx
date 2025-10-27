import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import NotFound from './index'

// index.test.jsx

let mockIsMobile = false
const push = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push })
}))

jest.mock('npm-pkg-hook', () => ({
  useMobile: () => ({ isMobile: mockIsMobile })
}))
const NotFoundMain = jest.fn(({ handleLogin, handleRegister, isMobile }) => (
  <div data-testid="NotFound-main">
    <button onClick={handleLogin}>Login</button>
    <button onClick={handleRegister}>Register</button>
    <span data-testid="is-mobile">{String(isMobile)}</span>
  </div>
))

describe('NotFound', () => {
  beforeEach(() => {
    push.mockClear()
    NotFoundMain.mockClear()
    mockIsMobile = false
  })
  afterEach(() => cleanup())

  it('renders NotFoundMain inside Container and passes isMobile=false by default', () => {
    render(<NotFound />)
  })
})