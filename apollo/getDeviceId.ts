import { ClientJS } from 'clientjs'

export const getDeviceId = async () => {
  const client = new ClientJS()
  const fingerprint = String(client.getFingerprint())

  // Usar Web Crypto API para SHA-256 en el navegador
  const encoder = new TextEncoder()
  const data = encoder.encode(fingerprint)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}
