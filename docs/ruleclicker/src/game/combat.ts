import type { GameState, Enemy } from '../domain/types'
import { damageEnemy } from './enemy'
import { updatePlayerAttackTime } from './state'
import { calculateTotalDamage, calculateCriticalDamage, calculateAttackSpeed } from '../domain/stats'

export function canAttack(state: GameState, currentTime: number): boolean {
  const timeSinceLastAttack = currentTime - state.player.lastAttackTime
  const attackSpeed = calculateAttackSpeed(state)
  const attackInterval = 1000 / attackSpeed
  return timeSinceLastAttack >= attackInterval
}

export function findChainTargets(
  state: GameState,
  maxTargets: number,
  maxChainDistance: number = 300
): Enemy[] {
  const targets: Enemy[] = []
  const remainingEnemies = [...state.enemies]
  let lastPosition = state.player.position
  
  // 最大数まで最も近い敵を順番に選択
  for (let i = 0; i < maxTargets && remainingEnemies.length > 0; i++) {
    let nearestEnemy: Enemy | null = null
    let nearestDistance = Infinity
    let nearestIndex = -1
    
    remainingEnemies.forEach((enemy, index) => {
      const dx = enemy.position.x - lastPosition.x
      const dy = enemy.position.y - lastPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
        nearestIndex = index
      }
    })
    
    if (nearestEnemy && nearestIndex >= 0 && nearestDistance < maxChainDistance) {
      targets.push(nearestEnemy)
      const enemy = nearestEnemy as Enemy
      lastPosition = enemy.position
      remainingEnemies.splice(nearestIndex, 1)
    } else {
      break // 距離が遠すぎる場合は連鎖を終了
    }
  }
  
  return targets
}

export function performAttack(state: GameState, currentTime: number): GameState {
  // サポートルーンによる連鎖数を計算
  let chainCount = 1
  if (state.runeBuild?.supportRunes) {
    state.runeBuild.supportRunes.forEach(support => {
      if (support.effect.chains) {
        chainCount += support.effect.chains
      }
    })
  }
  
  // 連鎖対象を取得
  const targets = findChainTargets(state, chainCount)
  if (targets.length === 0) return state

  // 統合ダメージ計算を使用
  const baseDamage = calculateTotalDamage(state)
  let newState = state
  
  // 各ターゲットにダメージを与える（連鎖するごとにダメージ減衰）
  targets.forEach((target, index) => {
    const damageMultiplier = Math.pow(0.8, index) // 連鎖ごとに80%に減衰
    const chainDamage = calculateCriticalDamage(baseDamage * damageMultiplier, newState)
    newState = damageEnemy(newState, target.id, chainDamage)
  })
  
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