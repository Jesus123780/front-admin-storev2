// electron-window.d.ts
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        invoke?: (channel: string, ...args: any[]) => Promise<any>;
        on?: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
        removeListener?: (channel: string, listener: (...args: any[]) => void) => void;
      };
    };
  }
}

export { };
