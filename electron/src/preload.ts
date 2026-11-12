import type { IpcRendererEvent } from 'electron'
import { contextBridge, ipcRenderer } from 'electron'

import type { ElectronUpdaterAPI, UpdaterEvent } from '../src/shared/updater.types'


/**
 * API heredada: mantenida para NO romper las llamadas de la aplicación.
 * Aviso de seguridad: una API IPC genérica permite invocar canales arbitrarios.
 * Migrar paulatinamente las funciones existentes a métodos allowlist explícitos.
 */
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, data: unknown) => ipcRenderer.send(channel, data),
    on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) =>
      ipcRenderer.on(channel, listener),
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
    removeListener: (channel: string, listener: (...args: unknown[]) => void) =>
      ipcRenderer.removeListener(channel, listener),
    once: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) =>
      ipcRenderer.once(channel, listener),
    sendSync: (channel: string, data: unknown) => ipcRenderer.sendSync(channel, data),
    sendToHost: (channel: string, data: unknown) => ipcRenderer.sendToHost(channel, data),
    postMessage: (channel: string, data: unknown) => ipcRenderer.postMessage(channel, data)
  }
})

/** API nueva y acotada del actualizador, separada de window.electron. */
const updater: ElectronUpdaterAPI = {
  onEvent: (callback) => {
    const listener = (_event: IpcRendererEvent, data: UpdaterEvent): void => {
      callback(data)
    }
    ipcRenderer.on('updater:event', listener)
    return () => ipcRenderer.removeListener('updater:event', listener)
  },
  getState: () => ipcRenderer.invoke('updater:get-state') as Promise<UpdaterEvent | null>,
  getVersion: () => ipcRenderer.invoke('updater:get-version') as Promise<string>,
  checkForUpdates: async () => {
    await ipcRenderer.invoke('updater:check')
  },
  install: async () => {
    await ipcRenderer.invoke('updater:install')
  }
}

contextBridge.exposeInMainWorld('updater', updater)
