import type { GameState } from '../domain/types'
import { findNearestEnemy, damageEnemy } from './enemy'
import { updatePlayerAttackTime } from './state'
import { calculateTotalDamage, calculateCriticalDamage, calculateAttackSpeed } from '../domain/stats'

export function canAttack(state: GameState, currentTime: number): boolean {
  const timeSinceLastAttack = currentTime - state.player.lastAttackTime
  const attackSpeed = calculateAttackSpeed(state)
  const attackInterval = 1000 / attackSpeed
  return timeSinceLastAttack >= attackInterval
}

export function performAttack(state: GameState, currentTime: number): GameState {
  const nearestEnemy = findNearestEnemy(state)
  if (!nearestEnemy) return state

  // 統合ダメージ計算を使用
  const baseDamage = calculateTotalDamage(state)
  const finalDamage = calculateCriticalDamage(baseDamage, state)
  
  let newState = damageEnemy(state, nearestEnemy.id, finalDamage)
  newState = updatePlayerAttackTime(newState, currentTime)
  
  return newState
}

export function handleClick(state: GameState): GameState {
  const currentTime = Date.now()
  
  if (!canAttack(state, currentTime)) {
    return state
  }

  return performAttack(state, currentTime)
}