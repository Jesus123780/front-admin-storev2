'use client'

import Link from 'next/link'
import {
  Cookies,
  encryptSession,
  fetchJson,
  isTokenExpired,
  signOutAuth,
  useLoading,
  useLogout,
  useRegisterDeviceUser,
  useSetSession
} from 'npm-pkg-hook'
import {
  Button,
  Column,
  getGlobalStyle,
  GoogleLogin,
  Icon,
  LoadingButton,
  ROUTES,
  Text
} from 'pkg-components'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import { getDeviceId } from '../../../apollo/getDeviceId'
import pkg from '../../../package.json'
import { Context } from '../../context/Context'
import { decodeToken, getUserFromToken } from '../../utils'
import styles from './styles.module.css'

const EXPIRED_MESSAGE = 'Session expired, refresh needed'
const AUTH_ENDPOINT = '/api/auth'
const ELECTRON_AUTH_TIMEOUT_MS = 180_000
const SESSION_COOKIE_NAME =
  process.env.NEXT_PUBLIC_SESSION_NAME || 'session_name'
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_CLIENT_ID_LOGIN_GOOGLE || ''
const BACKEND_URL =
  process.env.NEXT_PUBLIC_URL_BACK_SERVER?.replace(/\/+$/, '') || ''
const TERMS_URL = process.env.NEXT_PUBLIC_TERMS_URL
const PRIVACY_URL = process.env.NEXT_PUBLIC_PRIVACY_URL

interface LoginProps {
  googleLoaded?: boolean

  /**
   * Enables the optional Google One Tap prompt.
   * Disabled by default to avoid competing login prompts.
   */
  enableGoogleOneTap?: boolean
}

interface AuthUser {
  name?: string
  username?: string
  lastName?: string
  email: string
  id?: string
  image?: string
  imageUrl?: string
  locationFormat?: unknown[]
}

interface UserPayload {
  user: AuthUser
}

interface LoginApiUser {
  id?: string | number
}

interface LoginApiStore {
  idStore?: string | number | null
}

interface LoginApiData {
  user?: LoginApiUser
  token?: string
  refreshToken?: string
  store?: LoginApiStore
}

interface LoginApiResponse {
  success?: boolean
  ok?: boolean
  message?: string
  data?: LoginApiData
}

interface GoogleLoginProfile {
  name?: string
  email?: string
  familyName?: string
  googleId?: string
  imageUrl?: string
}

interface GoogleLoginResult {
  profileObj?: GoogleLoginProfile
  tokenId?: string
}

interface GoogleClaims {
  name?: string
  family_name?: string
  email?: string
  sub?: string
  picture?: string
}

interface GoogleCredentialResponse {
  credential?: string
}

interface GoogleIdentityApi {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select: boolean
  }) => void
  prompt: () => void
  cancel?: () => void
}

interface GoogleIdentityGlobal {
  accounts?: {
    id?: GoogleIdentityApi
  }
}

interface ElectronUserInfo {
  name?: string
  email?: string
  sub?: string
  picture?: string
}

interface ElectronAuthPayload {
  user_info?: ElectronUserInfo
}

type ElectronListener = (
  event: unknown,
  payload?: unknown
) => void

interface ElectronIpcRenderer {
  invoke: (
    channel: string,
    ...args: unknown[]
  ) => Promise<unknown>
  on: (
    channel: string,
    listener: ElectronListener
  ) => void
  removeListener: (
    channel: string,
    listener: ElectronListener
  ) => void
}

/**
 * Returns a normalized identifier from a string or numeric value.
 *
 * @param {unknown} value - Identifier to normalize.
 * @returns {string} Normalized identifier or an empty string.
 */
const normalizeIdentifier = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return ''
}

/**
 * Returns a user-friendly error message.
 *
 * @param {unknown} error - Original error.
 * @returns {string} Safe message to display to the user.
 */
const getFriendlyErrorMessage = (error: unknown): string => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ''

  if (
    /failed to fetch|fetch failed|networkerror|network error|load failed/i.test(
      message
    )
  ) {
    return 'No pudimos conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.'
  }

  if (/invalid user payload/i.test(message)) {
    return 'Google no devolvió los datos necesarios para iniciar sesión. Inténtalo nuevamente.'
  }

  if (/invalid login response structure/i.test(message)) {
    return 'El servidor devolvió una respuesta inesperada. Inténtalo nuevamente.'
  }

  if (/authentication timed out/i.test(message)) {
    return 'La autenticación tardó demasiado. Inténtalo nuevamente.'
  }

  if (/backend url is not configured/i.test(message)) {
    return 'El servicio de autenticación no está configurado correctamente.'
  }

  return message || 'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.'
}

/**
 * Gets the Electron IPC bridge when the application runs in Electron.
 *
 * @returns {ElectronIpcRenderer | undefined} Available IPC bridge.
 */
const getElectronIpcRenderer = ():
  | ElectronIpcRenderer
  | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }

  const electronWindow = window as unknown as {
    electron?: {
      ipcRenderer?: ElectronIpcRenderer
    }
  }

  return electronWindow.electron?.ipcRenderer
}

/**
 * Returns the Google Identity Services API when available.
 *
 * @returns {GoogleIdentityApi | undefined} Google Identity API.
 */
const getGoogleIdentityApi = ():
  | GoogleIdentityApi
  | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }

  const googleWindow = window as unknown as {
    google?: GoogleIdentityGlobal
  }

  return googleWindow.google?.accounts?.id
}

/**
 * Login component for web and Electron applications.
 *
 * Features:
 * - Centralized Google login handling.
 * - Duplicate authentication prevention.
 * - Consistent loading feedback.
 * - Expired session cleanup.
 * - Electron authentication timeout and cancellation handling.
 * - Optional Google One Tap integration.
 *
 * @param {LoginProps} props - Login configuration.
 * @returns {JSX.Element} Login interface.
 */
export const Login: React.FC<LoginProps> = ({
  googleLoaded = false,
  enableGoogleOneTap = false
}) => {
  const [handleRegisterDeviceUser] = useRegisterDeviceUser()
  const { setAlertBox, isElectron, sendNotification } = useContext(Context)
  const { onClickLogout } = useLogout()
  const [handleSession] = useSetSession()

  const { loading, wrap } = useLoading({
    delayMs: 120,
    minDurationMs: 350
  })

  const [electronAuthPending, setElectronAuthPending] =
    useState(false)

  const loginInProgressRef = useRef(false)
  const electronAuthTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null)

  const isLoading = loading || electronAuthPending

  /**
   * Clears the Electron authentication timeout.
   *
   * @returns {void}
   */
  const clearElectronAuthTimeout = useCallback(() => {
    if (electronAuthTimeoutRef.current !== null) {
      clearTimeout(electronAuthTimeoutRef.current)
      electronAuthTimeoutRef.current = null
    }
  }, [])

  /**
   * Displays a consistent authentication error.
   *
   * @param {unknown} error - Original error.
   * @returns {void}
   */
  const notifyLoginError = useCallback(
    (error: unknown) => {
      const message = getFriendlyErrorMessage(error)

      setAlertBox({
        message,
        color: 'error'
      })

      sendNotification({
        title: 'No fue posible iniciar sesión',
        description: message,
        backgroundColor: 'error'
      })
    },
    [sendNotification, setAlertBox]
  )

  /**
   * Sends the login request and establishes the application session.
   *
   * The API payload remains compatible with the existing backend contract.
   *
   * @param {UserPayload} payload - Authenticated user profile.
   * @returns {Promise<void>} Resolves after session setup and navigation.
   */
  const doLoginFlow = useCallback(
    async (payload: UserPayload): Promise<void> => {
      const user = payload?.user

      const email = user?.email?.trim()
      const userId = normalizeIdentifier(user?.id)

      if (!email || !userId) {
        throw new Error('Invalid user payload')
      }

      if (!BACKEND_URL) {
        throw new Error('Backend URL is not configured')
      }

      const deviceId = await getDeviceId()

      if (!deviceId) {
        throw new Error(
          'No pudimos identificar este dispositivo. Inténtalo nuevamente.'
        )
      }

      const name =
        user.name?.trim() || email.split('@')[0] || 'Usuario'

      const body = {
        name,
        username: user.username?.trim() || name,
        lastName: user.lastName?.trim() || name,
        email,
        // Preserved for compatibility with the current backend.
        // This value must never be treated as proof of Google identity.
        password: userId,
        locationFormat: user.locationFormat ?? [],
        useragent:
          typeof navigator !== 'undefined'
            ? navigator.userAgent
            : null,
        deviceId,
        imageUrl: user.imageUrl ?? user.image ?? ''
      }

      const requestLogin = await fetchJson(
        `${BACKEND_URL}${AUTH_ENDPOINT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          credentials: 'include'
        }
      ) as LoginApiResponse

      const successfulResponse =
        requestLogin?.success === true ||
        (
          requestLogin?.success !== false &&
          requestLogin?.ok === true
        )

      if (!successfulResponse) {
        throw new Error(
          requestLogin?.message ||
          'No fue posible validar tus credenciales.'
        )
      }

      const responseData = requestLogin.data
      const userResponse = responseData?.user
      const token = normalizeIdentifier(responseData?.token)
      const authenticatedUserId = normalizeIdentifier(userResponse?.id)

      if (!userResponse || !token || !authenticatedUserId) {
        throw new Error('Invalid login response structure')
      }

      const storeId = normalizeIdentifier(
        responseData?.store?.idStore
      )

      const refreshToken = normalizeIdentifier(
        responseData?.refreshToken
      )

      const encryptedData = encryptSession(
        JSON.stringify(responseData)
      )

      if (!encryptedData) {
        throw new Error(
          'No fue posible preparar la sesión del usuario.'
        )
      }

      /*
       * Save the session in one operation to avoid partial session state.
       * Empty values also prevent stale merchant/store identifiers from
       * surviving a subsequent login without a store.
       */
      const cookies = [
        {
          name: 'restaurant',
          value: storeId
        },
        {
          name: 'merchant',
          value: storeId
        },
        {
          name: 'usuario',
          value: authenticatedUserId
        },
        {
          name: 'session',
          value: token
        },
        {
          name: 'refreshToken',
          value: refreshToken
        },
        {
          name: SESSION_COOKIE_NAME,
          value: encryptedData
        }
      ]

      await handleSession({ cookies })

      /*
       * Device registration is supplementary. A device-registration
       * failure should not invalidate an otherwise successful login.
       */
      try {
        if (typeof handleRegisterDeviceUser === 'function') {
          await handleRegisterDeviceUser({ deviceId })
        }
      } catch {
        // Continue because the session has already been established.
      }

      const destination = storeId
        ? '/dashboard'
        : '/merchant'

      window.location.assign(destination)
    },
    [handleRegisterDeviceUser, handleSession]
  )

  /**
   * Processes Google authentication while preventing concurrent logins.
   *
   * @param {UserPayload} payload - Google user profile.
   * @returns {Promise<void>} Authentication result.
   */
  const responseGoogle = useCallback(
    async (payload: UserPayload): Promise<void> => {
      if (loginInProgressRef.current) {
        return
      }

      loginInProgressRef.current = true

      clearElectronAuthTimeout()
      setElectronAuthPending(false)

      try {
        await wrap(async () => {
          await doLoginFlow(payload)
        })
      } catch (error) {
        notifyLoginError(error)
      } finally {
        loginInProgressRef.current = false
        setElectronAuthPending(false)
      }
    },
    [
      clearElectronAuthTimeout,
      doLoginFlow,
      notifyLoginError,
      wrap
    ]
  )

  /**
   * Validates a Google Identity Services credential response.
   *
   * @param {GoogleCredentialResponse} response - Google credential response.
   * @returns {Promise<void>} Credential processing result.
   */
  const handleGoogleCredential = useCallback(
    async (
      response: GoogleCredentialResponse
    ): Promise<void> => {
      try {
        if (!response?.credential) {
          throw new Error(
            'Google no devolvió una credencial válida.'
          )
        }

        const claims = decodeToken(
          response.credential
        ) as GoogleClaims

        if (!claims?.email || !claims?.sub) {
          throw new Error(
            'Google no devolvió los datos necesarios para iniciar sesión.'
          )
        }

        const userName =
          claims.name || claims.email.split('@')[0]

        await responseGoogle({
          user: {
            name: userName,
            username: userName,
            lastName: claims.family_name || userName,
            email: claims.email,
            id: claims.sub,
            image: claims.picture,
            imageUrl: claims.picture,
            locationFormat: []
          }
        })
      } catch (error) {
        notifyLoginError(error)
      }
    },
    [notifyLoginError, responseGoogle]
  )

  /**
   * Initiates Google authentication in Electron.
   *
   * @returns {Promise<void>} Authentication initiation result.
   */
  const handleElectronGoogleLogin = useCallback(
    async (): Promise<void> => {
      if (isLoading || loginInProgressRef.current) {
        return
      }

      const ipcRenderer = getElectronIpcRenderer()

      if (
        !ipcRenderer ||
        typeof ipcRenderer.invoke !== 'function'
      ) {
        notifyLoginError(
          new Error(
            'No se pudo iniciar la autenticación en esta aplicación.'
          )
        )

        return
      }

      clearElectronAuthTimeout()
      setElectronAuthPending(true)

      setAlertBox({
        message:
          'Abre el navegador, selecciona tu cuenta de Google y completa la autenticación.'
      })

      sendNotification({
        title: 'Iniciando sesión',
        description:
          'Completa el proceso de autenticación en el navegador.',
        backgroundColor: 'warning'
      })

      electronAuthTimeoutRef.current = setTimeout(() => {
        electronAuthTimeoutRef.current = null
        setElectronAuthPending(false)

        const message =
          'La autenticación tardó demasiado. Inténtalo nuevamente.'

        setAlertBox({
          message,
          color: 'error'
        })

        sendNotification({
          title: 'Tiempo de espera agotado',
          description: message,
          backgroundColor: 'warning'
        })
      }, ELECTRON_AUTH_TIMEOUT_MS)

      try {
        await ipcRenderer.invoke('start-google-auth')
      } catch (error) {
        clearElectronAuthTimeout()
        setElectronAuthPending(false)
        notifyLoginError(error)
      }
    },
    [
      clearElectronAuthTimeout,
      isLoading,
      notifyLoginError,
      sendNotification,
      setAlertBox
    ]
  )

  /**
   * Clears an expired session and redirects to the login page.
   *
   * @returns {Promise<void>} Session cleanup result.
   */
  const clearExpiredSession = useCallback(
    async (): Promise<void> => {
      try {
        if (typeof onClickLogout === 'function') {
          await onClickLogout({ redirect: false })
        }

        await signOutAuth({
          redirect: true,
          callbackUrl: ROUTES.index,
          reload: false
        })
      } catch {
        setAlertBox({
          message:
            'Ocurrió un error al cerrar la sesión. Intenta nuevamente.',
          color: 'error'
        })
      }
    },
    [onClickLogout, setAlertBox]
  )

  /**
   * Validates an existing session once when the component mounts.
   *
   * @returns {void} Starts session validation.
   */
  useEffect(() => {
    let isActive = true

    const validateSession = async (): Promise<void> => {
      const sessionToken = Cookies.get('session')

      if (!sessionToken) {
        return
      }

      try {
        if (isTokenExpired(sessionToken)) {
          if (isActive) {
            await clearExpiredSession()
          }

          return
        }

        const result = await getUserFromToken(sessionToken)

        if (
          isActive &&
          result?.message === EXPIRED_MESSAGE
        ) {
          await clearExpiredSession()
        }
      } catch {
        if (isActive) {
          setAlertBox({
            message:
              'No fue posible validar la sesión existente. Puedes intentar iniciar sesión nuevamente.',
            color: 'error'
          })
        }
      }
    }

    void validateSession()

    return () => {
      isActive = false
    }
  }, [clearExpiredSession, setAlertBox])

  /**
   * Registers Electron authentication listeners and removes them
   * when the component unmounts.
   *
   * @returns {void | (() => void)} Listener cleanup.
   */
  useEffect(() => {
    if (!isElectron) {
      return
    }

    const ipcRenderer = getElectronIpcRenderer()

    if (
      !ipcRenderer ||
      typeof ipcRenderer.on !== 'function' ||
      typeof ipcRenderer.removeListener !== 'function'
    ) {
      return
    }

    const resetElectronAuthentication = (): void => {
      clearElectronAuthTimeout()
      setElectronAuthPending(false)
    }

    const successListener: ElectronListener = (
      _event,
      payload
    ) => {
      const eventData = payload as
        | ElectronAuthPayload
        | undefined

      const userInfo = eventData?.user_info

      if (
        !userInfo?.email ||
        !userInfo?.sub
      ) {
        resetElectronAuthentication()

        notifyLoginError(
          new Error(
            'La autenticación no devolvió los datos necesarios del usuario.'
          )
        )

        return
      }

      const userName =
        userInfo.name ||
        userInfo.email.split('@')[0]

      void responseGoogle({
        user: {
          name: userName,
          username: userName,
          lastName: userName,
          email: userInfo.email,
          id: userInfo.sub,
          image: userInfo.picture,
          imageUrl: userInfo.picture,
          locationFormat: []
        }
      })
    }

    const errorListener: ElectronListener = () => {
      resetElectronAuthentication()

      notifyLoginError(
        new Error(
          'No se pudo completar el inicio de sesión con Google.'
        )
      )
    }

    const cancelledListener: ElectronListener = () => {
      resetElectronAuthentication()

      sendNotification({
        title: 'Inicio de sesión cancelado',
        description:
          'Puedes volver a intentarlo cuando quieras.',
        backgroundColor: 'warning'
      })
    }

    ipcRenderer.on(
      'google-auth-success',
      successListener
    )

    ipcRenderer.on(
      'google-auth-error',
      errorListener
    )

    ipcRenderer.on(
      'google-auth-cancelled',
      cancelledListener
    )

    return () => {
      ipcRenderer.removeListener(
        'google-auth-success',
        successListener
      )

      ipcRenderer.removeListener(
        'google-auth-error',
        errorListener
      )

      ipcRenderer.removeListener(
        'google-auth-cancelled',
        cancelledListener
      )

      clearElectronAuthTimeout()
    }
  }, [
    clearElectronAuthTimeout,
    isElectron,
    notifyLoginError,
    responseGoogle,
    sendNotification
  ])

  /**
   * Initializes the optional Google One Tap flow.
   *
   * One Tap is opt-in because the page already exposes an explicit
   * Google sign-in button.
   *
   * @returns {void | (() => void)} Identity prompt cleanup.
   */
  useEffect(() => {
    if (
      isElectron ||
      !enableGoogleOneTap ||
      !googleLoaded ||
      !GOOGLE_CLIENT_ID
    ) {
      return
    }

    const googleIdentity = getGoogleIdentityApi()

    if (!googleIdentity) {
      return
    }

    googleIdentity.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        void handleGoogleCredential(response)
      },
      auto_select: false
    })

    googleIdentity.prompt()

    return () => {
      googleIdentity.cancel?.()
    }
  }, [
    enableGoogleOneTap,
    googleLoaded,
    handleGoogleCredential,
    isElectron
  ])

  /**
   * Handles the legacy Google login button response.
   *
   * @param {unknown} response - Response from the GoogleLogin component.
   * @returns {Promise<void>} Authentication result.
   */
  const handleWebGoogleSuccess = async (
    response: unknown
  ): Promise<void> => {
    const googleResponse =
      response as GoogleLoginResult

    const profile = googleResponse?.profileObj

    const email = profile?.email?.trim()
    const googleId = normalizeIdentifier(
      profile?.googleId
    )

    if (!email || !googleId) {
      notifyLoginError(
        new Error(
          'Google no devolvió los datos necesarios para iniciar sesión.'
        )
      )

      return
    }

    const name =
      profile?.name?.trim() ||
      email.split('@')[0]

    await responseGoogle({
      user: {
        name,
        username: name,
        lastName: profile?.familyName || name,
        email,
        id: googleId,
        image: profile?.imageUrl,
        imageUrl: profile?.imageUrl,
        locationFormat: []
      }
    })
  }

  return (
    <main className={styles.container}>
      <div
        className={styles.card}
        aria-hidden='true'
      />

      <Column
        as='section'
        className={styles.form_login}
      >
        <header className={styles.intro}>
          <Text
            size='xxl'
            color='gray-dark'
          >
            ¡Falta poco para iniciar tus ventas!
          </Text>

          <Text
            size='sm'
            color='gray-dark'
          >
            Accede a tu cuenta para administrar tu negocio y
            comenzar a vender.
          </Text>
        </header>

        <div className={styles.login_section}>
          <Text
            size='xl'
            color='gray-dark'
          >
            ¿Cómo deseas continuar?
          </Text>

          {isElectron ? (
            <Button
              border='none'
              disabled={isLoading}
              styles={{
                width: '100%',
                minHeight: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: getGlobalStyle('--spacing-md'),
                borderRadius: getGlobalStyle('--border-radius-2xs'),
                padding: getGlobalStyle('--spacing-xl'),
                boxShadow: getGlobalStyle('--box-shadow-sm'),
                color: getGlobalStyle('--color-neutral-black')
              }}
              onClick={() => {
                void handleElectronGoogleLogin()
              }}
              type='button'
            >
              <Icon
                icon='IconGoogleFullColor'
                size={26}
              />

              {isLoading ? (
                <LoadingButton />
              ) : (
                'Continuar con Google'
              )}
              <div style={{ width: 'min-content', opacity: 0 }}>.</div>
            </Button>
          ) : (
            <GoogleLogin
              clientId={GOOGLE_CLIENT_ID}
              onSuccess={(response) => {
                void handleWebGoogleSuccess(response)
              }}
              onFailure={(error) => {
                const authError = error as {
                  error?: string
                } | null

                if (
                  authError?.error === 'popup_closed_by_user' ||
                  authError?.error === 'user_cancelled'
                ) {
                  return
                }

                notifyLoginError(error)
              }}
              onPopupClosed={(reason: string) => {
                if (reason !== 'user') {
                  return
                }

                sendNotification({
                  title: 'Inicio de sesión cancelado',
                  description:
                    'Puedes volver a intentarlo cuando quieras.',
                  backgroundColor: 'warning'
                })
              }}
              render={({ onClick, disabled }) => (
                <Button
                  color='black'
                  disabled={
                    disabled ||
                    isLoading ||
                    !GOOGLE_CLIENT_ID
                  }
                  styles={{
                    width: '100%',
                    minHeight: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: getGlobalStyle('--spacing-md'),
                    borderRadius: getGlobalStyle('--border-radius-2xs'),
                    padding: getGlobalStyle('--spacing-xl'),
                    boxShadow: getGlobalStyle('--box-shadow-sm'),
                    color: getGlobalStyle('--color-neutral-black')
                  }}
                  onClick={() => {
                    if (disabled || isLoading) {
                      return
                    }

                    onClick()
                  }}
                  type='button'
                >
                  <Icon
                    icon='IconGoogleFullColor'
                    size={26}
                  />

                  {loading ? (
                    <LoadingButton
                      color={getGlobalStyle('--color-primary-red')}
                    />
                  ) : (
                    'Continuar con Google'
                  )}
                  <div style={{ width: 'min-content', opacity: 0 }}>.</div>

                </Button>
              )}
            />
          )}

          {!GOOGLE_CLIENT_ID && !isElectron && (
            <p
              className={styles.configuration_message}
              role='alert'
            >
              El inicio de sesión con Google no está configurado.
              Contacta al administrador.
            </p>
          )}

          {electronAuthPending && (
            <p
              className={styles.login_status}
              role='status'
              aria-live='polite'
            >
              Esperando la confirmación de Google...
            </p>
          )}

          {loading && (
            <p
              className={styles.login_status}
              role='status'
              aria-live='polite'
            >
              Verificando tus credenciales...
            </p>
          )}
        </div>

        <footer className={styles.footer}>
          <span className={styles.version}>
            Versión {pkg?.version ?? ''}
          </span>

          <p className={styles.legal}>
            Al continuar, aceptas los{' '}

            {TERMS_URL ? (
              <Link
                href={TERMS_URL}
                target='_blank'
                rel='noopener noreferrer'
                className={styles.legal_link}
              >
                Términos y Condiciones
              </Link>
            ) : (
              <span className={styles.legal_unavailable}>
                Términos y Condiciones
              </span>
            )}

            {' '}y la{' '}

            {PRIVACY_URL ? (
              <Link
                href={PRIVACY_URL}
                target='_blank'
                rel='noopener noreferrer'
                className={styles.legal_link}
              >
                Política de Privacidad
              </Link>
            ) : (
              <span className={styles.legal_unavailable}>
                Política de Privacidad
              </span>
            )}

            {' '}del software.
          </p>
        </footer>
      </Column>
    </main>
  )
}

export default Login