import React, { useState, useEffect } from 'react'
import { Home } from './pages/Home'
import { Lobby } from './pages/Lobby'
import { Room } from './pages/Room'
import { Game } from './pages/Game'
import { useSocket } from './hooks/useSocket'
import type { Room as RoomType } from '@shared/types/game'

type AppState = 'home' | 'lobby' | 'room' | 'game'

function App() {
  const { socket, isConnected } = useSocket()
  const [state, setState] = useState<AppState>('home')
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState<RoomType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!socket) return

    socket.on('room:update', (updatedRoom: RoomType) => {
      setRoom(updatedRoom)
    })

    socket.on('game:start', () => {
      setState('game')
    })

    return () => {
      socket.off('room:update')
      socket.off('game:start')
    }
  }, [socket])

  const handleJoinGame = (name: string) => {
    setUsername(name)
    setState('lobby')
  }

  const handleCreateRoom = () => {
    if (!socket) return

    socket.emit('room:create', { username }, (response: any) => {
      if (response.success) {
        setRoom(response.room)
        setState('room')
        setError(null)
      } else {
        setError(response.error)
      }
    })
  }

  const handleJoinRoom = (roomId: string) => {
    if (!socket) return

    socket.emit('room:join', { roomId, username }, (response: any) => {
      if (response.success) {
        setRoom(response.room)
        setState('room')
        setError(null)
      } else {
        setError(response.error)
        alert(`❌ ${response.error}`)
      }
    })
  }

  const handleReady = () => {
    if (!socket || !room) return
    socket.emit('room:ready', { roomId: room.id })
  }

  const handleStart = () => {
    if (!socket || !room) return

    socket.emit('room:start', { roomId: room.id }, (response: any) => {
      if (!response.success) {
        alert(`❌ ${response.error}`)
      }
    })
  }

  if (state === 'home') {
    return <Home onJoinGame={handleJoinGame} />
  }

  if (state === 'lobby') {
    return (
      <Lobby
        username={username}
        isConnected={isConnected}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    )
  }

  if (state === 'room' && room) {
    return (
      <Room
        room={room}
        currentPlayerId={socket?.id || ''}
        onReady={handleReady}
        onStart={handleStart}
      />
    )
  }

  if (state === 'game' && room && socket?.id) {
    return (
      <Game
        socket={socket}
        roomId={room.id}
        currentPlayerId={socket.id}
      />
    )
  }

  return null
}

export default App
