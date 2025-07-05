// app/restaurant/page.tsx
import { Restaurant } from '@/container/merchant/index'
import { cookies } from 'next/headers'
import jwt, { decode } from 'jsonwebtoken'
import React from 'react'

/**
 * Decodes a JWT token.
 * @param {string} token - JWT token to decode.
 * @returns {object} Decoded payload or an empty object.
 */
export function decodeToken(token: string): Record<string, any> {
  try {
    return decode(token) as Record<string, any> || {}
  } catch (err) {
    console.error('Invalid token:', err)
    return {}
  }
}

export default function RestaurantPage() {
  const cookieStore = cookies()
  const session = cookieStore.get('session')

  const userToken = session?.value ? decodeToken(session.value) : {}

  return <Restaurant userToken={userToken} />
}
