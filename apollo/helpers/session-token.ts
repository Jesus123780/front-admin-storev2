'use client'

import { Cookies } from 'npm-pkg-hook'

/**
 * Centralized access-token + refresh coordination.
 *
 * Design:
 * - The access token is kept in memory (module-level) as the source of truth
 *   for the current tab, and mirrored into the `session` cookie so the existing
 *   `buildAuthHeaders` (and any other reader) keeps working unchanged.
 * - The refresh token lives ONLY in an HttpOnly cookie set by the backend; it
 *   is never read here. We call `POST /api/auth/refresh` with credentials so
 *   the browser attaches that cookie automatically.
 * - A single-flight promise guarantees that many concurrent GraphQL failures
 *   trigger exactly one network refresh.
 */

const SESSION_COOKIE = 'session'
const BACKEND_URL = (process.env.NEXT_PUBLIC_URL_BACK_SERVER ?? '').replace(/\/+$/, '')
const REFRESH_ENDPOINT = `${BACKEND_URL}/api/auth/refresh`

/**
 * Seconds before the access token's expiry at which we proactively refresh.
 * Refreshing a bit early avoids racing requests that would fail with
 * SESSION_EXPIRED.
 */
const PROACTIVE_SKEW_SECONDS = 60

/** In-memory access token for the current tab. */
let accessTokenInMemory: string | null = null

/** Single-flight guard: the in-flight refresh promise, if any. */
let inFlightRefresh: Promise<string | null> | null = null

interface RefreshResponse {
  success?: boolean
  code?: string
  data?: { token?: string }
}

/**
 * Returns the current access token, preferring the in-memory value and
 * falling back to the `session` cookie (e.g. right after a page reload before
 * any refresh has run).
 */
export const getAccessToken = (): string | null => {
  if (accessTokenInMemory) { return accessTokenInMemory }
  try {
    const fromCookie = Cookies.get(SESSION_COOKIE)
    if (fromCookie) {
      accessTokenInMemory = fromCookie
      return fromCookie
    }
  } catch {
    // ignore cookie read errors
  }
  return null
}

/**
 * Persists a freshly obtained access token in memory and mirrors it into the
 * `session` cookie so other readers (headers, getSession) stay consistent.
 *
 * @param token - New access token.
 */
export const setAccessToken = (token: string): void => {
  accessTokenInMemory = token
  try {
    // Mirror into the (non-HttpOnly) session cookie for compatibility with the
    // existing auth-header builder. Not security-sensitive: the refresh token
    // is the protected credential and stays HttpOnly server-side.
    Cookies.set(SESSION_COOKIE, token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    })
  } catch {
    // ignore cookie write errors; in-memory token still works for this tab
  }
}

/**
 * Clears the in-memory access token. Cookie cleanup is handled by the logout
 * flow (useLogout) which also hits the backend logout endpoint.
 */
export const clearAccessToken = (): void => {
  accessTokenInMemory = null
}

/**
 * Decodes a JWT payload without verifying the signature (client-side read of
 * the `exp` claim only).
 */
const decodeExp = (token: string): number | null => {
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

/**
 * Returns true when there is no access token, or when the current token is
 * within the proactive skew window of its expiry (or already expired).
 *
 * @returns Whether a proactive refresh should run.
 */
export const shouldProactivelyRefresh = (): boolean => {
  const token = getAccessToken()
  if (!token) { return false }
  const exp = decodeExp(token)
  if (exp === null) { return true }
  const nowSeconds = Math.floor(Date.now() / 1000)
  return exp - nowSeconds <= PROACTIVE_SKEW_SECONDS
}

/**
 * base64url-encodes a JSON object (no padding) for building fake JWTs.
 */
const base64Url = (obj: Record<string, unknown>): string =>
  globalThis
    .btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/**
 * 🧪 DEBUG ONLY — Forces the current access token to an already-expired JWT.
 *
 * Builds a well-formed JWT whose `exp` is in the past, preserving the current
 * token's payload (sub/email/name) when available. The signature is a
 * placeholder: the backend's expiry check (`getUserFromToken`) decodes and
 * detects the expired `exp` BEFORE verifying the signature, so this reliably
 * triggers a `SESSION_EXPIRED` and exercises the reactive refresh flow.
 *
 * Returns the fake expired token that was installed.
 */
export const forceExpiredAccessToken = (): string => {
  const current = getAccessToken()
  let basePayload: Record<string, unknown> = {}
  if (current) {
    try {
      const [, payload] = current.split('.')
      if (payload) {
        basePayload = JSON.parse(
          globalThis.atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        )
      }
    } catch {
      // ignore: fall back to a minimal payload
    }
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    ...basePayload,
    type: 'access',
    iat: nowSeconds - 120,
    // Expired two minutes ago.
    exp: nowSeconds - 60
  }

  const fakeToken = `${base64Url(header)}.${base64Url(payload)}.debug_expired_signature`
  setAccessToken(fakeToken)
  return fakeToken
}

/**
 * Attempts to refresh the session using the HttpOnly refresh cookie.
 *
 * Single-flight: concurrent callers share the same in-flight request. Returns
 * the new access token on success, or null on failure (expired/invalid/reused
 * refresh token), in which case the caller should end the session.
 *
 * @returns The new access token, or null if refresh failed.
 */
export const refreshSession = async (): Promise<string | null> => {
  if (globalThis.window === undefined) { return null }

  // Reuse the in-flight refresh if one is already running (single-flight).
  if (inFlightRefresh) { return inFlightRefresh }

  inFlightRefresh = (async () => {
    try {
      const response = await fetch(REFRESH_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) { return null }

      const body = (await response.json()) as RefreshResponse
      const newToken = body?.data?.token
      if (!body?.success || !newToken) { return null }

      setAccessToken(newToken)
      return newToken
    } catch {
      return null
    } finally {
      // Release the single-flight slot once settled.
      inFlightRefresh = null
    }
  })()

  return inFlightRefresh
}
