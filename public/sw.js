/*
 * Web Push Service Worker para Next.js.
 * Ubicación: public/sw.js
 */

// Diagnóstico de ciclo de vida: ayuda a confirmar que el SW se instala/activa.
self.addEventListener('install', () => {
  console.log('[sw] install')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[sw] activate')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  console.log('[sw] push recibido. hasData=', Boolean(event.data))
  event.waitUntil((async () => {
    let payload = {}

    // Leer el contenido enviado por el backend.
    if (event.data) {
      try {
        payload = event.data.json() || {}
      } catch {
        payload = {
          body: event.data.text()
        }
      }
    }

    const title =
      typeof payload.title === 'string' && payload.title.trim()
        ? payload.title.trim()
        : 'Notificación'

    const body =
      typeof payload.body === 'string'
        ? payload.body
        : typeof payload.description === 'string'
          ? payload.description
          : ''

    const options = {
      body,
      icon: safeAssetPath(
        payload.icon,
        '/icons/icon-192x192.png'
      ),
      badge: safeAssetPath(
        payload.badge,
        '/icons/badge-72x72.png'
      ),
      // Un tag fijo hace que Chrome (especialmente en macOS) reemplace la
      // notificación existente en silencio en lugar de mostrar un banner nuevo.
      // Por eso, si no llega un tag explícito, generamos uno único por envío.
      tag:
        typeof payload.tag === 'string' && payload.tag.trim()
          ? payload.tag.trim()
          : `app-notification-${Date.now()}`,
      // renotify sólo es válido cuando hay tag; fuerza una nueva alerta aunque
      // se reutilice el mismo tag.
      renotify: true,
      data: {
        url: safeInternalPath(payload.url)
      }
    }

    // Imagen opcional de la notificación.
    if (
      typeof payload.image === 'string' &&
      payload.image.startsWith('/')
    ) {
      options.image = safeAssetPath(
        payload.image,
        '/icons/icon-192x192.png'
      )
    }

    // Mostrar la notificación.
    try {
      console.log('[sw] showNotification =>', title, options)
      await self.registration.showNotification(title, options)
      console.log('[sw] showNotification OK')
    } catch (err) {
      console.error('[sw] showNotification FALLÓ:', err)
    }
  })())
})

/**
 * Gestiona el clic sobre una notificación.
 * Si la aplicación está abierta, intenta enfocarla y navegar.
 * Si está cerrada, abre una ventana nueva.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = new URL(
    safeInternalPath(event.notification?.data?.url),
    self.location.origin
  )

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    for (const client of windowClients) {
      if (!('focus' in client)) {
        continue
      }

      try {
        if (
          'navigate' in client &&
          client.url !== targetUrl.href
        ) {
          await client.navigate(targetUrl.href)
        }

        await client.focus()
        return
      } catch {
        // Si no es posible reutilizar esta ventana,
        // se intentará abrir una nueva.
      }
    }

    await self.clients.openWindow(targetUrl.href)
  })())
})

/**
 * Solo permite rutas internas de la aplicación.
 * Previene redirecciones a dominios externos.
 */
function safeInternalPath(value) {
  if (typeof value !== 'string') {
    return '/'
  }

  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/'
  }

  return value
}

/**
 * Valida las rutas de los recursos de la notificación.
 */
function safeAssetPath(value, fallback) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return fallback
  }

  return value
}