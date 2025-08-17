import type { GameState, GameConfig } from '../domain/types'
import type { RuneBuild } from '../domain/rune'
import type { PassiveTree } from '../domain/passive'
import { DEFAULT_CONFIG } from '../domain/constants'
import { createInitialState, pauseGame, resumeGame } from './state'
import { shouldSpawnEnemy, spawnEnemy, moveEnemies, checkCollisions } from './enemy'
import { handleClick } from './combat'

export interface GameEngine {
  getState: () => GameState
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  handleClick: () => void
  updateRuneBuild: (build: RuneBuild) => void
  updatePassiveTree: (tree: PassiveTree) => void
}

export function createGameEngine(
  onUpdate: (state: GameState) => void,
  config: GameConfig = DEFAULT_CONFIG
): GameEngine {
  let state = createInitialState(config)
  let lastFrameTime = 0
  let animationId: number | null = null
  let currentRuneBuild: RuneBuild | null = null
  let currentPassiveTree: PassiveTree | null = null

  function update(deltaTime: number, currentTime: number) {
    if (state.paused) return

    // Spawn enemies
    if (shouldSpawnEnemy(state, currentTime, config)) {
      state = spawnEnemy(state, currentTime, config)
    }

    // Move enemies
    state = moveEnemies(state, deltaTime)

    // Check collisions
    state = checkCollisions(state)

    // デバッグ用: 自動攻撃（毎秒2回）
    if (currentTime - state.player.lastAttackTime > 500) {
      // パッシブツリーとルーンビルドを含めた状態で攻撃
      state = handleClick({
        ...state,
        passiveTree: currentPassiveTree || undefined,
        runeBuild: currentRuneBuild || undefined
      })
    }

    // Notify update
    onUpdate(state)
  }

  function gameLoop(currentTime: number) {
    const deltaTime = currentTime - lastFrameTime
    update(deltaTime, currentTime)
    lastFrameTime = currentTime
    animationId = requestAnimationFrame(gameLoop)
  }

  return {
    getState: () => state,
    
    start: () => {
      if (animationId !== null) return
      lastFrameTime = performance.now()
      gameLoop(lastFrameTime)
    },
    
    stop: () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    },
    
    pause: () => {
      state = pauseGame(state)
      onUpdate(state)
    },
    
    resume: () => {
      state = resumeGame(state)
      onUpdate(state)
    },
    
    handleClick: () => {
      state = handleClick({
        ...state,
        passiveTree: currentPassiveTree || undefined,
        runeBuild: currentRuneBuild || undefined
      })
      onUpdate(state)
    },
    
    updateRuneBuild: (build: RuneBuild) => {
      currentRuneBuild = build
    },
    
    updatePassiveTree: (tree: PassiveTree) => {
      currentPassiveTree = tree
    }
  }
}