
import { spawn } from 'node:child_process'
import { join } from 'node:path'

import { is } from '@electron-toolkit/utils'

export const startBackendServer = (): void => {
  if (is.dev) {return}

  const executableName = (() => {
    if (process.platform === 'win32') {
      return 'front-back-server.exe'
    }

    if (process.platform === 'darwin') {
      if (process.arch === 'arm64') {
        return 'front-back-server-mac-arm64'
      }

      if (process.arch === 'x64') {
        return 'front-back-server-mac-x64'
      }
    }

    throw new Error(
      `Plataforma no soportada: ${process.platform}/${process.arch}`
    )
  })()

  const backendPath = join(
    process.resourcesPath,
    executableName
  )

  console.info(
    '[ELECTRON] Iniciando backend:',
    backendPath
  )

  const backendProcess = spawn(
    backendPath,
    [],
    {
      stdio: 'ignore'
    }
  )

  backendProcess.on('error', (error) => {
    console.error(
      '[ELECTRON] Backend start error:',
      error
    )
  })

  backendProcess.on('exit', (code, signal) => {
    console.info(
      '[ELECTRON] Backend finalizado:',
      { code, signal }
    )
  })
}
