import React, { useState, useEffect, useRef } from 'react'
import type { GameState, PlayerRole, ChatMessage } from '@shared/types/game'

interface GameProps {
  socket: any
  roomId: string
  currentPlayerId: string
}

export function Game({ socket, roomId, currentPlayerId }: GameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<PlayerRole[]>([])
  const [myRole, setMyRole] = useState<PlayerRole | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!socket) return

    socket.on('game:state', (state: GameState) => {
      setGameState(state)
    })

    socket.on('game:players', (playersList: PlayerRole[]) => {
      setPlayers(playersList)
      const me = playersList.find(p => p.id === currentPlayerId)
      if (me) setMyRole(me)
    })

    socket.on('game:role', (role: PlayerRole) => {
      setMyRole(role)
    })

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
    })

    socket.on('game:event', (event: { type: string, data: any }) => {
      const systemMsg: ChatMessage = {
        id: Date.now().toString(),
        playerId: 'system',
        username: 'Sistema',
        message: formatGameEvent(event),
        timestamp: Date.now(),
        type: 'system'
      }
      setMessages(prev => [...prev, systemMsg])
    })

    return () => {
      socket.off('game:state')
      socket.off('game:players')
      socket.off('game:role')
      socket.off('chat:message')
      socket.off('game:event')
    }
  }, [socket, currentPlayerId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatGameEvent = (event: { type: string, data: any }) => {
    switch (event.type) {
      case 'night_start':
        return '🌙 A noite caiu... As sombras se movem.'
      case 'day_start':
        return '☀️ O dia amanheceu!'
      case 'player_died':
        return `💀 ${event.data.username} foi eliminado(a)!`
      case 'voting_start':
        return '🗳️ Votação iniciada! Escolha quem eliminar.'
      default:
        return event.data.message || ''
    }
  }

  const handleAction = () => {
    if (!selectedTarget || !myRole?.canAct) return
    socket.emit('game:action', { roomId, targetId: selectedTarget })
    setSelectedTarget(null)
  }

  const handleVote = (targetId: string) => {
    socket.emit('game:vote', { roomId, targetId })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return
    socket.emit('chat:send', { roomId, message: messageInput.trim() })
    setMessageInput('')
  }

  if (!gameState || !myRole) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando jogo...</div>
      </div>
    )
  }

  const alivePlayers = players.filter(p => p.isAlive)
  const deadPlayers = players.filter(p => !p.isAlive)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto py-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-4 mb-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {gameState.phase === 'night' && '🌙 Noite'}
                {gameState.phase === 'day' && '☀️ Dia'}
                {gameState.phase === 'voting' && '🗳️ Votação'}
              </h1>
              <p className="text-gray-400">Rodada {gameState.round}</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">
                {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-sm text-gray-400">Tempo restante</p>
            </div>

            <div className="text-right">
              <div className="text-lg font-semibold text-white">
                Seu papel: {getRoleName(myRole.role)}
              </div>
              <div className="text-2xl">{getRoleEmoji(myRole.role)}</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-4 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-3">
                Jogadores Vivos ({alivePlayers.length})
              </h2>
              <div className="space-y-2">
                {alivePlayers.map(player => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTarget === player.id
                        ? 'bg-purple-900/50 border-purple-500'
                        : player.id === currentPlayerId
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => player.id !== currentPlayerId && setSelectedTarget(player.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👤</span>
                        <span className="text-white font-medium">
                          {player.username}
                          {player.id === currentPlayerId && (
                            <span className="text-purple-400 ml-1">(você)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {gameState.phase === 'night' && myRole.canAct && (
              <div className="bg-gray-800 rounded-lg shadow-2xl p-4 border border-purple-500">
                <h2 className="text-xl font-bold text-white mb-3">Sua Ação</h2>
                <p className="text-gray-400 mb-3 text-sm">
                  {getRoleActionDescription(myRole.role)}
                </p>
                <button
                  onClick={handleAction}
                  disabled={!selectedTarget}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {getActionButtonText(myRole.role)}
                </button>
              </div>
            )}

            {gameState.phase === 'voting' && (
              <div className="bg-gray-800 rounded-lg shadow-2xl p-4 border border-red-500">
                <h2 className="text-xl font-bold text-white mb-3">Votação</h2>
                <button
                  onClick={() => selectedTarget && handleVote(selectedTarget)}
                  disabled={!selectedTarget || !!gameState.votes[currentPlayerId]}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {gameState.votes[currentPlayerId] ? 'Voto Confirmado' : 'Votar'}
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 h-[calc(100vh-180px)] flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">💬 Chat</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.type === 'system'
                        ? 'bg-blue-900/30 border border-blue-500'
                        : 'bg-gray-700 border border-gray-600'
                    }`}
                  >
                    {msg.type !== 'system' && (
                      <div className="text-xs text-gray-400 mb-1">
                        {msg.username}
                      </div>
                    )}
                    <div className="text-white">{msg.message}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {gameState.phase === 'day' && myRole.isAlive && (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <button type="submit" className="px-6 py-3 bg-purple-600 text-white rounded-lg">
                      Enviar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getRoleName(role: string): string {
  const names: Record<string, string> = {
    citizen: 'Cidadão',
    detective: 'Detetive',
    doctor: 'Médico',
    mafia: 'Máfia',
    serial_killer: 'Serial Killer'
  }
  return names[role] || role
}

function getRoleEmoji(role: string): string {
  const emojis: Record<string, string> = {
    citizen: '👤',
    detective: '🕵️',
    doctor: '⚕️',
    mafia: '🔪',
    serial_killer: '💀'
  }
  return emojis[role] || '❓'
}

function getRoleActionDescription(role: string): string {
  const descriptions: Record<string, string> = {
    detective: 'Escolha alguém para investigar',
    doctor: 'Escolha alguém para salvar',
    mafia: 'Escolha alguém para eliminar',
    serial_killer: 'Escolha alguém para matar'
  }
  return descriptions[role] || ''
}

function getActionButtonText(role: string): string {
  const texts: Record<string, string> = {
    detective: 'Investigar',
    doctor: 'Salvar',
    mafia: 'Eliminar',
    serial_killer: 'Matar'
  }
  return texts[role] || 'Confirmar'
}
