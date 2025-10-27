import { join } from 'node:path'

import { app } from 'electron'
import { getPort } from 'get-port-please'
import { startServer } from 'next/dist/server/lib/start-server'

/**
 * Starts Next.js compiled server and returns the port.
 * @returns {Promise<number>} Port where Next.js is listening.
 */
export const startNextJSServer = async (): Promise<number> => {
    const portRange: [number, number] = [30011, 50000]
    const nextJSPort = await getPort({ portRange })
    const webDir = join(app.getAppPath(), 'app')

    await startServer({
        dir: webDir,
        isDev: false,
        hostname: 'localhost',
        port: nextJSPort,
        customServer: true,
        allowRetry: false,
        keepAliveTimeout: 5000,
        minimalMode: false,
    })

    return nextJSPort
}
