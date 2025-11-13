export interface Player {
  id: string
  username: string
  isHost: boolean
  isReady: boolean
  role?: string
  isAlive?: boolean
}

export interface Room {
  id: string
  host: string
  players: Player[]
  state: 'waiting' | 'playing' | 'finished'
  createdAt: number
}

export interface GameState {
  roomId: string
  phase: 'night' | 'day' | 'voting'
  round: number
  timeLeft: number
}
