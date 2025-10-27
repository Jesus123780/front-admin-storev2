import { POST } from './route'

describe('src/app/api/auth/_log/route POST', () => {
  // Minimal Response polyfill for environments lacking WHATWG Response (e.g., older Node/Jest)
  beforeAll(() => {
    if (typeof (globalThis as any).Response === 'undefined') {
      class SimpleResponse {
        private _body: string
        status: number
        constructor(body?: any, init?: any) {
          this._body = body !== undefined ? String(body) : ''
          this.status = (init && init.status) || 200
        }
        async text() {
          return this._body
        }
        async json() {
          return JSON.parse(this._body || 'null')
        }
      }
      ;(globalThis as any).Response = SimpleResponse
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns 200 with { success: true } and logs the received message', async () => {
    const body = { foo: 'bar' }
    const req = { json: jest.fn().mockResolvedValue(body) } as any
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

    const res = await POST(req)

    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toBe(JSON.stringify({ success: true }))
    expect(logSpy).toHaveBeenCalledWith('Mensaje recibido:', body)
  })

  it('returns 500 and logs an error when req.json throws', async () => {
    const error = new Error('boom')
    const req = { json: jest.fn().mockRejectedValue(error) } as any
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(req)

    expect(res.status).toBe(500)
    await expect(res.text()).resolves.toBe('Internal Server Error')
    expect(errSpy).toHaveBeenCalledWith('Error processing request:', error)
  })
})
jest.mock('next/headers', () => ({ cookies: jest.fn() }))

describe('src/app/api/auth/signout/route POST', () => {
  it('deletes all cookies and returns 200 with { success: true }', async () => {
    const { cookies: mockCookies } = jest.requireMock('next/headers') as { cookies: jest.Mock }
    mockCookies.mockReset()

    const cookieStore = {
      getAll: jest.fn().mockReturnValue([{ name: 'token' }, { name: 'session' }]),
      delete: jest.fn(),
    }
    mockCookies.mockResolvedValue(cookieStore)

    const { POST } = await import('../signout/route')
    const res = await POST()

    expect(cookieStore.getAll).toHaveBeenCalled()
    expect(cookieStore.delete).toHaveBeenCalledTimes(2)
    expect(cookieStore.delete).toHaveBeenCalledWith('token')
    expect(cookieStore.delete).toHaveBeenCalledWith('session')
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toBe(JSON.stringify({ success: true }))
  })

  it('handles no cookies and returns success without calling delete', async () => {
    const { cookies: mockCookies } = jest.requireMock('next/headers') as { cookies: jest.Mock }
    mockCookies.mockReset()

    const cookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      delete: jest.fn(),
    }
    mockCookies.mockResolvedValue(cookieStore)

    const { POST } = await import('../signout/route')
    const res = await POST()

    expect(cookieStore.getAll).toHaveBeenCalled()
    expect(cookieStore.delete).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toBe(JSON.stringify({ success: true }))
  })

  it('returns 500 and logs an error when cookies() rejects', async () => {
    const { cookies: mockCookies } = jest.requireMock('next/headers') as { cookies: jest.Mock }
    mockCookies.mockReset()

    const error = new Error('fail')
    mockCookies.mockRejectedValue(error)

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { POST } = await import('../signout/route')
    const res = await POST()

    expect(res.status).toBe(500)
    await expect(res.text()).resolves.toBe('Internal Server Error')
    expect(errSpy).toHaveBeenCalledWith('Error processing request:', error)
  })
})