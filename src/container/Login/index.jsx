"use client"

import React, { 
  useContext, 
  useEffect, 
  useLayoutEffect,
  useState
} from 'react'
import { getDeviceId } from '../../../apollo/getDeviceId'
import {
  Content,
  Form, 
  Card,
  Text,
  ButtonSubmit,
  WrapperActiveLink
} from './styled'
import { Context } from '../../context/Context'
import {
  ActiveLink,
  Button,
  LoadingButton,
  Portal,
  Icon
} from 'pkg-components'
import {
  fetchJson,
  signOutAuth,
  encryptSession,
  BroadcastChannel,
  useLogout,
  useSetSession,
  isTokenExpired,
  useRegisterDeviceUser,
  Cookies
} from 'npm-pkg-hook'
import { useSession, signIn, getProviders, signOut } from 'next-auth/react'
import { getUserFromToken, decodeToken } from '../../utils'

const isDev = process.env.NODE_ENV === 'development'
const EXPIRED_MESSAGE = 'Session expired, refresh needed'
export const Login = () => {
  const [handleRegisterDeviceUser] = useRegisterDeviceUser()
  const { setAlertBox } = useContext(Context)
  const [onClickLogout] = useLogout()
  const [handleSession] = useSetSession()
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState({
    google: {
      id: 'google',
      name: 'Google',
      type: 'oauth'
    }
  })

  const { data: session, status } = useSession({
    required: false,
    onUnauthenticated() {
      return
    }
  })

  const responseGoogle = async (response) => {
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

      const { storeUserId, token } = requestLogin
      const { idStore, id } = storeUserId || {}
      const decode = decodeToken(token) ?? {
        id: ''
      }
      const cookiesDefault = [
        { name: 'restaurant', value: idStore },
        { name: 'usuario', value: decode?.id || id },
        { name: 'session', value: token },
        { name: process.env.SESSION_NAME, value: encryptedData }
      ]
      await handleSession({ cookies: cookiesDefault })

      if (storeUserId) {
        const cookiesToSave = [
          { name: 'restaurant', value: idStore },
          { name: 'usuario', value: decode?.id || id },
          { name: 'session', value: token }
        ]
        await handleSession({ cookies: cookiesToSave })
        const protocol = window.location.protocol // Obtiene el protocolo actual (http: o https:)
        const baseUrl = process.env.URL_BASE.replace(/^https?:/, protocol) // Reemplaza el protocolo en la URL base
        
        window.location.href = `${baseUrl}/restaurante/getDataVerify`
        
      }
      const protocol = window.location.protocol // Obtiene el protocolo actual (http: o https:)
      const baseUrl = process.env.URL_BASE.replace(/^https?:/, protocol) // Reemplaza el protocolo en la URL base
      window.location.href = `${baseUrl}/restaurante/getDataVerify`
    } catch (error) {
      if (session) await signOut({ redirect: false })
      setAlertBox({
        message: 'Lo sentimos ha ocurrido un error',
        color: 'error'
      })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    (async () => {
      setLoading(true)
      const providers = await getProviders()
      setProviders(providers)
      setLoading(false)
    })()
  }, [])

  useLayoutEffect(() => {
    const jwtSession = Cookies.get('session')
    if (jwtSession) {
      (async () => {
        const { message } = await getUserFromToken(jwtSession)
        const sessionExpired = message === EXPIRED_MESSAGE
        if (sessionExpired) {
          await onClickLogout({ redirect: false })
          await signOutAuth({
            redirect: true,
            callbackUrl: '/',
            reload: false
          }).catch(() => {
            setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
          })
        }
      })()
    }
  }, [])

  useEffect(() => {
    const ironSession = Cookies.get(process.env.SESSION_NAME)
    const jwtSession = Cookies.get('session')
    const isExpired = isTokenExpired(jwtSession)
    const expired = isExpired && jwtSession
    if (isExpired && jwtSession) {
      onClickLogout({ redirect: false })
      signOutAuth({
        redirect: true,
        callbackUrl: '/',
        reload: false
      }).catch(() => {
        setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
      })
    }
    if (ironSession) return
    if (session && status === 'authenticated' && !ironSession && !expired) {
      (async () => {
        setLoading(true)
        if (jwtSession) {
          const { message } = await getUserFromToken(jwtSession)
          const sessionExpired = message === EXPIRED_MESSAGE
          if (sessionExpired) {
            await onClickLogout({ redirect: false })
            return await signOutAuth({
              redirect: true,
              callbackUrl: '/',
              reload: false
            }).catch(() => {
              setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
            })
          }
        }
        const { token, storeUserId } = session.session ?? {
          token: '',
          storeUserId: null
        }
        const { idStore, id } = storeUserId || {}
        const decode = decodeToken(token) || {
          id: null
        }
        const cookiesDefault = [
          {
            name: process.env.SESSION_NAME,
            value: session[process.env.SESSION_NAME]
          },
          { name: 'restaurant', value: idStore },
          { name: 'usuario', value: decode?.id || id },
          { name: 'session', value: token }
        ]
        await handleSession({ cookies: cookiesDefault })
        const deviceId = await getDeviceId()

        await handleRegisterDeviceUser({ deviceId })
        window.location.href =
          process.env.NODE_ENV === 'production'
            ? `${process.env.URL_BASE}/restaurante/getDataVerify`
            : `${window.location.origin}/restaurante/getDataVerify`
        setLoading(false)
      })()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const label = 'Continuar con Google'
  const buttonComponents = {
    google: (
      <ButtonSubmit
        color='2'
        colorFont={'red'}
        height='40px'
        onClick={async () => {
          setLoading(true)
          await onClickLogout({ redirect: false })
          await signOutAuth({
            redirect: true,
            callbackUrl: '/',
            reload: false
          }).catch(() => {
            setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
          })
          return signIn('google')
        }}
        size='14px'
        type='button'
      >
        <Icon icon='IconGoogleFullColor' size='30px' />
        {loading ? <LoadingButton /> : label}
        <div style={{ width: 'min-content' }} />
      </ButtonSubmit>
    ),
    _: (
      <ButtonSubmit
        color='2'
        colorFont={'red'}
        disabled={loading}
        height='40px'
        onClick={() => {
          return signIn('facebook')
        }}
        size='14px'
        type='button'
      >
        <Icon icon='Facebook' color='#365899' size='30px' />
        {loading ? <LoadingButton /> : 'Continuar con facebook'}
        <div style={{ width: 'min-content' }} />
      </ButtonSubmit>
    )
  }
 

  return (
    <>
      <Content>
        <Card />
        <Form>
          <Text size='30px'>¡Falta poco para iniciar tus ventas!</Text>
          <Text size='15px'>¿Cómo deseas continuar?</Text>
          {isDev && (
            <>
              <Button
                standard={String(false)}
                onClick={async () => {
                  const cookiesDefault = [ 
                    {
                      name: process.env.SESSION_NAME,
                      value: 'Fe26.2*1*106b053b3238cae195945ba793098117b42fa94ee47e8c15ba71cbdb9d6307dc*LTmDD5JW4SiXC8NkoyBYWQ*P-i_qH9AdGJlOzkFInFNrTiFAgDVEekgMXCThkjeLUBF5xt9q-mVrOOwBNHMcJpPTexJ0mVReG6fgfsEL9_lwrBRTKP6nb6sh4AfVr93Euv1vE1SZtYb1E0xrnYZhspYhhGtgAlqLbsm8ohf8ozfaFr3kK8CDQ6NuJ_3EkjxewTaLIavuHXaclkbd_-IG78G4bu-Pl4bxVgkDQJ1hPI1zmvhqUaZYFQIYnYr9pmL_rDhkjt7aOq2dVMDxkhrLGlMajo2yfQs6C0nit3EPxrBaDdodvuhAFS9F7y4ZrTD_vEOoF8eXnWhHJJJxdolxpJ81E1MMpunnLm8bbrhS-laMDuViutc7odrWsyc0Bja-RPM26VDfB1-Yu70ohLtDUAvvsKo1vZBlKC68IVm7Doa7IqVsu7xOblhKwm3-NRgPPyXAMaAWocMvMED6qQgRlrBqos5137CXT_DGvWelQ_v9kmMrhNwLzRbYCXpqyrC0dqZaQC2D-7swobtR8FYgJN7g0QxCmTTIahAp7IbJ47Kw56jSxwcjdGC32r15u9AVkL992FoHQkhukHJHJdGD4BiDYYeYnMsJs0hAOaRgOx6ML0Q4Dhf6inhE6cAcR_TYkZjus0AC0Y2QgAHzsaPLDD_A1MVeaw0pFMxAtqPzDhtmyRWxYF-CYe4Yng42AfZ-o9ncX61pE8EZSPNUijbaWGo-S9AJlphGwiP3kOc9WwboFECHZtRT06j1FReg-0tLhPkTXv9KbAZXODrjwFwVK4303X3qFeMsWjO7vfTt_dXqaEl_rx-bnuAEu5zsXkzFJpU3GZCjocZhcV4006HmYnGfY4s1Yxpvg-RyLp1HjfQbryiBcf-BJIIeW3ijEolgGE*1708376347843*aa58b0647f46203099eb91d3c1352a785ca12259abac806a50db69b2e73ee2ff*eYa64DxURtb_xVdbVtnvbvAI2Z1RrZENtuTHwSjSkm4~2'
                    },
                    { name: 'restaurant', value: '013e5387-34a1-6a78-303d-5098f17bf640' },
                    { name: 'usuario', value: '013e5387-34a1-6a78-303d-5098f17bf640' },
                    { name: 'session', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSmVzdXMgSnV2aW5hbyIsImVtYWlsIjoianV2aW5hb2plc3VzZEBnbWFpbC5jb20iLCJ1c2VybmFtZSI6Ikplc3VzIEp1dmluYW8iLCJyZXN0YXVyYW50Ijp7ImlkU3RvcmUiOiIwMTNlNTM4Ny0zNGExLTZhNzgtMzAzZC01MDk4ZjE3YmY2NDAiLCJpZCI6IjAxM2U1Mzg3LTM0YTEtNmE3OC0zMDNkLTUwOThmMTdiZjY0MCJ9LCJpZCI6IjAxM2U1Mzg3LTM0YTEtNmE3OC0zMDNkLTUwOThmMTdiZjY0MCIsImlhdCI6MTcwNzA4MDM0NywiZXhwIjoxNzA3MTY2NzQ3fQ.pdDGTwjKLeAsBHh4Lu8Ex9b-RLxtTdM4B5P172dzfO4' }
                  ]
                  await handleSession({ cookies: cookiesDefault })
                  channel.post({
                    event: 'session',
                    data: { trigger: 'session_open' }
                  })
                }}
                type='button'
              >
                Click
              </Button>
              <button
                onClick={async () => {
                  await onClickLogout()
                  return signOut({ redirect: false })
                }}
                type='button'
              >
                Logout
              </button>
              <button
                onClick={() => {
                  const session = {
                    user: {
                      name: 'Jesus Juvinao',
                      username: 'Jesus Juvinao',
                      lastName: 'Jesus Juvinao',
                      email: 'juvinaojesusd+2@gmail.com',
                      id: '595752',
                      locationFormat: [],
                      useragent:
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                      deviceid: 'b764c99d45aaf95c9725d55c8ffe1c57'
                    }
                  }
                  return responseGoogle(session)
                }}
                type='button'
              >
                Login false
              </button>
            </>
          )}
          {Object.values(providers).map((provider) => {
            return (
              <div key={provider?.name}>{buttonComponents[provider.id]}</div>
            )
          })}
          <WrapperActiveLink>
            <ActiveLink activeClassName='active' href='/entrar/email'>
              <a>
                <Button
                standard={String(false)}
                  bgColor={'gray'}
                  margin='10px auto'
                  type='button'
                >
                  Correo
                </Button>
              </a>
            </ActiveLink>
            <ActiveLink activeClassName='active' href='/register'>
              <a>
                <Button
                  standard={String(false)}
                  bgColor={'gray'}
                  margin='10px auto'
                  type='button'
                >
                  Registrate
                </Button>
              </a>
            </ActiveLink>
          </WrapperActiveLink>
        </Form>
      </Content>
    </>
  )
}
