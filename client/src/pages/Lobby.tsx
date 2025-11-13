import React, { useState } from 'react'
import type { Room } from '@shared/types/game'

interface LobbyProps {
  username: string
  isConnected: boolean
  onCreateRoom: () => void
  onJoinRoom: (roomId: string) => void
}

export function Lobby({ username, isConnected, onCreateRoom, onJoinRoom }: LobbyProps) {
  const [roomId, setRoomId] = useState('')

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomId.trim().length === 6) {
      onJoinRoom(roomId.trim().toUpperCase())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Bem-vindo, <span className="text-purple-400">{username}</span>!
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-300">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Criar Sala */}
          <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🎲</div>
              <h2 className="text-2xl font-bold text-white mb-2">Criar Sala</h2>
              <p className="text-gray-400">Inicie uma nova partida</p>
            </div>
            
            <button
              onClick={onCreateRoom}
              disabled={!isConnected}
              className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Criar Nova Sala
            </button>
          </div>

          {/* Entrar em Sala */}
          <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🚪</div>
              <h2 className="text-2xl font-bold text-white mb-2">Entrar em Sala</h2>
              <p className="text-gray-400">Use o código da sala</p>
            </div>
            
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="EX: ABC123"
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
              />
              
              <button
                type="submit"
                disabled={!isConnected || roomId.length !== 6}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Entrar na Sala
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}