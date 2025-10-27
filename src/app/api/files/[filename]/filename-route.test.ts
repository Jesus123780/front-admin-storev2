/**
 * @file route.test.ts
 */
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Mock de módulos
jest.mock('node:fs', () => ({
  promises: { readFile: jest.fn() },
  stat: jest.fn(),
  unlink: jest.fn(),
}))
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ json: body, status: init?.status })),
  },
}))

// Importar después de mocks
import { GET } from './route'

describe('🧩 API GET /files/[filename]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('🔒 devuelve 401 si falta la cookie de sesión', async () => {
    ;(cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    })

    const res = await GET({} as Request, { params: { filename: 'test.pdf' } })
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized: Missing session token' },
      { status: 401 }
    )
    expect(res.status).toBe(401)
  })

  test('⚠️ devuelve 400 si no se pasa filename', async () => {
    ;(cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue({ value: '123' }),
    })

    const res = await GET({} as Request, { params: { filename: '' } })
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Filename is required' },
      { status: 400 }
    )
    expect(res.status).toBe(400)
  })
})
