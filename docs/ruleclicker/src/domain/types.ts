import type { PassiveTree } from './passive'
import type { RuneBuild } from './rune'

export type Elem = 'phys' | 'fire' | 'cold' | 'light' | 'chaos'
export type Tag = 'Projectile' | 'Spell' | 'Trap' | 'Totem' | 'Summon' | 'Aura' | 'Melee' | 'DoT' | 'Channel'

export interface Position {
  x: number
  y: number
}

export interface Entity {
  id: string
  position: Position
  hp: number
  maxHp: number
}

export interface Player extends Entity {
  damage: number
  attackSpeed: number
  lastAttackTime: number
  level: number
  experience: number
  experienceToNext: number
  passivePoints: number
}

export interface Enemy extends Entity {
  speed: number
  damage: number
  color: string
  level: number
  experienceValue: number
}

export interface GameState {
  player: Player
  enemies: Enemy[]
  paused: boolean
  score: number
  wave: number
  lastSpawnTime: number
  passiveTree?: PassiveTree
  runeBuild?: RuneBuild
}

export interface GameConfig {
  spawnInterval: number
  enemyBaseSpeed: number
  enemyBaseHp: number
  playerBaseDamage: number
  attackSpeed: number
  playerMaxHp: number
}