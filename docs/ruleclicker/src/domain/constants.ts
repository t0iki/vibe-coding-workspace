import type { GameConfig } from './types'

export const DEFAULT_CONFIG: GameConfig = {
  spawnInterval: 2000,
  enemyBaseSpeed: 0.5,
  enemyBaseHp: 100,
  playerBaseDamage: 50,
  attackSpeed: 1.5,
  playerMaxHp: 1000
}

export const ENEMY_COLORS = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff']

export const PLAYER_RADIUS = 20
export const ENEMY_RADIUS = 15
export const COLLISION_DISTANCE = 30
export const SPAWN_DISTANCE = 350
export const ATTACK_EFFECT_DURATION = 200