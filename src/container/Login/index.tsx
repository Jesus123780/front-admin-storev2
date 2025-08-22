"use client"

import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'
import { getDeviceId } from '../../../apollo/getDeviceId'
import { Context } from '../../context/Context'
import {
  LoadingButton,
  Icon,
  Text,
  Divider,
  getGlobalStyle,
  Button,
  Column,
  GoogleLogin,
  ROUTES
} from 'pkg-components'
import {
  fetchJson,
  signOutAuth,
  encryptSession,
  useLogout,
  useSetSession,
  isTokenExpired,
  useRegisterDeviceUser,
  Cookies
} from 'npm-pkg-hook'
import { getUserFromToken, decodeToken } from '../../utils'
import { useRouter } from 'next/navigation'
import { GoogleUserBody } from './types'
import styles from './styles.module.css'

const EXPIRED_MESSAGE = 'Session expired, refresh needed'

interface ILogin {
  googleLoaded?: boolean
}
export const Login: React.FC<ILogin> = ({ googleLoaded = false,
}: ILogin): React.ReactElement => {
  const router = useRouter()
  const [handleRegisterDeviceUser] = useRegisterDeviceUser()
  const { setAlertBox, isElectron, sendNotification } = useContext(Context)
  const [onClickLogout] = useLogout()
  const [handleSession] = useSetSession()
  const [loading, setLoading] = useState(false)

  const handleLogin = async (type: string) => {
    try {
      if (type === 'login-google') {
        setAlertBox({ message: 'Iniciando sesión con Google, abre tu navegador y selecciona un perfil' })
        if (typeof window !== 'undefined' && window.electron) {
          sendNotification({
            title: 'Iniciando sesión',
            description: 'Abre tu navegador y selecciona un perfil',
            backgroundColor: 'success'
          })
          if (window.electron.ipcRenderer && typeof window.electron.ipcRenderer.invoke === 'function') {
            window.electron.ipcRenderer.invoke('start-google-auth')
          } else {
            sendNotification({
              title: 'Error',
              description: 'No se pudo iniciar sesión con Google, por favor intenta de nuevo',
              backgroundColor: 'error'
            })
          }
        }
      }
    } catch (error) {
      setAlertBox({ message: 'Error al iniciar sesión con Google' })
      sendNotification({
        title: 'Error',
        description: 'No se pudo iniciar sesión con Google, por favor intenta de nuevo',
        backgroundColor: 'error'
      })
    }
  }
  const responseGoogle = async (response: GoogleUserBody) => {
    setLoading(true)
    const { user } = response || {}
    const { name, email, id, image } = user || {}
    const device = await getDeviceId()
    const body = {
      name: name,
      username: name,
      lastName: name,
      email,
      password: id,
      locationFormat: [],
      useragent: window?.navigator?.userAgent ?? null,
      deviceid: device,
      imageUrl: image
    }

    try {
      const requestLogin = await fetchJson(
        `${process.env.NEXT_PUBLIC_URL_BACK_SERVER}/api/auth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include'
        }
      )

      console.log("🚀 ~ responseGoogle ~ requestLogin:", requestLogin)

      // Validación de respuesta
      if (!requestLogin?.success) {
        throw new Error(requestLogin?.message || 'Failed to fetch authentication.')
      }

      const {
        user,
        token,
        store,
        refreshToken
      } = requestLogin.data
      if (!user || !token) {
        throw new Error('Invalid login response structure.')
      }

      // 🔒 Encriptar sesión
      const encryptedData = encryptSession(JSON.stringify(requestLogin.data))

      // ✅ Notificaciones UI
      setAlertBox({ message: requestLogin.message, color: 'success' })
      sendNotification({
        title: 'Success',
        description: 'Iniciaste sesión correctamente',
        backgroundColor: 'success'
      })

      // 🥠 Cookies base
      const cookiesDefault = [
        { name: 'restaurant', value: store?.idStore },
        { name: 'usuario', value: user?.id },
        { name: 'session', value: token },
        { name: process.env.NEXT_PUBLIC_SESSION_NAME, value: encryptedData }
      ]
      await handleSession({ cookies: cookiesDefault })

      // 🍪 Cookies adicionales si hay store
      if (store?.idStore) {
        const cookiesToSave = [
          { name: 'merchant', value: store.idStore },
          { name: 'usuario', value: user?.id },
          { name: 'session', value: token },
          { name: 'refreshToken', value: refreshToken }
        ]
        await handleSession({ cookies: cookiesToSave })

        // 🔔 Registrar dispositivo
        await handleRegisterDeviceUser({ deviceId: device })

        // 🔀 Redirección con recarga completa
        window.location.href = `${window.location.origin}/dashboard`
        return
      }

      // 🔀 Redirección sin recarga completa (cuando no hay store)
      window.location.href = `${window.location.origin}/merchant`

    } catch (error) {
      console.error("🚀 ~ responseGoogle ~ error:", error)

      setAlertBox({
        message: error instanceof Error ? error.message : 'Error al iniciar sesión',
        color: 'error'
      })

      // if (session) await signOut({ redirect: false })
    } finally {
      setLoading(false)
    }

  }
  const responseGoogleLegacy = async (response: GoogleUserBody) => {
    setLoading(true)
    const { user } = response || {}
    const { name, email, id, image } = user || {}
    const device = await getDeviceId()
    const body = {
      name: name,
      username: name,
      lastName: name,
      email,
      password: id,
      locationFormat: [],
      useragent: window?.navigator?.userAgent ?? null,
      deviceid: device,
      imageUrl: image
    }

    try {
      const requestLogin = await fetchJson(
        `${process.env.NEXT_PUBLIC_URL_BACK_SERVER}/api/auth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include'
        }
      )
      if (!requestLogin.ok) {
        throw new Error('Failed to fetch authentication.')
      }
      const encryptedData = encryptSession(JSON.stringify(requestLogin))
      setAlertBox({ message: requestLogin.message, color: 'success' })
      sendNotification({
        title: 'Success',
        description: 'Iniciaste sesión correctamente',
        backgroundColor: 'success'
      })
      const { storeUserId, token } = requestLogin
      const { idStore, id } = storeUserId || {}
      const decode = decodeToken(token) ?? {
        id: ''
      }
      const cookiesDefault = [
        { name: 'restaurant', value: idStore },
        { name: 'usuario', value: decode?.id || id },
        { name: 'session', value: token },
        { name: process.env.NEXT_PUBLIC_SESSION_NAME, value: encryptedData }
      ]
      await handleSession({ cookies: cookiesDefault })

      if (storeUserId) {
        const cookiesToSave = [
          { name: 'merchant', value: idStore },
          { name: 'usuario', value: decode?.id || id },
          { name: 'session', value: token }
        ]
        await handleSession({ cookies: cookiesToSave })
        await handleRegisterDeviceUser({ deviceId: device })
        // Redirección con recarga completa
        const baseUrl = window.location.origin

        window.location.href = `${baseUrl}/dashboard`
        return
      }
      const baseUrl = window.location.origin
      // Redirección sin recarga completa
      window.location.href = `${baseUrl}/merchant`

    } catch (error) {
      // if (session) await signOut({ redirect: false })
      setAlertBox({
        message: 'Error al iniciar sesión con Google',
        color: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (googleLoaded && window.google) {
      handlelogOut()
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID_LOGIN_GOOGLE as string,
        callback: async (response: { credential: string }) => {
          const { credential } = response
          if (credential) {
            const data: DecodedToken = decodeToken(credential)
            const {
              name,
              email,
              picture,
              sub: id
            } = data
            const body: GoogleUserBody = {
              user: {
                name,
                username: name,
                lastName: name,
                email,
                id,
                image: picture,
                locationFormat: [],
                useragent: window?.navigator?.userAgent ?? null,
                imageUrl: picture
              }
            }
            responseGoogle(body)
          }
        },
        auto_select: true,
      })

      // Interfaces
      interface DecodedToken {
        name: string
        email: string
        picture: string
        sub: string
      }
      window.google.accounts.id.prompt()
    }
  }, [googleLoaded, router])


  const handlelogOut = async () => {
    const jwtSession = Cookies.get('session')
    if (jwtSession) {
      (async () => {
        const { message } = await getUserFromToken(jwtSession)
        const sessionExpired = message === EXPIRED_MESSAGE
        if (sessionExpired) {
          await onClickLogout({ redirect: false })
          await signOutAuth({
            redirect: true,
            callbackUrl: ROUTES.index,
            reload: false
          }).catch(() => {
            setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
          })
        }
      })()
    }
  }
  useLayoutEffect(() => {
    handlelogOut()
  }, [])

  useEffect(() => {
    const ironSession = Cookies.get(process.env.NEXT_PUBLIC_SESSION_NAME)
    const jwtSession = Cookies.get('session')
    const isExpired = isTokenExpired(jwtSession)
    const expired = isExpired && jwtSession
    if (isExpired && jwtSession) {
      onClickLogout({ redirect: false })
      signOutAuth({
        redirect: true,
        callbackUrl: ROUTES.index,
        reload: false
      }).catch(() => {
        setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
      })
    }
    if (ironSession) return
    // if (session && status === 'authenticated' && !ironSession && !expired) {
    //   (async () => {
    //     setLoading(true)
    //     if (jwtSession) {
    //       const { message } = await getUserFromToken(jwtSession)
    //       const sessionExpired = message === EXPIRED_MESSAGE
    //       if (sessionExpired) {
    //         await onClickLogout({ redirect: false })
    //         return await signOutAuth({
    //           redirect: true,
    //           callbackUrl: '/',
    //           reload: false
    //         }).catch(() => {
    //           setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
    //         })
    //       }
    //     }
    //     const { token, storeUserId } = session.session ?? {
    //       token: '',
    //       storeUserId: null
    //     }
    //     const { idStore, id } = storeUserId || {}
    //     const decode = decodeToken(token) || {
    //       id: null
    //     }
    //     const cookiesDefault = [
    //       {
    //         name: process.env.NEXT_PUBLIC_SESSION_NAME,
    //         value: session[process.env.NEXT_PUBLIC_SESSION_NAME]
    //       },
    //       { name: 'restaurant', value: idStore },
    //       { name: 'usuario', value: decode?.id || id },
    //       { name: 'session', value: token }
    //     ]
    //     await handleSession({ cookies: cookiesDefault })
    //     const deviceId = await getDeviceId()

    //     await handleRegisterDeviceUser({ deviceId })
    //     window.location.href =
    //       process.env.NODE_ENV === 'production'
    //         ? `${process.env.URL_BASE}/restaurante/getDataVerify`
    //         : `${window.location.origin}/restaurante/getDataVerify`
    //     setLoading(false)
    //   })()
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron) {
      const listener = (_event: any, data: any) => {
        const { user_info } = data || {}
        const {
          name,
          email,
          sub:
          id,
          picture
        } = user_info || {}
        const session = {
          user: {
            name,
            username: name,
            lastName: name,
            email,
            id,
            image: picture,
            imageUrl: picture,
            locationFormat: [],
            useragent: window?.navigator?.userAgent ?? null
          }
        }
        setLoading(false)
        return responseGoogle(session)
      }
      const errorListener = () => {
        setLoading(false)
        setAlertBox({ message: 'Error al iniciar sesión con Google' })
        sendNotification({
          title: 'Error',
          description: 'No se pudo iniciar sesión con Google, por favor intenta de nuevo',
          backgroundColor: 'error'
        })
      }

      if (window.electron && window.electron.ipcRenderer && typeof window.electron.ipcRenderer.on === 'function') {
        window.electron.ipcRenderer.on('google-auth-success', listener)
        window.electron.ipcRenderer.on('google-auth-error', errorListener)
      }
      return () => {
        // Limpia el listener cuando el componente se desmonta
        setLoading(false)
        if (
          window.electron &&
          window.electron.ipcRenderer &&
          typeof window.electron.ipcRenderer.removeListener === 'function'
        ) {
          window.electron.ipcRenderer.removeListener('google-auth-success', listener)
        }
      }
    }
  }, [])

  return (
    <>
      <div className={styles.container}>
        <div className={styles.card} />
        <Column as='form' className={styles.form_login}>
          <Text size='xxl'>
            ¡Falta poco para iniciar tus ventas!
          </Text>
          <Divider marginTop={getGlobalStyle('--spacing-xl')} />
          <Text size='xl'>
            ¿Cómo deseas continuar?
          </Text>
          <Divider marginTop={getGlobalStyle('--spacing-xl')} />
          <button className={styles.btn_close} type='button' onClick={() => {
            const data = {
              user: {
                name: 'test',
                username: 'test',
                lastName: 'test',
                email: 'test@gmail.com',
                id: 'test',
                image: 'test',
                locationFormat: [],
                useragent: window?.navigator?.userAgent ?? null,
                imageUrl: 'test'
              }
            }
            setLoading(true)
            responseGoogle(data)
          }}>
            Login mock false
          </button>
          <button className={styles.btn_close} type='button' onClick={() => {
            const data = {
              user: {
                name: 'test',
                username: 'test',
                lastName: 'test',
                email: 'test@gmail.com',
                id: 'test',
                image: 'test',
                locationFormat: [],
                useragent: window?.navigator?.userAgent ?? null,
                imageUrl: 'test'
              }
            }
            setLoading(true)
            responseGoogleLegacy(data)
          }}>
            Login mock false (legacy)
          </button>
          {isElectron
            && <Button
              border='none'
              className={styles.btn_login}
              styles={{
                borderRadius: getGlobalStyle('--border-radius-2xs'),
                border: 'none',
                padding: getGlobalStyle('--spacing-xl'),
                boxShadow: getGlobalStyle('--box-shadow-sm'),
              }}
              onClick={async () => {
                setLoading(true)
                await onClickLogout({ redirect: false })
                await signOutAuth({
                  redirect: true,
                  callbackUrl: ROUTES.index,
                  reload: false
                }).catch(() => {
                  setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
                })
                return handleLogin('login-google')
              }}
              type='button'
            >
              <Icon icon='IconGoogleFullColor' size={30} />
              {loading ? <LoadingButton /> : 'Continuar con Google'}
              <div style={{ width: 'min-content' }} />
            </Button>
          }
          {!isElectron &&
            <GoogleLogin
              clientId={process.env.NEXT_PUBLIC_CLIENT_ID_LOGIN_GOOGLE as string}
              onSuccess={(e) => {
                setLoading(false)
                const { profileObj } = e || {}
                const { name, email, familyName, givenName, googleId, imageUrl } = profileObj || {}
                const data = {
                  user: {
                    name,
                    username: name,
                    lastName: familyName,
                    email,
                    id: googleId,
                    image: imageUrl,
                    locationFormat: [],
                    useragent: window?.navigator?.userAgent ?? null,
                    imageUrl
                  }
                }
                responseGoogle(data)
              }}
              onFailure={(e) => {
                setLoading(false)
              }}

              render={({ onClick, disabled }) => (
                <Button
                  className={styles.btn_login}
                  styles={{
                    borderRadius: getGlobalStyle('--border-radius-2xs'),
                    border: 'none',
                    padding: getGlobalStyle('--spacing-xl'),
                    boxShadow: getGlobalStyle('--box-shadow-sm'),
                  }}
                  onClick={() => {
                    onClick()
                    setLoading(true)
                  }}
                  disabled={disabled}
                  type='button'
                >
                  <Icon icon='IconGoogleFullColor' size={30} />
                  {loading ? <LoadingButton /> : 'Continuar con Google'}
                  <div style={{ width: 'min-content' }} />
                </Button>
              )}
            />
          }
        </Column>
      </div>
    </>
  )
}
