import type { Enemy, GameState, GameConfig, Position } from '../domain/types'
import { ENEMY_COLORS, SPAWN_DISTANCE, COLLISION_DISTANCE } from '../domain/constants'
import { getDistance, normalizeVector, getRandomAngle, getRandomElement } from '../core/math'
import { addExperienceToPlayer } from './state'

export function createEnemy(playerPos: Position, wave: number, config: GameConfig): Enemy {
  const angle = getRandomAngle()
  const x = playerPos.x + Math.cos(angle) * SPAWN_DISTANCE
  const y = playerPos.y + Math.sin(angle) * SPAWN_DISTANCE
  const enemyLevel = Math.max(1, wave)

  return {
    id: `enemy-${Date.now()}-${Math.random()}`,
    position: { x, y },
    hp: config.enemyBaseHp * (1 + wave * 0.2),
    maxHp: config.enemyBaseHp * (1 + wave * 0.2),
    speed: config.enemyBaseSpeed * (1 + wave * 0.1),
    damage: 10 * (1 + wave * 0.15),
    color: getRandomElement(ENEMY_COLORS),
    level: enemyLevel,
    experienceValue: 10 * enemyLevel
  }
}

export function shouldSpawnEnemy(state: GameState, currentTime: number, config: GameConfig): boolean {
  return currentTime - state.lastSpawnTime > config.spawnInterval
}

export function spawnEnemy(state: GameState, currentTime: number, config: GameConfig): GameState {
  const enemy = createEnemy(state.player.position, state.wave, config)
  return {
    ...state,
    enemies: [...state.enemies, enemy],
    lastSpawnTime: currentTime
  }
}

export function moveEnemies(state: GameState, deltaTime: number): GameState {
  const updatedEnemies = state.enemies.map(enemy => {
    const dx = state.player.position.x - enemy.position.x
    const dy = state.player.position.y - enemy.position.y
    const distance = getDistance(enemy.position, state.player.position)

    if (distance <= COLLISION_DISTANCE) {
      return enemy
    }

    const direction = normalizeVector(dx, dy)
    const moveSpeed = enemy.speed * deltaTime * 0.06

    return {
      ...enemy,
      position: {
        x: enemy.position.x + direction.x * moveSpeed,
        y: enemy.position.y + direction.y * moveSpeed
      }
    }
  })

  return { ...state, enemies: updatedEnemies }
}

export function checkCollisions(state: GameState): GameState {
  let newState = state
  const survivingEnemies: Enemy[] = []
  let totalDamage = 0

  for (const enemy of state.enemies) {
    const distance = getDistance(enemy.position, state.player.position)
    if (distance < COLLISION_DISTANCE) {
      totalDamage += enemy.damage
    } else {
      survivingEnemies.push(enemy)
    }
  }

  newState = { ...newState, enemies: survivingEnemies }

  if (totalDamage > 0) {
    const newHp = Math.max(0, state.player.hp - totalDamage)
    newState = {
      ...newState,
      player: { ...state.player, hp: newHp },
      paused: newHp <= 0 ? true : state.paused
    }
  }

  return newState
}

export function findNearestEnemy(state: GameState): Enemy | null {
  if (state.enemies.length === 0) return null

  let nearest = state.enemies[0]
  let minDistance = getDistance(state.player.position, nearest.position)

  for (const enemy of state.enemies) {
    const distance = getDistance(state.player.position, enemy.position)
    if (distance < minDistance) {
      minDistance = distance
      nearest = enemy
    }
  }

  return nearest
}

export function damageEnemy(state: GameState, enemyId: string, damage: number): GameState {
  const targetEnemy = state.enemies.find(e => e.id === enemyId)
  if (!targetEnemy) return state
  
  const updatedEnemies = state.enemies.map(enemy => {
    if (enemy.id !== enemyId) return enemy
    return { ...enemy, hp: enemy.hp - damage }
  })

  const survivingEnemies = updatedEnemies.filter(enemy => enemy.hp > 0)
  const enemyKilled = survivingEnemies.length < state.enemies.length

  let newState = { ...state, enemies: survivingEnemies }

  if (enemyKilled) {
    newState = { ...newState, score: newState.score + 10 * newState.wave }
    
    // 経験値を獲得
    newState = addExperienceToPlayer(newState, targetEnemy.experienceValue)
    
    if (survivingEnemies.length === 0 && newState.score > 0 && newState.score % 100 === 0) {
      newState = { ...newState, wave: newState.wave + 1 }
    }
  }

  return newState
}