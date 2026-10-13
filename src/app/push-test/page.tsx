'use client'

import { usePushNotifications } from 'npm-pkg-hook'
import React from 'react'

/**
 * Contenido mínimo de notificación aceptado por el hook. Se define localmente
 * porque el paquete npm-pkg-hook se publica sin archivos de tipos (.d.ts).
 */
interface NotificationInfo {
  title?: string
  description?: string
  body?: string
  url?: string
}

/** Porción de la API del hook consumida por esta página de prueba. */
interface PushNotificationsApi {
  userConsent: NotificationPermission | undefined
  pushNotificationSupported: boolean
  userSubscription: PushSubscription | null
  pushServerSubscriptionId: string | undefined
  isSubscribed: boolean
  loading: boolean
  error: Error | null
  onClickEnablePushNotifications: () => Promise<void>
  onClickSendNotification: (notification?: NotificationInfo) => Promise<void>
  onClickShowLocalNotification: (notification?: NotificationInfo) => Promise<void>
}

/**
 * Página de prueba manual para el flujo de Web Push.
 *
 * No es una feature de negocio: es una herramienta para validar en el navegador
 * el flujo completo (permiso -> service worker -> suscripción -> backend -> push).
 * Debe ejecutarse desde una interacción del usuario (click), nunca automáticamente,
 * porque los navegadores exigen un gesto del usuario para pedir permisos.
 *
 * Ruta: /push-test
 */
const PushTestPage = (): React.ReactElement => {
  const {
    userConsent,
    pushNotificationSupported,
    userSubscription,
    pushServerSubscriptionId,
    isSubscribed,
    loading,
    error,
    onClickEnablePushNotifications,
    onClickSendNotification,
    onClickShowLocalNotification
  } = usePushNotifications() as PushNotificationsApi

  const endpoint = userSubscription?.endpoint ?? '—'
  const errorMessage = error instanceof Error ? error.message : null

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Prueba de notificaciones push</h1>

      <section style={{ display: 'grid', gap: 8, marginBottom: 24, fontSize: 14 }}>
        <div><strong>Soportado:</strong> {String(pushNotificationSupported)}</div>
        <div><strong>Permiso:</strong> {userConsent ?? 'desconocido'}</div>
        <div><strong>Suscrito en servidor:</strong> {String(isSubscribed)}</div>
        <div><strong>ID de suscripción:</strong> {pushServerSubscriptionId ?? '—'}</div>
        <div style={{ wordBreak: 'break-all' }}><strong>Endpoint del navegador:</strong> {endpoint}</div>
        <div><strong>Cargando:</strong> {String(loading)}</div>
        {errorMessage ? <div style={{ color: '#b91c1c' }}><strong>Error:</strong> {errorMessage}</div> : null}
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <button
          type='button'
          disabled={loading}
          onClick={() => { void onClickEnablePushNotifications() }}
        >
          1. Activar notificaciones
        </button>

        <button
          type='button'
          disabled={loading || !isSubscribed}
          onClick={() => { void onClickSendNotification({
            title: 'Notificación de prueba',
            description: 'El flujo push funciona de extremo a extremo.',
            url: '/'
          }) }}
        >
          2. Enviar push desde el servidor
        </button>

        <button
          type='button'
          disabled={loading || userConsent !== 'granted'}
          onClick={() => { void onClickShowLocalNotification({
            title: 'Notificación local',
            description: 'Esta no pasa por el servidor; valida permisos del SO.'
          }) }}
        >
          Mostrar notificación local
        </button>
      </section>
    </main>
  )
}

export default PushTestPage
