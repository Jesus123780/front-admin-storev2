import {
  gql,
  useQuery,
  useReactiveVar
} from '@apollo/client'
import {
  useParams,
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
  useEffect
} from 'react'

import { Context } from '@/context/Context'

import { isLoggedVar } from './helpers/is-logged-var'
import {
  getAccessToken,
  refreshSession,
  shouldProactivelyRefresh
} from './helpers/session-token'
// import { UPDATE_TOKEN } from './queries'

/**
 * Query param usado para avisar que la sesión expiró tras un logout forzado.
 */
const SESSION_EXPIRED_PARAM = 'sessionExpired'

/**
 * Marca efímera en sessionStorage. Es más fiable que el query param porque
 * sobrevive al re-render que provoca el logout (clearStore) y no compite con
 * la sincronización de la URL del App Router.
 */
const SESSION_EXPIRED_FLAG = 'app.session.expired'

/**
 * Rutas públicas donde mostramos el aviso de sesión expirada.
 */
const SESSION_EXPIRED_ROUTES = new Set<string>([ROUTES.index, ROUTES.login])

interface AuthProps {
  readonly children: React.ReactNode
}

export default function Auth({ children }: AuthProps) {
  // STATE
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { onClickLogout } = useLogout({})
  const { sendNotification } = useContext(Context)

  // Escucha reactiva del estado de sesión. El errorLink de Apollo marca
  // isLoggedVar({ expired: true }) cuando el backend responde "Session expired".
  const loggedState = useReactiveVar(isLoggedVar)

  // QUERIES
  // const [updateToken, { data, called }] = useMutation(UPDATE_TOKEN)

  // Actualiza el auth token del usuario por cada cambio de ventana
  const QUERY_DATA_LOGGING = gql`
    query IsUserLoggedIn {
      isLogged @client
    }
  `
  const { data: dataLogged } = useQuery(QUERY_DATA_LOGGING)


  // Respuesta de la verificación del token
  useEffect(() => {

    const verifySession = async () => {
      try {
        const session = await getSession()

        // Sesión válida y vigente -> marcar como activa.
        if (session?.isSession) {
          isLoggedVar({
            state: true,
            expired: false,
            message: 'Sesión activa',
            code: 200
          })
          return
        }

        // No hay access token válido. Antes de cerrar sesión intentamos
        // recuperarla con el refresh token HttpOnly (p. ej. tras recargar la
        // app con el access ya expirado). Solo si el refresh falla la sesión
        // se considera realmente terminada.
        const hadSession = Boolean(getAccessToken())
        const refreshed = await refreshSession()

        if (refreshed) {
          isLoggedVar({
            state: true,
            expired: false,
            message: 'Sesión activa',
            code: 200
          })
          return
        }

        // El refresh falló. Solo marcamos expirada si existía una sesión
        // previa; de lo contrario el usuario simplemente no ha iniciado sesión
        // y no debemos desloguearlo (evita el redirect a "/" durante el login).
        if (hadSession) {
          isLoggedVar({
            state: false,
            expired: true,
            message: 'La sesión ha expirado',
            code: 403
          })
        }
      } catch (error) {
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

    verifySession()
     
  }, [pathname, params])

  // 🔄 Refresh PROACTIVO: al montar la app y cada vez que la pestaña vuelve a
  // ser visible, si el access token está próximo a expirar lo renovamos antes
  // de que cualquier operación falle. El single-flight de refreshSession evita
  // renovaciones concurrentes.
  useEffect(() => {
    if (globalThis.window === undefined) { return }

    const proactiveRefresh = async () => {
      if (!getAccessToken()) { return }
      if (!shouldProactivelyRefresh()) { return }
      await refreshSession()
    }

    // Al montar.
    proactiveRefresh()

    const onVisibilityChange = () => {
      if (globalThis.document.visibilityState === 'visible') {
        proactiveRefresh()
      }
    }

    globalThis.document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      globalThis.document.removeEventListener('visibilitychange', onVisibilityChange)
    }
     
  }, [])

  // Cierra la sesión automáticamente cuando el errorLink (o verifySession)
  // marca la sesión como expirada, y redirige a /login con el query param
  // para notificar al usuario.
  useEffect(() => {
    if (!loggedState?.expired) { return }

    const forceLogout = async () => {
      try {
        // Deja una marca efímera ANTES de limpiar/navegar para que el aviso
        // sobreviva al re-render provocado por el logout.
        if (globalThis.window !== undefined) {
          globalThis.sessionStorage.setItem(SESSION_EXPIRED_FLAG, 'true')
        }

        // Limpia cookies y el store de Apollo sin redirigir, para poder
        // controlar nosotros la URL de destino.
        await onClickLogout?.({ redirect: false })
      } finally {
        // Resetea el estado reactivo para evitar re-disparar el logout en
        // navegaciones posteriores.
        isLoggedVar({
          state: false,
          expired: false,
          message: '',
          code: ''
        })
        router.replace(`${ROUTES.login}?${SESSION_EXPIRED_PARAM}=true`)
      }
    }

    forceLogout()
     
  }, [loggedState?.expired])

  // Muestra la notificación de "sesión expirada" al llegar a / o /login.
  // Lee tanto el query param como la marca de sessionStorage (respaldo fiable)
  // y luego limpia ambos para no repetir el aviso.
  useEffect(() => {
    if (globalThis.window === undefined) { return }
    if (!SESSION_EXPIRED_ROUTES.has(pathname)) { return }

    const hasParam = searchParams?.get(SESSION_EXPIRED_PARAM) === 'true'
    const hasFlag = globalThis.sessionStorage.getItem(SESSION_EXPIRED_FLAG) === 'true'

    if (!hasParam && !hasFlag) { return }

    // Limpia la marca de sessionStorage inmediatamente (one-shot).
    globalThis.sessionStorage.removeItem(SESSION_EXPIRED_FLAG)

    sendNotification?.({
      title: 'Sesión expirada',
      description: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
      backgroundColor: '#E74C3C',
      position: 'top-right'
    })

    // Limpia el query param de la URL para no repetir el aviso al refrescar.
    if (hasParam) {
      const newParams = new URLSearchParams(searchParams?.toString() ?? '')
      newParams.delete(SESSION_EXPIRED_PARAM)
      const queryStr = newParams.toString()
      router.replace(queryStr ? `${pathname}?${queryStr}` : pathname)
    }
     
  }, [pathname, searchParams])

  useEffect(() => {
    const res = dataLogged?.isLogged
    if (res?.message) {
      if (res.code >= 500) {
        // eslint-disable-next-line
        console.log(res.message);
        // eslint-disable-next-line
        if (res.code >= 300 || res.code === 403) console.log(res.message);
        // eslint-disable-next-line
        if (res.code >= 400 && res.code !== 403) console.log(res.message);
        // eslint-disable-next-line
        if (res.code >= 200) console.log(res.message);
      }
    }
  }, [dataLogged?.isLogged])
  return <Fragment>{children}</Fragment>
}
