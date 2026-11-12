import type { IpcMainInvokeEvent } from 'electron'
import {
  app,
  BrowserWindow,
  ipcMain
} from 'electron'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'

import type { UpdaterEvent } from '../shared/updater.types'

const CHANNELS = {
  EVENT: 'updater:event',
  STATE: 'updater:get-state',
  VERSION: 'updater:get-version',
  CHECK: 'updater:check',
  INSTALL: 'updater:install'
} as const

type GetWindow = () => BrowserWindow | null

let initialized = false
let downloaded = false
let latestVersion: string | null = null
let state: UpdaterEvent | null = null
let pendingCheck: Promise<void> | null = null

const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

/** Sólo se atienden solicitudes IPC de la ventana principal. */
const assertTrustedSender = (
  event: IpcMainInvokeEvent,
  getWindow: GetWindow
): void => {
  const window = getWindow()
  if (!window || window.isDestroyed() || event.sender !== window.webContents) {
    throw new Error('Solicitud IPC no autorizada')
  }
}

const emit = (getWindow: GetWindow, nextState: UpdaterEvent): void => {
  state = nextState
  log.info('[updater]', nextState.status,
    'version' in nextState ? nextState.version : '')
  const window = getWindow()
  if (window && !window.isDestroyed() && !window.webContents.isDestroyed()) {
    window.webContents.send(CHANNELS.EVENT, nextState)
  }
}

const check = async (getWindow: GetWindow): Promise<void> => {
  // Evita llamadas concurrentes que podrían iniciar descargas duplicadas.
  if (pendingCheck) { return pendingCheck }
  if (downloaded) { return }
  pendingCheck = (async () => {
    try {
      await autoUpdater.checkForUpdates()
    } catch (error: unknown) {
      log.error('[updater] Falló la consulta', error)
      emit(getWindow, { status: 'error', message: formatError(error) })
    }
  })()

  try {
    await pendingCheck
  } finally {
    pendingCheck = null
  }
}

/**
 * Se invoca una sola vez después de app.whenReady y de crear BrowserWindow.
 * Los handlers se registran también en desarrollo para que Next.js pueda
 * consultar el estado sin errores; no habrá descargas sin app empaquetada.
 */
export const initializeAutoUpdater = (getWindow: GetWindow): void => {
  if (initialized) { return }
  initialized = true

  ipcMain.handle(CHANNELS.STATE, (event) => {
    assertTrustedSender(event, getWindow)
    return state
  })

  ipcMain.handle(CHANNELS.VERSION, (event) => {
    assertTrustedSender(event, getWindow)
    return app.getVersion()
  })

  ipcMain.handle(CHANNELS.CHECK, async (event) => {
    assertTrustedSender(event, getWindow)
    if (!app.isPackaged) { return }
    await check(getWindow)
  })

  ipcMain.handle(CHANNELS.INSTALL, (event) => {
    assertTrustedSender(event, getWindow)

    if (!app.isPackaged || !downloaded) {
      throw new Error('No hay una actualización descargada para instalar')
    }

    autoUpdater.quitAndInstall(false, true)
  })

  console.info('[Updater] IPC registrados correctamente', {
    packaged: app.isPackaged,
    platform: process.platform,
    channels: Object.values(CHANNELS)
  })

  if (!app.isPackaged || process.platform !== 'win32') {
    log.info('[updater] Desactivado: desarrollo o plataforma distinta de Windows')
    return
  }

  // Electron Builder 24.x + electron-updater 6.x.
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = false
  autoUpdater.logger = log

  autoUpdater.on('checking-for-update', () => {
    emit(getWindow, { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    latestVersion = info.version
    downloaded = false
    emit(getWindow, { status: 'available', version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    latestVersion = null
    emit(getWindow, {
      status: 'not-available',
      currentVersion: app.getVersion()
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    emit(getWindow, {
      status: 'downloading',
      version: latestVersion ?? 'nueva',
      percent: Math.min(100, Math.max(0, Math.round(progress.percent))),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    latestVersion = info.version
    downloaded = true
    emit(getWindow, { status: 'downloaded', version: info.version })
  })

  autoUpdater.on('error', (error) => {
    log.error('[updater] Error', error)
    emit(getWindow, { status: 'error', message: formatError(error) })
  })

  // Estado IPC persistido: el frontend puede montarse después de esta llamada.
  void check(getWindow)
}
