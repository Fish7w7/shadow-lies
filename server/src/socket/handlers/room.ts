import { Server, Socket } from 'socket.io'
import { nanoid } from 'nanoid'
import type { Room, Player } from '../../../../shared/types/game.js'

const rooms = new Map<string, Room>()

export function handleRoom(io: Server, socket: Socket) {
  
  socket.on('room:create', (data: { username: string }, callback) => {
    const roomId = nanoid(6).toUpperCase()
    const player: Player = {
      id: socket.id,
      username: data.username,
      isHost: true,
      isReady: false
    }
    
    const room: Room = {
      id: roomId,
      host: socket.id,
      players: [player],
      state: 'waiting',
      createdAt: Date.now()
    }
    
    rooms.set(roomId, room)
    socket.join(roomId)
    
    callback({ success: true, roomId, room })
    console.log(`🏠 Room created: ${roomId} by ${data.username}`)
  })
  
  socket.on('room:join', (data: { roomId: string, username: string }, callback) => {
    const room = rooms.get(data.roomId)
    
    if (!room) {
      return callback({ success: false, error: 'Sala não encontrada' })
    }
    
    if (room.state !== 'waiting') {
      return callback({ success: false, error: 'Partida já iniciada' })
    }
    
    if (room.players.length >= 12) {
      return callback({ success: false, error: 'Sala cheia' })
    }
    
    const player: Player = {
      id: socket.id,
      username: data.username,
      isHost: false,
      isReady: false
    }
    
    room.players.push(player)
    socket.join(data.roomId)
    
    io.to(data.roomId).emit('room:update', room)
    callback({ success: true, room })
    
    console.log(`👤 ${data.username} joined room ${data.roomId}`)
  })
  
  socket.on('room:ready', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId)
    if (!room) return
    
    const player = room.players.find(p => p.id === socket.id)
    if (player) {
      player.isReady = !player.isReady
      io.to(data.roomId).emit('room:update', room)
    }
  })
  
  socket.on('room:start', (data: { roomId: string }, callback) => {
    const room = rooms.get(data.roomId)
    
    if (!room) {
      return callback({ success: false, error: 'Sala não encontrada' })
    }
    
    if (socket.id !== room.host) {
      return callback({ success: false, error: 'Apenas o host pode iniciar' })
    }
    
    const readyPlayers = room.players.filter(p => p.isReady || p.isHost)
    if (readyPlayers.length < 3) {
      return callback({ success: false, error: 'Mínimo 3 jogadores prontos' })
    }
    
    room.state = 'playing'
    
    // Inicializar o jogo
    socket.emit('game:initialize', {
      roomId: data.roomId,
      players: readyPlayers
    })
    
    io.to(data.roomId).emit('game:start', { roomId: data.roomId })
    callback({ success: true })
    
    console.log(`🎮 Game started in room ${data.roomId}`)
  })
  
  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id)
      
      if (playerIndex !== -1) {
        const player = room.players[playerIndex]
        room.players.splice(playerIndex, 1)
        
        if (room.players.length === 0) {
          rooms.delete(roomId)
          console.log(`🗑️  Room ${roomId} deleted (empty)`)
        } else {
          if (player.isHost && room.players.length > 0) {
            room.players[0].isHost = true
            room.host = room.players[0].id
          }
          io.to(roomId).emit('room:update', room)
        }
        
        console.log(`👋 ${player.username} left room ${roomId}`)
      }
    })
  })
}
