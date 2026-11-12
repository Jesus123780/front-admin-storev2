import { join } from 'node:path'

import { is } from '@electron-toolkit/utils'
import dotenv from 'dotenv'
import {
 app, 
 BrowserWindow, 
 ipcMain 
} from 'electron'

import { startGoogleAuth } from './auth'
import { initializeAutoUpdater } from './services/autoUpdater'
import { startBackendServer, startNextJSServer } from './services/index'

dotenv.config()

let mainWindow: BrowserWindow | null = null
let nextServerPort: number | undefined

export const createWindow = async (): Promise<number | undefined> => {
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow = window

  console.info('[Main] Inicializando updater')
console.info('[Main] Archivo Electron ejecutado:', __filename)
console.info('[Main] Versión de Electron:', process.versions.electron)

  // No comprobar actualizaciones en dev; el servicio conserva su estado en Main.
  initializeAutoUpdater(() => mainWindow)


  window.once('ready-to-show', () => {
    if (!window.isDestroyed()) {window.show()}
  })

  window.on('closed', () => {
    if (mainWindow === window) {mainWindow = null}
  })

  if (is.dev) {
    const port = 3000
    await window.loadURL(`http://localhost:${port}`)
    return port
  }

  try {
    // Evitar reiniciar el servidor Next.js al recrear la ventana (macOS).
    if (nextServerPort === undefined) {
      nextServerPort = await startNextJSServer()
      console.log('Next.js server started on port:', nextServerPort)
    }

    await window.loadURL(`http://localhost:${nextServerPort}`)
    return nextServerPort
  } catch (error) {
    console.error('Error starting Next.js server:', error)
    if (!window.isDestroyed()) {window.close()}
    return undefined
  }
}

if (process.env.NODE_ENV !== 'test') {
  app.whenReady().then(async () => {
    try {
      await startBackendServer()
      const portApp = await createWindow()
      if (portApp === undefined) {
        throw new Error('No fue posible iniciar el servidor Next.js')
      }
      console.log('Electron app started on port:', portApp)
      console.log('Venty version:', app.getVersion())

      ipcMain.handle('start-google-auth', async () => {
        const focusedWindow = BrowserWindow.getFocusedWindow()
        if (!focusedWindow) {return}
        await startGoogleAuth(focusedWindow, portApp)
      })

      ipcMain.on('ping', () => console.log('pong'))
      ipcMain.on('google-auth-success', (_event, userData) => {
        console.log('Datos del usuario autenticado:', userData)
      })

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          void createWindow().catch(console.error)
        }
      })
    } catch (error) {
      console.error('Error starting app:', error)
      app.quit()
    }
  }).catch((error: unknown) => {
    console.error('Electron app.whenReady failed:', error)
    app.quit()
  })

  app.on('open-url', (event, data) => {
    event.preventDefault()
    const window = BrowserWindow.getFocusedWindow() ?? mainWindow
    if (window && !window.isDestroyed()) {
      window.webContents.send('login-success', data)
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {app.quit()}
  })
}
