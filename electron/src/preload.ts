import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  ipcRenderer: {
    send: (channel: string, data: any) => ipcRenderer.send(channel, data),
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => ipcRenderer.on(channel, listener),
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
    removeListener: (channel: string, listener: (...args: any[]) => void) => ipcRenderer.removeListener(channel, listener),
    once: (channel: string, listener: (event: any, ...args: any[]) => void) => ipcRenderer.once(channel, listener),
    sendSync: (channel: string, data: any) => ipcRenderer.sendSync(channel, data),
    sendToHost: (channel: string, data: any) => ipcRenderer.sendToHost(channel, data),
    postMessage: (channel: string, data: any) => ipcRenderer.postMessage(channel, data)
  },
});
