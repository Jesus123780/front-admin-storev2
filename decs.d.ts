// decs.d.ts
export {}

declare global {
  /**
   * Minimal typing for Google Identity Services used in client code.
   * Keep methods optional to avoid runtime errors in environments without the script.
   */
  var google: {
    accounts?: {
      id?: {
        /**
         * initialize google id client
         * - config shape may vary; keep as any for flexibility
         */
        initialize?: (config: object) => void
        prompt?: (callback?: (notification: unknown) => void) => void
        renderButton?: (parent: HTMLElement, options: object) => void
      }
      oauth2?: {
        initTokenClient?: (opts: object) => void
      }
    }
  } | undefined

  interface Window {
    google?: typeof google
  }

  namespace NodeJS {
    interface Global {
      google?: typeof google
    }
  }
}
