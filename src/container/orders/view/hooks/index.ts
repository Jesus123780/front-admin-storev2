'use client'

import {
 useEffect, 
 useRef, 
 useState 
} from 'react'

export function useDevServerStatus() {
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let ws: WebSocket | null = null
    let stopped = false

    const connect = async () => {
      try {
        const res = await fetch('/api/ws', { cache: 'no-store' })
        const data = await res.json()
        if (!data.port) {
          attemptReconnect()
          return
        }

        ws = new WebSocket(`ws://localhost:${data.port}`)
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
          if (reconnectRef.current) {clearTimeout(reconnectRef.current)}
        }

        ws.onclose = () => {
          if (!stopped) {
            setConnected(false)
            attemptReconnect()
          }
        }

        ws.onerror = () => {
          if (!stopped) {
            setConnected(false)
            attemptReconnect()
          }
        }

        ws.onmessage = evt => {
          try {
            const msg = JSON.parse(evt.data)
            if (msg.active) {setConnected(true)}
          } catch {
            setConnected(false)
            attemptReconnect()
          }
        }
      } catch {
        setConnected(false)
        attemptReconnect()
      }
    }

    const attemptReconnect = () => {
      if (reconnectRef.current) {return}
      reconnectRef.current = setTimeout(() => {
        reconnectRef.current = null
        connect()
      }, 2000)
    }

    connect()

    return () => {
      stopped = true
      ws?.close()
      if (reconnectRef.current) {clearTimeout(reconnectRef.current)}
    }
  }, [])

  return { connected }
}
