import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'

/**
 * Starts backend server executable in production.
 * Does nothing in dev mode.
 */
export const startBackendServer = (): void => {
  if (is.dev) return

  const backendPath = join(process.resourcesPath, 'front-back-server.exe')
  const backendProcess = spawn(backendPath, [], { stdio: 'ignore' })

  backendProcess.on('error', (error) => {
    console.error('[ELECTRON] Backend start error:', error)
  })
}
