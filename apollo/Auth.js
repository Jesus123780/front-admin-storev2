import PropTypes from 'prop-types'
import React, { Fragment, useEffect } from 'react'
import { 
  gql, 
  useApolloClient, 
  useMutation, 
  useQuery
} from '@apollo/client'
import { useRouter } from 'next/navigation'
import { isLoggedVar } from './cache'
import { UPDATE_TOKEN } from './queries'
import { 
  Cookies, 
  useLogout, 
  getSession, 
  isTokenExpired,
  signOutAuth
} from 'npm-pkg-hook'
import { ROUTES } from 'pkg-components'

export default function Auth({ children }) {
  // STATE
  const { client } = useApolloClient()
  const location = useRouter()
  const [onClickLogout] = useLogout({})

  // QUERIES
  const [updateToken, { data, called, error }] = useMutation(UPDATE_TOKEN)

  // Actualiza el auth token del usuario por cada cambio de ventana
  const QUERY_DATA_LOGGING = gql`
    query IsUserLoggedIn {
      isLogged @client
    }
  `
  const { data: dataLogged } = useQuery(QUERY_DATA_LOGGING)

  // Verifica el token
  useEffect(() => {
    const token = Cookies.get('session')
    const onVeryToken = async () => {
      const isExpired = isTokenExpired(token)
      if (isExpired) {
        await onClickLogout({ redirect: true })
        await signOutAuth({
          redirect: true,
          callbackUrl: ROUTES.index,
          reload: true
        })
      }
    }
    if (token) onVeryToken()
    updateToken({
      variables: {
        id: token,
        token: token
      }
    }).catch(() => {
      return
    })
  }, [])
  // Respuesta de la verificación del token
  useEffect(() => {
    const fetchData = async () => {
      const { isSession } = await getSession()
      if (!isSession) {
        onClickLogout()
      }
    }
    // fetchData()
    const res = data?.refreshUserPayrollToken
    if (called && res) {
      if (res.restaurant) {
        isLoggedVar({ state: true, expired: false })
      } else {
        isLoggedVar({
          state: false,
          expired: true,
          message: 'La sesión ha expirado',
          code: 403
        })
      }
    }
  }, [data, called, client, location])

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
Auth.propTypes = {
  children: PropTypes.any
}
