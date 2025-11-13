import { Server, Socket } from 'socket.io'

export function handleConnection(io: Server, socket: Socket) {
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() })
  })
}
