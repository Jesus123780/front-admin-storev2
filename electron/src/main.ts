import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain } from 'electron'
import { getPort } from 'get-port-please'
import { startServer } from 'next/dist/server/lib/start-server'
import { join } from 'path'
import { spawn } from 'child_process'
// 👉 CARGAS LAS VARIABLES .env AQUÍ
import dotenv from 'dotenv'
dotenv.config();

import { startGoogleAuth } from './auth'

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  const loadURL = async () => {
    const port = 3000
    if (is.dev) {
      mainWindow.loadURL(`http://localhost:${port}`)
      return port
    } else {
      try {
        const port = await startNextJSServer()
        console.log('Next.js server started on port:', port)
        mainWindow.loadURL(`http://localhost:${port}`)
        return port
      } catch (error) {
        console.error('Error starting Next.js server:', error)
      }
    }
  }
  const port = loadURL()
  return port
}

const startBackendServer = async () => {
  try {
    const isDev = is.dev
    if (isDev) {
      console.log('[ELECTRON] Backend server is not started in production mode')
      return
    }
    const backendDir = isDev
    ? join(__dirname, '..', 'front-back-server', 'front-back-server.exe')
    : join(process.resourcesPath, 'front-back-server.exe')  

    console.log(`[ELECTRON] Backend server path: ${backendDir}`)
    
    const backendProcess = spawn(backendDir, [], { stdio: 'ignore' })

    backendProcess.on('error', (error) => {
      console.error('[ELECTRON] Error starting backend server process:', error)
      throw error
    })

    backendProcess.on('exit', (code) => {
      console.log(`[ELECTRON] Backend server process exited with code: ${code}`)
    })
  } catch (error) {
    console.error('[ELECTRON] Error starting backend server:', error)
    throw error
  }
}

const startNextJSServer = async () => {
  try {
    const nextJSPort = await getPort({ portRange: [30_011, 50_000] })
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
  } catch (error) {
    console.error('Error starting Next.js server:', error)
    throw error
  }
}

app.whenReady().then(async () => {
  try {
    await startBackendServer()
    const portApp = await createWindow()
    console.log('Electron app started on port:', portApp)

    ipcMain.handle('start-google-auth', async (event) => {
      const mainWindow = BrowserWindow.getFocusedWindow();
      await startGoogleAuth(mainWindow, portApp);
    });
    ipcMain.on('ping', () => console.log('pong'))

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error) {
    console.error('Error starting backend server:', error)
    app.quit()
  }
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
