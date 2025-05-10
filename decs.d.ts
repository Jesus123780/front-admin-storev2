 declare module "npm-pkg-hook"
//  Property 'accounts' does not exist on type 'typeof google'.ts(2339)

export {};

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
