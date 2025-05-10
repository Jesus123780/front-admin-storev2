import {
  Column,
  ImageQRCode,
  Row,
  Text
} from 'pkg-components'
import React from 'react'
import { useLocalBackendIp } from 'npm-pkg-hook'
import styles from '../styles.module.css'

export const QrCode = () => {
  const { urlBackend } = useLocalBackendIp()

  return (
    <Row style={{ width: '100%', height: '100%' }}>
      <div className={styles.main}>
        <Column style={{ width: '100%', height: '100%', alignItems: 'center' }}>
          <Text size='lg' weight='normal'>
            Escanea o comparte este <strong>código QR</strong> con tu celular para iniciar sesión:
          </Text>
          <div className={styles.qrCard}>
            <ImageQRCode value={urlBackend} size={256} />
          </div>
        </Column>
      </div>
    </Row>
  )
}
