/**
 * @file Unit test for the Analytics page
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'

import { render } from '@testing-library/react'

import Page from './page'

describe('Configuration Page', () => {
  it('renders correctly', () => {
    render(<Page />)
  })
})
