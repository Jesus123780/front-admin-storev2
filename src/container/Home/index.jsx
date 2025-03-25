"use client"; 
import { HomeMain } from 'pkg-components'
import {
  Container
} from './styled'
import { useRouter } from 'next/navigation'
import { useMobile } from 'npm-pkg-hook'
import React from 'react'

export const Home = () => {
  const router = useRouter()
  const { isMobile } = useMobile()


  const handleLogin = () => {
    router.push('/entrar')
  }
  const handleRegister = () => {
    router.push('/register')
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
