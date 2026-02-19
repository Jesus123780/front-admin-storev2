// components/Login.tsx
'use client'

import { useRouter } from 'next/navigation'
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
import { ROUTES } from 'pkg-components'
import GridStack from 'pkg-components/stories/organisms/grid_stack_react_pure_js_module/components/GridStack/GridStack'
import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'

import { getDeviceId } from '../../../apollo/getDeviceId'
import { Context } from '../../context/Context'
import { decodeToken, getUserFromToken } from '../../utils'
import styles from './styles.module.css'

const EXPIRED_MESSAGE = 'Session expired, refresh needed'

interface ILogin {
  googleLoaded?: boolean
}

export const Login: React.FC<ILogin> = ({ googleLoaded = false }) => {
  const router = useRouter()
  const [handleRegisterDeviceUser] = useRegisterDeviceUser()
  const { setAlertBox, isElectron, sendNotification } = useContext(Context)
  const { onClickLogout } = useLogout()
  const [handleSession] = useSetSession()

  // useLoading: configurable
  const {
    loading,
    wrap,
    start,
    stop
  } = useLoading({ delayMs: 120, minDurationMs: 350 })

  /**
   * Centralized login flow used by google callbacks.
   * It does NOT manipulate UI loading directly; we rely on wrapping the call with loading.wrap
   */
  interface UserPayload {
    user: {
      name: string
      username?: string
      lastName?: string
      email: string
      id?: string
      image?: string
      imageUrl?: string
      locationFormat?: unknown[]
      useragent?: string | null
    }
  }

  const doLoginFlow = async (userPayload: UserPayload) => {
    // Validate input quickly
    if (!userPayload?.user?.email) {
      throw new Error('Invalid user payload')
    }
    const { user } = userPayload
    const device = await getDeviceId()
    const body = {
      name: user.name,
      username: user.username ?? user.name,
      lastName: user.lastName ?? user.name,
      email: user.email,
      password: user.id ?? '',
      locationFormat: user.locationFormat ?? [],
      useragent: globalThis?.navigator?.userAgent ?? null,
      deviceId: device,
      imageUrl: user.imageUrl ?? user.image
    }

    const requestLogin = await fetchJson(
      `${process.env.NEXT_PUBLIC_URL_BACK_SERVER}/api/auth`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      }
    )

    if (!requestLogin?.success && !requestLogin?.ok) {
      // prefer server message
      throw new Error(requestLogin?.message || 'Failed to fetch authentication.')
    }

    const { user: userResp, token, store, refreshToken } = requestLogin.data ?? {}
    if (!userResp || !token) {
      throw new Error('Invalid login response structure.')
    }

    const encryptedData = encryptSession(JSON.stringify(requestLogin.data))

    setAlertBox({ message: requestLogin.message, color: 'success' })
    sendNotification({
      title: 'Success',
      description: 'Iniciaste sesión correctamente',
      backgroundColor: 'success'
    })

    const cookiesDefault = [
      { name: 'restaurant', value: store?.idStore },
      { name: 'usuario', value: userResp?.id },
      { name: 'session', value: token },
      { name: process.env.NEXT_PUBLIC_SESSION_NAME || 'session_name', value: encryptedData }
    ]
    await handleSession({ cookies: cookiesDefault })

    if (store?.idStore) {
      const cookiesToSave = [
        { name: 'merchant', value: store.idStore },
        { name: 'usuario', value: userResp?.id },
        { name: 'session', value: token },
        { name: 'refreshToken', value: refreshToken }
      ]
      await handleSession({ cookies: cookiesToSave })
      if (typeof handleRegisterDeviceUser === 'function') {
        await handleRegisterDeviceUser({ deviceId: device })
      }
      stop()
      // hard redirect to ensure session pick-up
      globalThis.location.href = `${globalThis.location.origin}/dashboard`
      return
    }

    stop()
    globalThis.location.href = `${globalThis.location.origin}/merchant`
  }

  // Wrap calls where you previously used setLoading(true)
  const responseGoogle = async (response: UserPayload) => {
    // call the centralized flow wrapped with loading
    return await wrap(async () => {
      try {
        await doLoginFlow(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
        setAlertBox({ message, color: 'error' })
        sendNotification({
          title: 'Error',
          description: message,
          backgroundColor: 'error'
        })
        throw err
      }
    })
  }

  // Removed unused responseGoogleLegacy function

  const handleLogin = async (type: string) => {
    if (type === 'login-google') {
      setAlertBox({ message: 'Iniciando sesión con Google, abre tu navegador y selecciona un perfil' })
      interface ElectronIpcRendererInvoke {
        invoke(channel: string, ...args: unknown[]): Promise<unknown>
      }
      interface ElectronWindowInvoke {
        electron?: {
          ipcRenderer?: ElectronIpcRendererInvoke
        }
      }
      const win = globalThis as unknown as { window?: ElectronWindowInvoke }
      if (win.window !== undefined && win.window.electron) {
        sendNotification({
          title: 'Iniciando sesión',
          description: 'Abre tu navegador y selecciona un perfil',
          backgroundColor: 'success'
        })
        if (win.window.electron.ipcRenderer && typeof win.window.electron.ipcRenderer.invoke === 'function') {
          win.window.electron.ipcRenderer.invoke('start-google-auth')
        } else {
          sendNotification({
            title: 'Error',
            description: 'No se pudo iniciar sesión con Google, por favor intenta de nuevo',
            backgroundColor: 'error'
          })
        }
      }
    }
  }

  // logout flow: use loading.wrap for async parts
  const handleLogout = async () => {
    const jwtSession = Cookies.get('session')
    if (!jwtSession) { return }
    return await wrap(async () => {
      try {
        const { message } = await getUserFromToken(jwtSession)
        const sessionExpired = message === EXPIRED_MESSAGE
        if (sessionExpired) {
          if (typeof onClickLogout === 'function') {
            await onClickLogout({ redirect: false })
          }
          await signOutAuth({
            redirect: true,
            callbackUrl: ROUTES.index,
            reload: false
          }).catch(() => {
            setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
          })
        }
      } catch (err) {
        if (err instanceof Error) {
          setAlertBox({ message: 'Ocurrió un error al cerrar sesión', color: 'error' })
        }
        setAlertBox({ message: 'Ocurrió un error al cerrar sesión', color: 'error' })
      }
    })
  }

  useEffect(() => {
    if (googleLoaded && (globalThis).google) {
      handleLogout();
      // @ts-expect-error Google accounts id API types are not available in TypeScript
      globalThis.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID_LOGIN_GOOGLE as string,
        callback: async (response: { credential: string }) => {
          const { credential } = response
          if (credential) {
            const data = decodeToken(credential)
            const session = {
              user: {
                name: data.name,
                username: data.name,
                lastName: data.name,
                email: data.email,
                id: data.sub,
                image: data.picture
              }
            }
            // wrap call to display loader properly
            await responseGoogle(session)
          }
        },
        auto_select: true
        // @ts-expect-error Google accounts id API types are not available in TypeScript
      }); (globalThis).google.accounts.id.prompt()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleLoaded, router])

  useLayoutEffect(() => {
    handleLogout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const ironSession = Cookies.get(String(process.env.NEXT_PUBLIC_SESSION_NAME))
    const jwtSession = Cookies.get('session')
    const expired = isTokenExpired(jwtSession)
    if (expired && jwtSession) {
      onClickLogout({ redirect: false })
      signOutAuth({
        redirect: true,
        callbackUrl: ROUTES.index,
        reload: false
      }).catch(() => {
        setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
      })
    }
    if (ironSession) { return }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    interface ElectronIpcRenderer {
      on(channel: string, listener: (...args: object[]) => void): void
      removeListener(channel: string, listener: (...args: object[]) => void): void
    }
    interface ElectronWindow {
      electron?: {
        ipcRenderer?: ElectronIpcRenderer
      }
    }
    const win = globalThis as unknown as { window?: ElectronWindow }
    if (win.window !== undefined && win.window.electron) {
      const listener = async (_event: unknown, data: {
        user_info: {
          name: string
          email: string
          sub: string
          picture: string
        }
      }) => {
        const { user_info } = data || {}
        const session = {
          user: {
            name: user_info.name,
            username: user_info.name,
            lastName: user_info.name,
            email: user_info.email,
            id: user_info.sub,
            image: user_info.picture,
            imageUrl: user_info.picture
          }
        }
        // wrap so loader shows while we process
        await responseGoogle(session)
      }
      const errorListener = () => {
        setAlertBox({ message: 'Error al iniciar sesión con Google' })
        sendNotification({
          title: 'Error',
          description: 'No se pudo iniciar sesión con Google, por favor intenta de nuevo',
          backgroundColor: 'error'
        })
      }

      if (win.window.electron && win.window.electron.ipcRenderer && typeof win.window.electron.ipcRenderer.on === 'function') {
        // @ts-expect-error Google accounts id API types are not available in TypeScript
        win.window.electron.ipcRenderer.on('google-auth-success', listener)
        win.window.electron.ipcRenderer.on('google-auth-error', errorListener)
      }

      return () => {
        // @ts-expect-error Google accounts id API types are not available in TypeScript
        if (win.window.electron && win.window.electron.ipcRenderer && typeof win.window.electron.ipcRenderer.removeListener === 'function') {
          // @ts-expect-error Google accounts id API types are not available in TypeScript
          win.window.electron.ipcRenderer.removeListener('google-auth-success', listener)
          // @ts-expect-error Google accounts id API types are not available in TypeScript
          win.window.electron.ipcRenderer.removeListener('google-auth-error', errorListener)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [layout, setLayout] = useState([
    { static: true,  id: 'card1', x: 0, y: 0, w: 4, h: 3, title: 'Card 1', component: { text: 'Hola Jesús' } },
    { static: false,  id: 'card2', x: 4, y: 0, w: 4, h: 3, title: 'Card 2' },
  ])

  const COMPONENT_MAP = {
    card1: ({ text }) => <div>{text}</div>,
    card2: () => <div>Otra tarjeta</div>,
  }

  return (
    <div style={{
      backgroundColor: '#ffd4d4'
    }}>
      <GridStack
        items={layout}
        cols={12}
        rowHeight={30}
        margin={[0, 0]}
        containerPadding={[0, 0]}
        componentMap={COMPONENT_MAP}
        onLayoutChange={(newLayout) => {
          setLayout(prev => prev.map(item => {
            const found = newLayout.find(l => l.i === item.id);
            return found ? { ...item, x: found.x, y: found.y, w: found.w, h: found.h } : item;
          }));
        }}

        snapEnabled={false}
        snapThreshold={16}
        /* NUEVAS PROPS */
        dragMode="overlay"            // overlay | direct
        collisionMode="push"          // push | swap | none
        dragThrottleMs={0}            // 0 = requestAnimationFrame
        allowOverlapDuringDrag={false}
        animateOnDrop={true}
        preventCollision={true}
      />

      <div className={styles.card} />

    </div>
  )
}
