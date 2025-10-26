import { jest } from '@jest/globals'
import { startNextJSServer } from './startNextServer'
import { getPort } from 'get-port-please'
import { startServer } from 'next/dist/server/lib/start-server'
import { normalize } from 'node:path'

jest.mock('get-port-please')
jest.mock('next/dist/server/lib/start-server')
jest.mock('electron', () => ({
  app: { getAppPath: jest.fn(() => '/fake/app/path') }
}))

describe('startNextJSServer', () => {

  it('should get an available port, start Next server and return the port', async () => {
    jest.mocked(getPort).mockResolvedValue(40000)
    ;(startServer as jest.Mock).mockImplementation(() => {})

    const port = await startNextJSServer()

    expect(port).toBe(40000)

    expect(getPort).toHaveBeenCalledWith({ portRange: [30011, 50000] })

    expect(startServer).toHaveBeenCalledWith({
      dir: normalize('/fake/app/path/app'),
      isDev: false,
      hostname: 'localhost',
      port: 40000,
      customServer: true,
      allowRetry: false,
      keepAliveTimeout: 5000,
      minimalMode: false,
    })
  })

  it('should throw if something inside fails', async () => {
    jest.mocked(getPort).mockImplementation(() => Promise.reject(new Error('boom')))

    await expect(startNextJSServer()).rejects.toThrow('boom')
  })
})
