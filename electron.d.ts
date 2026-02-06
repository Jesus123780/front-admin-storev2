// electron-window.d.ts
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, ...args: object[]) => void;
        invoke?: (channel: string, ...args: object[]) => Promise<object>;
        on?: (channel: string, listener: (event: object, ...args: object[]) => void) => void;
        removeListener?: (channel: string, listener: (...args: object[]) => void) => void;
      };
    };
  }
}

export { };
