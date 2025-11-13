import { nanoid } from 'nanoid'
import type { GameState, PlayerRole, Role, ChatMessage } from '../../../shared/types/game.js'

interface GameRoom {
  id: string
  state: GameState
  players: PlayerRole[]
  timer: NodeJS.Timeout | null
  actions: Map<string, string>
  mafiaChat: ChatMessage[]
  publicChat: ChatMessage[]
}

export class GameManager {
  private games = new Map<string, GameRoom>()

  startGame(roomId: string, players: any[]) {
    const roles = this.distributeRoles(players.length)
    const gamePlayers: PlayerRole[] = players.map((p, index) => ({
      ...p,
      role: roles[index],
      isAlive: true,
      canAct: true
    }))

    const gameState: GameState = {
      roomId,
      phase: 'night',
      round: 1,
      timeLeft: 60,
      votes: {}
    }

    const game: GameRoom = {
      id: roomId,
      state: gameState,
      players: gamePlayers,
      timer: null,
      actions: new Map(),
      mafiaChat: [],
      publicChat: []
    }

    this.games.set(roomId, game)
    this.startPhaseTimer(roomId)

    return { gameState, players: gamePlayers }
  }

  private distributeRoles(playerCount: number): Role[] {
    const roles: Role[] = []
    
    if (playerCount >= 5) {
      roles.push('mafia', 'mafia')
      roles.push('detective')
      roles.push('doctor')
      while (roles.length < playerCount) {
        roles.push('citizen')
      }
    } else {
      roles.push('mafia')
      roles.push('detective')
      while (roles.length < playerCount) {
        roles.push('citizen')
      }
    }

    return roles.sort(() => Math.random() - 0.5)
  }

  private startPhaseTimer(roomId: string) {
    const game = this.games.get(roomId)
    if (!game) return

    if (game.timer) clearInterval(game.timer)

    game.timer = setInterval(() => {
      game.state.timeLeft--

      if (game.state.timeLeft <= 0) {
        this.nextPhase(roomId)
      }
    }, 1000)
  }

  private nextPhase(roomId: string) {
    const game = this.games.get(roomId)
    if (!game) return

    const currentPhase = game.state.phase

    if (currentPhase === 'night') {
      this.resolveNightActions(roomId)
      game.state.phase = 'day'
      game.state.timeLeft = 90
      this.resetActions(roomId)
    } else if (currentPhase === 'day') {
      game.state.phase = 'voting'
      game.state.timeLeft = 45
      game.state.votes = {}
    } else if (currentPhase === 'voting') {
      this.resolveVoting(roomId)
      
      const winner = this.checkWinCondition(roomId)
      if (winner) {
        this.endGame(roomId, winner)
        return
      }

      game.state.phase = 'night'
      game.state.round++
      game.state.timeLeft = 60
      this.resetActions(roomId)
    }

    this.startPhaseTimer(roomId)
  }

  private resolveNightActions(roomId: string) {
    const game = this.games.get(roomId)
    if (!game) return

    const mafiaTargets: string[] = []
    let doctorTarget: string | null = null

    game.actions.forEach((targetId, playerId) => {
      const player = game.players.find(p => p.id === playerId)
      if (!player || !player.isAlive) return

      if (player.role === 'mafia') {
        mafiaTargets.push(targetId)
      } else if (player.role === 'doctor') {
        doctorTarget = targetId
      }
    })

    const mafiaVictim = this.getMostVoted(mafiaTargets)
    
    if (mafiaVictim && mafiaVictim !== doctorTarget) {
      const victim = game.players.find(p => p.id === mafiaVictim)
      if (victim) {
        victim.isAlive = false
        game.state.lastKilled = victim.username
      }
    }
  }

  private resolveVoting(roomId: string) {
    const game = this.games.get(roomId)
    if (!game) return

    const votes = Object.values(game.state.votes)
    const voted = this.getMostVoted(votes)

    if (voted) {
      const victim = game.players.find(p => p.id === voted)
      if (victim) {
        victim.isAlive = false
        game.state.lastVoted = victim.username
      }
    }
  }

  private getMostVoted(votes: string[]): string | null {
    if (votes.length === 0) return null

    const counts = new Map<string, number>()
    votes.forEach(id => {
      counts.set(id, (counts.get(id) || 0) + 1)
    })

    let maxVotes = 0
    let winner: string | null = null

    counts.forEach((count, id) => {
      if (count > maxVotes) {
        maxVotes = count
        winner = id
      }
    })

    return winner
  }

  private checkWinCondition(roomId: string): string | null {
    const game = this.games.get(roomId)
    if (!game) return null

    const alivePlayers = game.players.filter(p => p.isAlive)
    const aliveMafia = alivePlayers.filter(p => p.role === 'mafia')
    const aliveInnocents = alivePlayers.filter(p => p.role !== 'mafia')

    if (aliveMafia.length >= aliveInnocents.length) {
      return 'mafia'
    }

    if (aliveMafia.length === 0) {
      return 'innocents'
    }

    return null
  }

  private endGame(roomId: string, winner: string) {
    const game = this.games.get(roomId)
    if (!game || !game.timer) return

    clearInterval(game.timer)
    game.state.phase = 'results'
  }

  private resetActions(roomId: string) {
    const game = this.games.get(roomId)
    if (!game) return

    game.actions.clear()
    game.players.forEach(p => {
      if (p.isAlive) p.canAct = true
    })
  }

  getGame(roomId: string) {
    return this.games.get(roomId)
  }

  performAction(roomId: string, playerId: string, targetId: string) {
    const game = this.games.get(roomId)
    if (!game) return false

    const player = game.players.find(p => p.id === playerId)
    if (!player || !player.isAlive || !player.canAct) return false

    game.actions.set(playerId, targetId)
    player.canAct = false
    return true
  }

  vote(roomId: string, playerId: string, targetId: string) {
    const game = this.games.get(roomId)
    if (!game || game.state.phase !== 'voting') return false

    game.state.votes[playerId] = targetId
    return true
  }

  sendMessage(roomId: string, playerId: string, message: string) {
    const game = this.games.get(roomId)
    if (!game) return null

    const player = game.players.find(p => p.id === playerId)
    if (!player || !player.isAlive) return null

    const msg: ChatMessage = {
      id: nanoid(),
      playerId,
      username: player.username,
      message,
      timestamp: Date.now(),
      type: game.state.phase === 'night' && player.role === 'mafia' ? 'mafia' : 'public'
    }

    if (msg.type === 'mafia') {
      game.mafiaChat.push(msg)
    } else {
      game.publicChat.push(msg)
    }

    return msg
  }

  cleanup(roomId: string) {
    const game = this.games.get(roomId)
    if (game?.timer) {
      clearInterval(game.timer)
    }
    this.games.delete(roomId)
  }
}
