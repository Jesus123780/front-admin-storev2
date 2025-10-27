import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'node:path'
import { startBackendServer, startNextJSServer } from './services/index'


// 👉 CARGAS LAS VARIABLES .env AQUÍ
import dotenv from 'dotenv'
dotenv.config();

import { startGoogleAuth } from './auth'

export const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
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

if (process.env.NODE_ENV !== 'test') {
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
      ipcMain.on('google-auth-success', (event, userData) => {
        console.log('Datos del usuario autenticado:', userData)
      })

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
      })
    } catch (error) {
      console.error('Error starting backend server:', error)
      app.quit()
    }
  })
  app.on('open-url', (event, data) => {
    event.preventDefault()
    const mainWindow = BrowserWindow.getFocusedWindow()
    if (mainWindow) {
      mainWindow.webContents.send('login-success', data)
    }
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

}



