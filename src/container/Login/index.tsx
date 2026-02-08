// components/Login.tsx
'use client'

import Link from 'next/link'
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
import {
  Button,
  Column,
  Divider,
  getGlobalStyle,
  GoogleLogin,
  Icon,
  LoadingButton,
  ROUTES,
  Text
} from 'pkg-components'
import React, {
  useContext, useEffect, useLayoutEffect
} from 'react'

import { getDeviceId } from '../../../apollo/getDeviceId'
import pkg from '../../../package.json'
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

  return (
    <div className={styles.container}>
      <div className={styles.card} />
      <Column as='form' className={styles.form_login}>
        <Text size='xxl' color='gray-dark'>
          ¡Falta poco para iniciar tus ventas!
        </Text>
        <Divider marginTop={getGlobalStyle('--spacing-xl')} />
        <Text size='xl'>¿Cómo deseas continuar?</Text>
        <Divider marginTop={getGlobalStyle('--spacing-xl')} />

        {/* Mock buttons: use wrap when calling responseGoogle */}
        <button
          className={styles.btn_close}
          type='button'
          onClick={() =>
            wrap(async () =>
              responseGoogle({
                user: {
                  name: 'test',
                  username: 'test',
                  lastName: 'test',
                  email: 'test@gmail.com',
                  id: 'test',
                  image: 'test',
                  locationFormat: [],
                  useragent: globalThis?.navigator?.userAgent ?? null,
                  imageUrl: 'test'
                }
              })
            )
          }
        >
          Login mock
        </button>

        {isElectron && (
          <Button
            border='none'
            styles={{
              borderRadius: getGlobalStyle('--border-radius-2xs'),
              border: 'none',
              padding: getGlobalStyle('--spacing-xl'),
              boxShadow: getGlobalStyle('--box-shadow-sm')
            }}
            onClick={async () =>
              wrap(async () => {
                await onClickLogout({ redirect: false })
                await signOutAuth({
                  redirect: true,
                  callbackUrl: ROUTES.index,
                  reload: false
                }).catch(() => {
                  setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
                })
                return handleLogin('login-google')
              })
            }
            type='button'
          >
            <Icon icon='IconGoogleFullColor' size={30} />
            {loading ? (
              <LoadingButton />
            ) : (
              'Continuar con Google'
            )}
            <div style={{ width: 'min-content' }} />
          </Button>
        )}

        {!isElectron && (
          <GoogleLogin
            clientId={process.env.NEXT_PUBLIC_CLIENT_ID_LOGIN_GOOGLE as string}
            onSuccess={(e) =>
              wrap(async () => {
                const { profileObj } = e || {}
                const {
                  name,
                  email,
                  familyName,
                  googleId,
                  imageUrl
                } = profileObj || {}
                const data = {
                  user: {
                    name,
                    username: name,
                    lastName: familyName,
                    email,
                    id: googleId,
                    image: imageUrl,
                    locationFormat: [],
                    useragent: globalThis?.navigator?.userAgent ?? null,
                    imageUrl
                  }
                }
                await responseGoogle(data)
              })
            }
            onFailure={(e) => {
              if ((e as { error?: string }).error) {
                setAlertBox({ message: `Error al iniciar sesión con Google: ${(e as { error?: string }).error}` })
              }
              stop()
            }}
            onPopupClosed={(e: string) => {
              if (e !== 'user') {
                return null
              }
              sendNotification({
                title: 'Login cancelled',
                description: 'Please try again or choose another sign-in method.',
                backgroundColor: 'warning'
              })
              stop()
            }}
            onAutoLoadFinished={() => {
              stop()
            }}
            render={({ onClick, disabled }) => (
              <Button
                color='black'
                styles={{
                  borderRadius: getGlobalStyle('--border-radius-2xs'),
                  border: 'none',
                  padding: getGlobalStyle('--spacing-xl'),
                  boxShadow: getGlobalStyle('--box-shadow-sm'),
                  color: getGlobalStyle('--color-neutral-black')
                }}
                onClick={() => {
                  onClick()
                  start()
                }}
                disabled={disabled}
                type='button'
              >
                <Icon icon='IconGoogleFullColor' size={30} />
                {loading
                  ? <LoadingButton color={getGlobalStyle('--color-primary-red')} />
                  : 'Continuar con Google'
                }
                <div style={{ width: 'min-content' }} />
              </Button>
            )}
          />
        )}
        <Divider marginTop={getGlobalStyle('--spacing-xl')} />
        <Text align='center'>
          {pkg?.version ?? ''}
        </Text>
        <Divider marginTop={getGlobalStyle('--spacing-xl')} />
        <Text size='sm' color='gray-dark'>
          Al continuar, aceptas los{' '}
          <Link
            href='/'
            target='_blank'
            rel='noopener noreferrer'
            style={{
              color: getGlobalStyle('--color-text-secondary')
            }}
          >
            Términos y Condiciones
          </Link>{' '}
          y la{' '}
          <Link
            href='/'
            target='_blank'
            rel='noopener noreferrer'
            style={{
              color: getGlobalStyle('--color-text-secondary')
            }}
          >
            Política de Privacidad
          </Link>{' '}
          del sotware.
        </Text>
      </Column>
    </div>
  )
}
