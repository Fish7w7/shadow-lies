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
  phase: 'night' | 'day' | 'voting' | 'results'
  round: number
  timeLeft: number
  votes: Record<string, string> // voterId -> targetId
  lastKilled?: string
  lastVoted?: string
}

export interface ChatMessage {
  id: string
  playerId: string
  username: string
  message: string
  timestamp: number
  type: 'public' | 'mafia' | 'system'
}

export type Role = 'citizen' | 'detective' | 'doctor' | 'mafia' | 'serial_killer'

export interface PlayerRole extends Player {
  role: Role
  target?: string
  canAct: boolean
}
