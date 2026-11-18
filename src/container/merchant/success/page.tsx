
'use client'

import { useApolloClient } from '@apollo/client'
import { useLogout } from 'npm-pkg-hook'
import {
  Icon,
  RippleButton,
  ROUTES,
  Text
} from 'pkg-components'
import { useState } from 'react'

import styles from './page.module.css'

export default function RegisterSuccessContainer() {
  const client = useApolloClient()
  const { onClickLogout } = useLogout({})

  const [isLeaving, setIsLeaving] = useState(false)
  const [error, setError] = useState('')

  const handleGoToLogin = async () => {
    if (isLeaving) { return }

    setIsLeaving(true)
    setError('')

    try {
      // Limpia cookies del cliente y revoca refresh tokens.
      // Sin redirección automática.
      await onClickLogout({ redirect: false })

      // Limpia las cookies gestionadas por Next.js.
      const response = await fetch('/api/auth/signout/', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error('Error al finalizar la sesión')
      }

      // Evita conservar información del usuario anterior.
      await client.clearStore()

      // Navegación completa para iniciar con estado limpio.
      window.location.replace(ROUTES.login)
    } catch {
      setError(
        'No pudimos finalizar tu sesión. Inténtalo nuevamente.'
      )
      setIsLeaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <section
        className={styles.card}
        aria-labelledby='registration-success-title'
      >
        <div className={styles.successVisual} aria-hidden='true'>
          <div className={styles.successRing}>
            <Icon
              icon='IconSuccess'
              size={58}
              color='var(--color-feedback-success-light)'
            />
          </div>
        </div>

        <Text as='p' className={styles.eyebrow}>
          REGISTRO COMPLETADO
        </Text>

        <Text
          as='h1'
          id='registration-success-title'
          className={styles.title}
          font='bold'
          customSize='clamp(1.75rem, 5vw, 3rem)'
          lineHeight='snug'
        >
          ¡Todo está listo!
        </Text>

        <Text
          as='p'
          color='gray-dark'
          className={styles.description}
          lineHeight='relaxed'
        >
          Tu usuario y tu comercio se crearon correctamente.
          ¡Bienvenido a Venty!
        </Text>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.itemIcon} aria-hidden='true'>
              <Icon
                icon='IconSuccess'
                size={19}
                color='var(--color-feedback-success-light)'
              />
            </span>
            <Text as='span' className={styles.itemLabel}>
              Cuenta de usuario creada
            </Text>
          </div>

          <div className={styles.summaryItem}>
            <span className={styles.itemIcon} aria-hidden='true'>
              <Icon
                icon='IconSuccess'
                size={19}
                color='var(--color-feedback-success-light)'
              />
            </span>
            <Text as='span' className={styles.itemLabel}>
              Comercio registrado exitosamente
            </Text>
          </div>
        </div>

        <Text
          as='p'
          className={styles.instructions}
          color='gray-dark'
          lineHeight='relaxed'
        >
          Para comenzar, inicia sesión con el correo electrónico
          y la contraseña que registraste.
        </Text>

        <div className={styles.actions}>
          <RippleButton
            type='button'
            className={styles.loginButton}
            onClick={handleGoToLogin}
            disabled={isLeaving}
            loading={isLeaving}
            loadingLabel='Finalizando sesión…'
            bgColor='var(--color-background-primary)'
            color='var(--color-text-white)'
            radius='var(--border-radius-full)'
            padding='var(--spacing-xl) var(--spacing-2xl)'
            height='56px'
            fullWidth
          >
            <span className={styles.buttonContent}>
              Iniciar sesión

              <Icon
                icon='IconArrowRight'
                size={20}
                color='var(--color-icons-white)'
              />
            </span>
          </RippleButton>

          {error && (
            <Text
              as='p'
              className={styles.error}
              role='alert'
            >
              {error}
            </Text>
          )}
        </div>
      </section>
    </main>
  )
}
