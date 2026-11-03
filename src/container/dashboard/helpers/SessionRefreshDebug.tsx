'use client'

import { gql, useApolloClient } from '@apollo/client'
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import {
  forceExpiredAccessToken,
  getAccessToken,
  refreshSession
} from '../../../../apollo/helpers/session-token'

/**
 * 🧪 Debug-only panel to observe the access-token refresh flow in real time.
 *
 * - "Forzar token expirado" installs an already-expired access token and fires
 *   a real GraphQL query. The backend answers SESSION_EXPIRED, the Apollo
 *   errorLink refreshes the token (using the HttpOnly refresh cookie) and
 *   retries the operation transparently.
 * - "Refrescar ahora" calls refreshSession() directly (proactive path).
 *
 * This component is intentionally rendered only in development.
 */

/** Lightweight authenticated query used to trigger the auth flow. */
const PING_QUERY = gql`
  query SessionRefreshDebugPing($id: ID, $idStore: ID) {
    getStore(id: $id, idStore: $idStore) {
      id
      idStore
      storeName
    }
  }
`

interface LogEntry {
  at: string
  message: string
  tone: 'info' | 'ok' | 'warn' | 'err'
}

/** Returns the `exp` (seconds) encoded in a JWT, or null. */
const readExp = (token: string | null): number | null => {
  if (!token) { return null }
  try {
    const [, payload] = token.split('.')
    if (!payload) { return null }
    const json = JSON.parse(
      globalThis.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    )
    return typeof json?.exp === 'number' ? json.exp : null
  } catch {
    return null
  }
}

/** Short identifier for a token so we can see it change after a refresh. */
const tokenTail = (token: string | null): string =>
  token ? `…${token.slice(-10)}` : '—'

export const SessionRefreshDebug = () => {
  const client = useApolloClient()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [busy, setBusy] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<string>('')
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const push = useCallback((message: string, tone: LogEntry['tone'] = 'info') => {
    setLogs((prev) => [
      { at: new Date().toLocaleTimeString(), message, tone },
      ...prev
    ].slice(0, 30))
  }, [])

  /** Refreshes the on-screen token status (tail + seconds to expiry). */
  const refreshStatus = useCallback(() => {
    const token = getAccessToken()
    const exp = readExp(token)
    if (!token) {
      setTokenInfo('Sin token')
      return
    }
    if (exp === null) {
      setTokenInfo(`${tokenTail(token)} · exp desconocido`)
      return
    }
    const secs = exp - Math.floor(Date.now() / 1000)
    setTokenInfo(
      secs <= 0
        ? `${tokenTail(token)} · EXPIRADO (${secs}s)`
        : `${tokenTail(token)} · expira en ${secs}s`
    )
  }, [])

  useEffect(() => {
    refreshStatus()
    tickRef.current = setInterval(refreshStatus, 1000)
    return () => {
      if (tickRef.current) { clearInterval(tickRef.current) }
    }
  }, [refreshStatus])

  /**
   * Forces an expired access token and fires a real query to watch the
   * reactive refresh + retry happen end to end.
   */
  const handleForceExpired = useCallback(async () => {
    setBusy(true)
    try {
      const before = getAccessToken()
      push(`Token actual: ${tokenTail(before)}`, 'info')

      const expired = forceExpiredAccessToken()
      push(`Instalado token EXPIRADO: ${tokenTail(expired)}`, 'warn')
      refreshStatus()

      push('Ejecutando query autenticada (getStore)…', 'info')
      await client.query({
        query: PING_QUERY,
        fetchPolicy: 'network-only',
        variables: {}
      })

      const after = getAccessToken()
      if (after && after !== expired) {
        push(`✅ Refrescado y reintentado. Nuevo token: ${tokenTail(after)}`, 'ok')
      } else {
        push('⚠️ La query terminó pero el token no cambió. Revisa la cookie rt / backend.', 'warn')
      }
      refreshStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      push(`❌ Error: ${message}`, 'err')
      refreshStatus()
    } finally {
      setBusy(false)
    }
  }, [client, push, refreshStatus])

  /**
   * Installs an expired access token WITHOUT firing any query, so you can
   * reload the page manually and observe the app bootstrap flow
   * (verifySession -> refreshSession -> recover or end session).
   */
  const handleSetExpiredOnly = useCallback(() => {
    const expired = forceExpiredAccessToken()
    push(`Token EXPIRADO instalado (sin query): ${tokenTail(expired)}`, 'warn')
    push('Ahora recarga la página (F5) para ver el flujo de arranque.', 'info')
    refreshStatus()
  }, [push, refreshStatus])

  /** Calls the proactive refresh path directly. */
  const handleRefreshNow = useCallback(async () => {
    setBusy(true)
    try {
      const before = getAccessToken()
      push(`Refresh manual. Token previo: ${tokenTail(before)}`, 'info')
      const newToken = await refreshSession()
      if (newToken) {
        push(`✅ Refresh OK. Nuevo token: ${tokenTail(newToken)}`, 'ok')
      } else {
        push('❌ Refresh falló (refresh token inválido/expirado/revocado).', 'err')
      }
      refreshStatus()
    } finally {
      setBusy(false)
    }
  }, [push, refreshStatus])

  const toneColor: Record<LogEntry['tone'], string> = {
    info: '#555',
    ok: '#1E8E3E',
    warn: '#B26A00',
    err: '#C5221F'
  }

  return (
    <div
      style={{
        border: '1px dashed #B26A00',
        borderRadius: 8,
        padding: 12,
        margin: '12px 0',
        background: '#FFF8E1',
        fontFamily: 'monospace',
        fontSize: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <strong>🧪 Session Refresh Debug</strong>
        <span style={{ color: '#555' }}>Access token: {tokenInfo}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleForceExpired}
          disabled={busy}
          style={{
            padding: '6px 10px',
            cursor: busy ? 'not-allowed' : 'pointer',
            background: '#C5221F',
            color: '#fff',
            border: 'none',
            borderRadius: 6
          }}
        >
          Forzar token expirado + query
        </button>
        <button
          type="button"
          onClick={handleSetExpiredOnly}
          disabled={busy}
          style={{
            padding: '6px 10px',
            cursor: busy ? 'not-allowed' : 'pointer',
            background: '#B26A00',
            color: '#fff',
            border: 'none',
            borderRadius: 6
          }}
        >
          Solo expirar token (recarga tú)
        </button>
        <button
          type="button"
          onClick={handleRefreshNow}
          disabled={busy}
          style={{
            padding: '6px 10px',
            cursor: busy ? 'not-allowed' : 'pointer',
            background: '#1A73E8',
            color: '#fff',
            border: 'none',
            borderRadius: 6
          }}
        >
          Refrescar ahora
        </button>
        <button
          type="button"
          onClick={() => setLogs([])}
          disabled={busy}
          style={{
            padding: '6px 10px',
            cursor: 'pointer',
            background: '#eee',
            border: '1px solid #ccc',
            borderRadius: 6
          }}
        >
          Limpiar log
        </button>
      </div>

      <div style={{ marginTop: 8, maxHeight: 180, overflowY: 'auto' }}>
        {logs.length === 0
          ? <div style={{ color: '#999' }}>Sin eventos todavía.</div>
          : logs.map((entry, index) => (
            <div key={`${entry.at}-${index}`} style={{ color: toneColor[entry.tone] }}>
              [{entry.at}] {entry.message}
            </div>
          ))}
      </div>
    </div>
  )
}
