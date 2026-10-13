'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Button,
  Column,
  getGlobalStyle,
  Portal,
  ROUTES,
  Text
} from 'pkg-components'
import React, {
 useCallback, 
 useMemo, 
 useState
} from 'react'

interface NotFoundProps {
  /** Ruta interna opcional a la que se debe navegar al salir del 404. */
  redirectTo?: string
}

const normalizePath = (value: string): string => {
  const path = value.trim()
  if (!path) {return ROUTES.index}

  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`
  const withoutTrailingSlashes = withLeadingSlash.replace(/\/+$/, '')
  return withoutTrailingSlashes || ROUTES.index
}

/**
 * Solo acepta destinos internos. Evita pasar URLs externas o javascript: al router.
 */
const getSafeInternalPath = (value?: string): string | null => {
  if (typeof value !== 'string' || value.trim() === '') {return null}

  const path = value.trim()
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return null
  }

  return path
}

const NotFound: React.FC<NotFoundProps> = ({ redirectTo }) => {
  const router = useRouter()
  const pathname = usePathname() || ROUTES.index
  const [isNavigating, setIsNavigating] = useState(false)

  const currentPath = useMemo(() => normalizePath(pathname), [pathname])
  const safeRedirectTo = useMemo(
    () => getSafeInternalPath(redirectTo),
    [redirectTo]
  )

  // No asumimos que el dashboard tenga una forma concreta.
  // Si la URL solicitada no es / ni /login, intentamos regresar a la
  // página anterior, siempre que exista historial del navegador.
  const isRootOrLogin =
    currentPath === normalizePath(ROUTES.index) ||
    currentPath === normalizePath(ROUTES.login)

  const canGoBack = !isRootOrLogin &&
    typeof window !== 'undefined' &&
    window.history.length > 1

  const buttonLabel = safeRedirectTo
    ? 'Continuar'
    : canGoBack
      ? 'Volver a la página anterior'
      : 'Ir al inicio'

  const handleRedirect = useCallback(() => {
    if (isNavigating) {return}
    setIsNavigating(true)

    // Una ruta explícita y segura tiene prioridad, incluso si es "/".
    if (safeRedirectTo) {
      router.replace(safeRedirectTo)
      return
    }

    // Si estamos ante una ruta interna desconocida, vuelve a la página
    // anterior en vez de enviar automáticamente al usuario a "/".
    if (
      currentPath !== normalizePath(ROUTES.index) &&
      currentPath !== normalizePath(ROUTES.login) &&
      typeof window !== 'undefined' &&
      window.history.length > 1
    ) {
      router.back()
      return
    }

    // Fallback consistente cuando no hay una página previa útil.
    router.replace(ROUTES.home || ROUTES.index)
  }, [currentPath, isNavigating, router, safeRedirectTo])

  return (
    <Portal>
      <Column
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: getGlobalStyle('--z-index-high'),
          minHeight: '100vh',
          width: '100%',
          boxSizing: 'border-box',
          overflowY: 'auto',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: getGlobalStyle('--spacing-5xl'),
          backgroundColor: getGlobalStyle('--color-base-white')
        }}
      >
        <Text as='h1' size='4xl' weight='bold'>
          404
        </Text>

        <Text
          color='primary'
          size='xl'
          styles={{
            marginTop: getGlobalStyle('--spacing-md'),
            overflowWrap: 'anywhere'
          }}
        >
          {currentPath}
        </Text>

        <Text as='p' size='xxl'>
          No encontramos esta página. Puede que el enlace esté desactualizado
          o que la dirección se haya escrito incorrectamente.
        </Text>

        <Button primary onClick={handleRedirect} disabled={isNavigating}>
          {isNavigating ? 'Redirigiendo...' : buttonLabel}
        </Button>
      </Column>
    </Portal>
  )
}

export default NotFound
