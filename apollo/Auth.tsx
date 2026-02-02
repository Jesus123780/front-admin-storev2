import {
  gql,
  useQuery
} from '@apollo/client'
import { useParams, usePathname } from 'next/navigation'
import {
  getSession,
  isTokenExpired,
  useLogout
} from 'npm-pkg-hook'
import React, { Fragment, useEffect } from 'react'

import { isLoggedVar } from './helpers/is-logged-var'
// import { UPDATE_TOKEN } from './queries'

interface AuthProps {
  readonly children: React.ReactNode
}

export default function Auth({ children }: AuthProps) {
  // STATE
  const pathname = usePathname()
  const params = useParams()
  const { onClickLogout } = useLogout({})

  // QUERIES
  // const [updateToken, { data, called }] = useMutation(UPDATE_TOKEN)

  // Actualiza el auth token del usuario por cada cambio de ventana
  const QUERY_DATA_LOGGING = gql`
    query IsUserLoggedIn {
      isLogged @client
    }
  `
  const { data: dataLogged } = useQuery(QUERY_DATA_LOGGING)

  // Verifica el token
  // useEffect(() => {
  //   const token = Cookies.get('session')
  //   const onVeryToken = async () => {
  //     const isExpired = isTokenExpired(token)
  //     if (isExpired) {
  //       await signOutAuth({
  //         redirect: true,
  //         callbackUrl: ROUTES.index,
  //         reload: true
  //       })
  //     }
  //   }
  //   if (token) { onVeryToken() }
  //   updateToken({
  //     variables: {
  //       id: token,
  //       token: token
  //     }
  //   }).catch(() => {
  //     return
  //   })
  // }, [])

  // Respuesta de la verificación del token
  useEffect(() => {

    const verifySession = async () => {
      try {
        const session = await getSession()
        const isExpired = isTokenExpired(session?.token)

        if (session?.isSession) {
          isLoggedVar({
            state: false,
            expired: true,
            message: 'La sesión ha expirado',
            code: 403
          })
          if (isExpired) {
            onClickLogout?.()
          }
          return
        }

        // if (!called || !data?.refreshUserPayrollToken) { return }

        // const isValid = Boolean(data.refreshUserPayrollToken.restaurant)

        isLoggedVar({
          state: true,
          expired: false,
          message: 'Sesión activa',
          code: 200
        })
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
