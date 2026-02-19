'use client'

import { useLocalBackendIp } from 'npm-pkg-hook'
import {
  ImageQRCode,
  Row
} from 'pkg-components'
import React from 'react'

import styles from '../styles.module.css'

export const QrCode = () => {
  const { urlBackend } = useLocalBackendIp()

  return (
    <Row style={{ width: '100%', height: '100%' }}>
      <div className={styles.main}>
          <div className={styles.qrCard}>
            <ImageQRCode value={urlBackend} size={256} />
          </div>
      </div>
    </Row>
  )
}
