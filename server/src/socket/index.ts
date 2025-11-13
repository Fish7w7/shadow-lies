import { Server } from 'socket.io'
import { handleConnection } from './handlers/connection.js'
import { handleRoom } from './handlers/room.js'
import { handleGame } from './handlers/game.js'

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`)
    
    handleConnection(io, socket)
    handleRoom(io, socket)
    handleGame(io, socket)
    
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`)
    })
  })
}
