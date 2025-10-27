import { decl } from 'postcss';

// declare styled-components
declare module 'styled-components' {
  export { }
}
declare module 'npm-pkg-hook' {
  // Puedes exportar tipos o valores específicos del paquete aquí si los conoces
  export { };
}

export { };

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
  }
}
