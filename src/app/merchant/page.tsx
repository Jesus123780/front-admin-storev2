// app/restaurant/page.tsx
import { Restaurant } from '@/container/merchant/index'
import { cookies } from 'next/headers'
import { decode } from 'jsonwebtoken'
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

export default async function RestaurantPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')

  const userToken = session?.value ? decodeToken(session.value) : {}

  return <Restaurant userToken={userToken} />
}
