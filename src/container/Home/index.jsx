'use client'

import { useRouter } from 'next/navigation'
import { useMobile } from 'npm-pkg-hook'
import { HomeMain, ROUTES } from 'pkg-components'
import React from 'react'

import {
  Container
} from './styled'

export const Home = () => {
  const router = useRouter()
  const { isMobile } = useMobile()


  const handleLogin = () => {
    router.push(ROUTES.login)
  }
  const handleRegister = () => {
    router.push(ROUTES.register)
  }
  const headerProps = {
    handleLogin,
    handleRegister,
    isMobile
  }
  return (
    <Container>
      <HomeMain {...headerProps} />
    </Container>
  )
}
