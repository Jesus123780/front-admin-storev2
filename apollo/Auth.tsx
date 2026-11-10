
import {
  gql,
  useQuery,
  useReactiveVar
} from '@apollo/client'
import {
  usePathname,
  useRouter,
  useSearchParams
} from 'next/navigation'
import {
  getSession,
  useLogout
} from 'npm-pkg-hook'
import { ROUTES } from 'pkg-components'
import React, {
  Fragment,
  useContext,
  useEffect,
  useRef
} from 'react'

import { Context } from '@/context/Context'

import { isLoggedVar } from './helpers/is-logged-var'
import {
  getAccessToken,
  refreshSession,
  shouldProactivelyRefresh
} from './helpers/session-token'

/**
 * Query param usado para avisar que la sesión expiró.
 */
const SESSION_EXPIRED_PARAM = 'sessionExpired'

/**
 * Marca utilizada para mostrar la notificación una sola vez.
 */
const SESSION_EXPIRED_FLAG = 'app.session.expired'

/**
 * Marca que indica que el logout por expiración ya fue procesado.
 *
 * Es independiente de SESSION_EXPIRED_FLAG porque la notificación
 * puede consumir su propia marca antes de terminar la navegación.
 */
const SESSION_LOGOUT_HANDLED_FLAG = 'app.session.logout-handled'

/**
 * Rutas públicas donde mostramos el aviso de sesión expirada.
 */
const SESSION_EXPIRED_ROUTES = new Set<string>([
  ROUTES.index,
  ROUTES.login
])

/**
 * Consulta local de Apollo.
 * Se declara fuera del componente para conservar su referencia.
 */
const QUERY_DATA_LOGGING = gql`
  query IsUserLoggedIn {
    isLogged @client
  }
`

interface AuthProps {
  readonly children: React.ReactNode
}

export default function Auth({ children }: AuthProps) {
  // ROUTING
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // AUTH
  const { onClickLogout } = useLogout({})
  const loggedState = useReactiveVar(isLoggedVar)

  // CONTEXT
  const { sendNotification } = useContext(Context)

  // QUERIES
  const { data: dataLogged } = useQuery(QUERY_DATA_LOGGING)

  // REFS
  const verificationQueueRef = useRef<Promise<void>>(
    Promise.resolve()
  )

  const lastVerificationPathRef = useRef<string | null>(null)

  const logoutInProgressRef = useRef(false)

  const notificationHandledRef = useRef(false)

  /**
   * Responde si el logout por expiración ya fue procesado
   * en esta pestaña y todavía no se ha establecido una sesión nueva.
   */
  const isExpiredLogoutHandled = (): boolean => {
    if (globalThis.window === undefined) {
      return false
    }

    return (
      globalThis.sessionStorage.getItem(
        SESSION_LOGOUT_HANDLED_FLAG
      ) === 'true'
    )
  }

  /**
   * Marca la sesión como activa y elimina la marca del logout anterior.
   */
  const markSessionAsActive = (): void => {
    if (globalThis.window !== undefined) {
      globalThis.sessionStorage.removeItem(
        SESSION_LOGOUT_HANDLED_FLAG
      )
    }

    isLoggedVar({
      state: true,
      expired: false,
      message: 'Sesión activa',
      code: 200
    })
  }

  /**
   * Valida la sesión al montar la aplicación y al cambiar de ruta.
   *
   * Los cambios en searchParams no vuelven a ejecutar esta validación.
   * Las validaciones se encolan para evitar que dos rutas ejecuten
   * simultáneamente el mismo proceso de autenticación.
   */
  useEffect(() => {
    if (!pathname) {
      return
    }

    // Evita repetir la validación en renders de la misma ruta.
    if (lastVerificationPathRef.current === pathname) {
      return
    }

    lastVerificationPathRef.current = pathname

    const verifySession = async (): Promise<void> => {
      try {
        // Después de un logout forzado no debemos volver a validar
        // la misma sesión desde las rutas públicas.
        if (
          SESSION_EXPIRED_ROUTES.has(pathname) &&
          isExpiredLogoutHandled()
        ) {
          return
        }

        const session = await getSession()

        // La sesión ya está vigente.
        if (session?.isSession) {
          markSessionAsActive()
          return
        }

        // No hay sesión activa. Intentamos recuperar la sesión
        // usando el refresh token HttpOnly.
        const hadSession = Boolean(getAccessToken())

        const refreshed = await refreshSession()

        if (refreshed) {
          markSessionAsActive()
          return
        }

        // El refresh falló. Solo expiramos si existía una sesión
        // anterior; no debemos afectar al usuario que no ha iniciado
        // sesión y está visitando una ruta pública.
        if (hadSession) {
          isLoggedVar({
            state: false,
            expired: true,
            message: 'La sesión ha expirado',
            code: 403
          })
        }
      } catch (error) {
        // Conservamos el comportamiento existente para errores
        // explícitos de validación.
        if (typeof error === 'string') {
          isLoggedVar({
            state: false,
            expired: true,
            message: 'Error validating session',
            code: 500
          })
        }
      }
    }

    // Encola la validación. Esto evita que los cambios rápidos de ruta
    // provoquen varias llamadas concurrentes.
    const previousValidation = verificationQueueRef.current

    const nextValidation = previousValidation.then(
      verifySession,
      verifySession
    )

    verificationQueueRef.current = nextValidation.catch(() => {
      // Evita que un error deje bloqueada la cola.
    })
  }, [pathname])

  /**
   * Refresh PROACTIVO:
   *
   * - Al montar la aplicación.
   * - Cuando la pestaña vuelve a estar visible.
   *
   * No intenta refrescar nuevamente una sesión cuyo logout ya
   * fue procesado y que está en una ruta pública.
   */
  useEffect(() => {
    if (globalThis.window === undefined) {
      return
    }

    const proactiveRefresh = async (): Promise<void> => {
      if (
        SESSION_EXPIRED_ROUTES.has(pathname ?? '') &&
        isExpiredLogoutHandled()
      ) {
        return
      }

      if (!getAccessToken()) {
        return
      }

      if (!shouldProactivelyRefresh()) {
        return
      }

      try {
        await refreshSession()
      } catch {
        // La validación principal de sesión es responsable
        // de determinar si corresponde cerrar la sesión.
      }
    }

    void proactiveRefresh()

    const onVisibilityChange = (): void => {
      if (globalThis.document.visibilityState === 'visible') {
        void proactiveRefresh()
      }
    }

    globalThis.document.addEventListener(
      'visibilitychange',
      onVisibilityChange
    )

    return () => {
      globalThis.document.removeEventListener(
        'visibilitychange',
        onVisibilityChange
      )
    }
  }, [])

  /**
   * Logout automático cuando la sesión expira.
   *
   * El ref impide que el mismo logout se ejecute más de una vez,
   * incluso si onClickLogout cambia de referencia entre renders.
   */
  useEffect(() => {
    if (!loggedState?.expired) {
      // Una sesión nueva permite volver a procesar futuras expiraciones.
      if (loggedState?.state) {
        logoutInProgressRef.current = false
      }

      return
    }

    if (logoutInProgressRef.current) {
      return
    }

    logoutInProgressRef.current = true

    const forceLogout = async (): Promise<void> => {
      try {
        if (globalThis.window !== undefined) {
          // Marcamos ambas condiciones antes de limpiar el store.
          // Así ningún render intermedio vuelve a validar la sesión.
          globalThis.sessionStorage.setItem(
            SESSION_EXPIRED_FLAG,
            'true'
          )

          globalThis.sessionStorage.setItem(
            SESSION_LOGOUT_HANDLED_FLAG,
            'true'
          )
        }

        // Limpia cookies y Apollo sin delegar la redirección.
        await onClickLogout?.({
          redirect: false
        })
      } catch {
        // Aunque falle el logout interno, continuamos con el flujo
        // de navegación y evitamos repetir el proceso.
      } finally {
        // Reset del estado reactivo.
        isLoggedVar({
          state: false,
          expired: false,
          message: '',
          code: ''
        })

        const targetUrl =
          `${ROUTES.login}?${SESSION_EXPIRED_PARAM}=true`

        // Evita navegar innecesariamente a la misma URL.
        const alreadyAtTarget =
          pathname === ROUTES.login &&
          searchParams?.get(SESSION_EXPIRED_PARAM) === 'true'

        if (!alreadyAtTarget) {
          router.replace(targetUrl)
        }
      }
    }

    void forceLogout()
  }, [
    loggedState?.expired,
    loggedState?.state,
    onClickLogout,
    pathname,
    router,
    searchParams
  ])

  /**
   * Notificación de sesión expirada.
   *
   * Se muestra una sola vez, independientemente de si la señal
   * llegó mediante el query param o sessionStorage.
   */
  useEffect(() => {
    if (globalThis.window === undefined) {
      return
    }

    if (!SESSION_EXPIRED_ROUTES.has(pathname ?? '')) {
      return
    }

    const hasParam =
      searchParams?.get(SESSION_EXPIRED_PARAM) === 'true'

    const hasFlag =
      globalThis.sessionStorage.getItem(
        SESSION_EXPIRED_FLAG
      ) === 'true'

    // Cuando ya no hay señal, permitimos una futura notificación.
    if (!hasParam && !hasFlag) {
      notificationHandledRef.current = false
      return
    }

    if (notificationHandledRef.current) {
      return
    }

    // Se marca antes de notificar para evitar duplicaciones
    // provocadas por renders del contexto.
    notificationHandledRef.current = true

    globalThis.sessionStorage.removeItem(
      SESSION_EXPIRED_FLAG
    )

    sendNotification?.({
      title: 'Sesión expirada',
      description:
        'Tu sesión ha expirado. Inicia sesión nuevamente.',
      backgroundColor: '#E74C3C',
      position: 'top-right'
    })

    // Limpiamos únicamente el parámetro de sesión expirada
    // y conservamos los demás parámetros de la URL.
    if (hasParam) {
      const newParams = new URLSearchParams(
        searchParams?.toString() ?? ''
      )

      newParams.delete(SESSION_EXPIRED_PARAM)

      const queryString = newParams.toString()

      router.replace(
        queryString
          ? `${pathname}?${queryString}`
          : pathname
      )
    }
  }, [
    pathname,
    searchParams,
    router,
    sendNotification
  ])

  /**
   * Log de diagnóstico de Apollo.
   */
  useEffect(() => {
    const response = dataLogged?.isLogged

    if (
      response?.message &&
      Number(response.code) >= 500
    ) {
      // eslint-disable-next-line no-console
      console.log(response.message)
    }
  }, [dataLogged?.isLogged])

  return (
    <Fragment>
      {children}
    </Fragment>
  )
}
