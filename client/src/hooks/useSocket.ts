import { useEffect, useState } from 'react'
import { socketService } from '../services/socket'
import type { Socket } from 'socket.io-client'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const s = socketService.connect()
    setSocket(s)

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)

    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
    }
  }, [])

  return { socket, isConnected }
}