import React from 'react'
import { Restaurant } from '@/container/merchant/index'
import { cookies } from 'next/headers'
import { decodeToken } from '@/utils'
import { redirect } from 'next/navigation'

const RestaurantPage = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')
  if (!token?.value) {
    redirect('/login')
  }
  const userToken = decodeToken(token.value)
  return (
    <Restaurant userToken={userToken} />
  )
}

export default RestaurantPage