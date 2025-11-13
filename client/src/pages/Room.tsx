import React from 'react'
import type { Room as RoomType } from '@shared/types/game'

interface RoomProps {
  room: RoomType
  currentPlayerId: string
  onReady: () => void
  onStart: () => void
}

export function Room({ room, currentPlayerId, onReady, onStart }: RoomProps) {
  const currentPlayer = room.players.find(p => p.id === currentPlayerId)
  const isHost = currentPlayer?.isHost || false
  const readyCount = room.players.filter(p => p.isReady || p.isHost).length
  const canStart = readyCount >= 3

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Sala de Espera</h1>
              <p className="text-gray-400">Aguardando jogadores...</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-mono font-bold text-purple-400 mb-1">
                {room.id}
              </div>
              <p className="text-sm text-gray-400">Código da sala</p>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Jogadores ({room.players.length}/12)
          </h2>
          
          <div className="grid md:grid-cols-2 gap-3">
            {room.players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-lg border-2 ${
                  player.id === currentPlayerId
                    ? 'bg-purple-900/50 border-purple-500'
                    : 'bg-gray-700 border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {player.isHost ? '👑' : '👤'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {player.username}
                        {player.id === currentPlayerId && (
                          <span className="text-purple-400 ml-2">(você)</span>
                        )}
                      </p>
                      {player.isHost && (
                        <p className="text-xs text-gray-400">Host</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    {player.isReady || player.isHost ? (
                      <span className="text-green-400 font-semibold">✓ Pronto</span>
                    ) : (
                      <span className="text-gray-400">Aguardando</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-gray-700">
          <div className="flex gap-4">
            {!isHost && (
              <button
                onClick={onReady}
                className={`flex-1 py-4 px-6 font-semibold rounded-lg shadow-lg focus:outline-none focus:ring-2 transition-all ${
                  currentPlayer?.isReady
                    ? 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white focus:ring-green-500'
                }`}
              >
                {currentPlayer?.isReady ? '✓ Pronto' : 'Marcar como Pronto'}
              </button>
            )}
            
            {isHost && (
              <button
                onClick={onStart}
                disabled={!canStart}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {canStart
                  ? `🎮 Iniciar Partida (${readyCount}/${room.players.length})`
                  : `⏳ Aguardando jogadores (${readyCount}/3 mínimo)`
                }
              </button>
            )}
          </div>
          
          {isHost && !canStart && (
            <p className="mt-4 text-center text-sm text-gray-400">
              Mínimo de 3 jogadores prontos para iniciar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}