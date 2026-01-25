/**
 * @file route.test.ts
 */
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Mocks
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: body,
      status: init?.status ?? 200,
    })),
  },
}))

// Import después de mocks
import { POST } from './route'

describe('🚪 API POST /logout', () => {
  const mockGet = jest.fn()
  const mockDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(cookies as jest.Mock).mockResolvedValue({
      get: mockGet,
      delete: mockDelete,
    })
  })

  test('✅ elimina las cookies y retorna logout exitoso', async () => {
    process.env.NEXT_PUBLIC_SESSION_NAME = 'session_token'

    mockGet.mockImplementation((name: string) =>
      name === 'merchant' || name === 'session_token'
        ? { value: 'mock-value' }
        : undefined
    )

    const res = await POST()

    expect(mockGet).toHaveBeenCalledWith('merchant')
    expect(mockGet).toHaveBeenCalledWith('session_token')
    expect(mockDelete).toHaveBeenCalledTimes(2)

    expect(NextResponse.json).toHaveBeenCalledWith({
      message: 'Logged out successfully',
    })

    expect(res.status).toBe(200)
  })

  test('⚠️ no intenta borrar cookies inexistentes', async () => {
    process.env.NEXT_PUBLIC_SESSION_NAME = 'session_token'

    mockGet.mockReturnValue(undefined)

    const res = await POST()

    expect(mockDelete).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
  })

  test('💥 retorna 500 si ocurre un error controlado', async () => {
    const error = new Error('Boom!')
    ;(cookies as jest.Mock).mockRejectedValueOnce(error)

    const res = await POST()

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Boom!' },
      { status: 500 }
    )
    expect(res.status).toBe(500)
  })

  test('🔥 retorna 500 si ocurre un error no tipado', async () => {
    ;(cookies as jest.Mock).mockRejectedValueOnce('unexpected')

    const res = await POST()

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
    expect(res.status).toBe(500)
  })
})
