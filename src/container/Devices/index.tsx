'use client'

import React, { useEffect, useState } from 'react'
import { Devices as DevicesComponents } from 'pkg-components'
import { useDevices } from 'npm-pkg-hook'
import { getDeviceId } from '../../../apollo/getDeviceId'

export const Devices = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDeviceId = async () => {
      try {
        const id = await getDeviceId()
        if (id) {
          setDeviceId(id)
        }
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }

    fetchDeviceId()
  }, [])

  // Pass the deviceId to useDevices hook once it is loaded
  const { data, loading: dataLoading } = useDevices({
    currentDevice: deviceId
  })

  return (
    <DevicesComponents
      data={data || []}
      deviceId={deviceId ?? ''}
      loading={loading || dataLoading}
    />
  )
}
