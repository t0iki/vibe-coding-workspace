import type { GameState } from '../domain/types'
import { findNearestEnemy, damageEnemy } from './enemy'
import { updatePlayerAttackTime } from './state'

export function canAttack(state: GameState, currentTime: number): boolean {
  const timeSinceLastAttack = currentTime - state.player.lastAttackTime
  const attackInterval = 1000 / state.player.attackSpeed
  return timeSinceLastAttack >= attackInterval
}

export function performAttack(state: GameState, currentTime: number): GameState {
  const nearestEnemy = findNearestEnemy(state)
  if (!nearestEnemy) return state

  let newState = damageEnemy(state, nearestEnemy.id, state.player.damage)
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