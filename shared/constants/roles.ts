export const ROLES = {
  CITIZEN: 'citizen',
  DETECTIVE: 'detective',
  DOCTOR: 'doctor',
  MAFIA: 'mafia',
  SERIAL_KILLER: 'serial_killer'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
