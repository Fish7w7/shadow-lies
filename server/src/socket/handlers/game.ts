import { Server, Socket } from 'socket.io'
import { GameManager } from '../../services/GameManager.js'

const gameManager = new GameManager()

export function handleGame(io: Server, socket: Socket) {
  
  socket.on('game:initialize', (data: { roomId: string, players: any[] }) => {
    const { gameState, players } = gameManager.startGame(data.roomId, data.players)

    io.to(data.roomId).emit('game:state', gameState)
    io.to(data.roomId).emit('game:players', players.map(p => ({
      id: p.id,
      username: p.username,
      isAlive: p.isAlive
    })))

    players.forEach(player => {
      io.to(player.id).emit('game:role', player)
    })

    io.to(data.roomId).emit('game:event', {
      type: 'night_start',
      data: { round: 1 }
    })

    const updateInterval = setInterval(() => {
      const game = gameManager.getGame(data.roomId)
      if (!game) {
        clearInterval(updateInterval)
        return
      }

      io.to(data.roomId).emit('game:state', game.state)
      io.to(data.roomId).emit('game:players', game.players.map(p => ({
        id: p.id,
        username: p.username,
        isAlive: p.isAlive
      })))

      if (game.state.timeLeft === 0) {
        if (game.state.phase === 'night') {
          io.to(data.roomId).emit('game:event', {
            type: 'day_start',
            data: {}
          })
          
          if (game.state.lastKilled) {
            io.to(data.roomId).emit('game:event', {
              type: 'player_died',
              data: { username: game.state.lastKilled }
            })
          }
        } else if (game.state.phase === 'day') {
          io.to(data.roomId).emit('game:event', {
            type: 'voting_start',
            data: {}
          })
        }
      }
    }, 1000)

    socket.on('disconnect', () => {
      clearInterval(updateInterval)
    })
  })

  socket.on('game:action', (data: { roomId: string, targetId: string }) => {
    const success = gameManager.performAction(data.roomId, socket.id, data.targetId)
    socket.emit('game:action_result', { success })
  })

  socket.on('game:vote', (data: { roomId: string, targetId: string }) => {
    const success = gameManager.vote(data.roomId, socket.id, data.targetId)
    if (success) {
      const game = gameManager.getGame(data.roomId)
      if (game) {
        io.to(data.roomId).emit('game:state', game.state)
      }
    }
  })

  socket.on('chat:send', (data: { roomId: string, message: string }) => {
    const msg = gameManager.sendMessage(data.roomId, socket.id, data.message)
    
    if (msg) {
      if (msg.type === 'mafia') {
        const game = gameManager.getGame(data.roomId)
        if (game) {
          const mafiaMembers = game.players.filter(p => p.role === 'mafia')
          mafiaMembers.forEach(m => {
            io.to(m.id).emit('chat:message', msg)
          })
        }
      } else {
        io.to(data.roomId).emit('chat:message', msg)
      }
    }
  })
}
