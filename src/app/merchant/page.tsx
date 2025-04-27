import React from 'react'
import { Restaurant } from '@/container/merchant/index'
import { cookies } from 'next/headers'
import { decodeToken } from '@/utils'

const RestaurantPage = async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')
    const userToken = decodeToken(token?.value)
    console.log({userToken})
  return (
    <Restaurant userToken={userToken} />
  )
}

export default RestaurantPage