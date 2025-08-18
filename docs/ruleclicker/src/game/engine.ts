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
  handleMouseDown: () => void
  handleMouseUp: () => void
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

    // ビームのDoTダメージ処理
    if (state.player.isHoldingAttack && currentRuneBuild?.activeRune?.id === 'r_beam') {
      const dotInterval = 100 // 100ms毎にダメージ
      if (!state.player.lastDotTime || currentTime - state.player.lastDotTime > dotInterval) {
        state = handleClick({
          ...state,
          player: {
            ...state.player,
            lastDotTime: currentTime
          },
          passiveTree: currentPassiveTree || undefined,
          runeBuild: currentRuneBuild || undefined
        })
      }
    }

    // デバッグ用: 自動攻撃（ビーム以外の場合のみ）
    if (currentRuneBuild?.activeRune?.id !== 'r_beam' && currentTime - state.player.lastAttackTime > 500) {
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
    
    handleMouseDown: () => {
      // ビームの場合は長押し開始
      if (currentRuneBuild?.activeRune?.id === 'r_beam') {
        state = {
          ...state,
          player: {
            ...state.player,
            isHoldingAttack: true,
            holdStartTime: Date.now(),
            lastAttackTime: Date.now()
          }
        }
      } else {
        // その他のルーンは通常のクリック攻撃
        state = handleClick({
          ...state,
          passiveTree: currentPassiveTree || undefined,
          runeBuild: currentRuneBuild || undefined
        })
      }
      onUpdate(state)
    },
    
    handleMouseUp: () => {
      // 長押し終了
      if (state.player.isHoldingAttack) {
        state = {
          ...state,
          player: {
            ...state.player,
            isHoldingAttack: false,
            holdStartTime: undefined
          }
        }
        onUpdate(state)
      }
    },
    
    updateRuneBuild: (build: RuneBuild) => {
      currentRuneBuild = build
    },
    
    updatePassiveTree: (tree: PassiveTree) => {
      currentPassiveTree = tree
    }
  }
}