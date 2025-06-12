'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button, Column, getGlobalStyle, Portal, ROUTES, Text } from 'pkg-components'

/**
 * Not Found Page - renders when route is not matched.
 * @returns {JSX.Element}
 */
const NotFound = () => {
  const router = useRouter()
  const pathname = usePathname()
  const handleRedirect = () => {
    try {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back()
      } else {
        router.push(ROUTES.dashboard)
      }
    } catch {
      router.push(ROUTES.dashboard)
    }
  }
  return (
    <Portal>
      <Column style={{
        position: 'absolute',
        zIndex: getGlobalStyle('--z-index-high'),
        height: '100vh',
        width: '100vw',
        padding: getGlobalStyle('--spacing-5xl'),
        backgroundColor: getGlobalStyle('--color-base-white'),
      }}>
        <Text
          as='h1'
          size='4xl'
          weight='bold'
        >
          404
          <Text color='primary' styles={{
            marginLeft: getGlobalStyle('--spacing-2xl'),
            marginRight: getGlobalStyle('--spacing-2xl'),
          }}>
            {pathname}
          </Text> 
          Page Not Found
        </Text>
        <Text as='p' size='xxl'>
          Esta página no existe o ha sido movida. Por favor, verifica la URL o vuelve a la página de inicio.
        </Text>
        <Button primary onClick={handleRedirect}>
          Volver a la página anterior
        </Button>
      </Column>
    </Portal>
  )
}

export default NotFound
