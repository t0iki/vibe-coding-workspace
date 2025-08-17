import type { GameState, GameConfig } from '../domain/types'

export function createInitialState(config: GameConfig): GameState {
  return {
    player: {
      id: 'player',
      position: { x: 400, y: 300 },
      hp: config.playerMaxHp,
      maxHp: config.playerMaxHp,
      damage: config.playerBaseDamage,
      attackSpeed: config.attackSpeed,
      lastAttackTime: 0,
      level: 1,
      experience: 0,
      experienceToNext: 100,
      passivePoints: 0
    },
    enemies: [],
    paused: false,
    score: 0,
    wave: 1,
    lastSpawnTime: 0
  }
}

export function pauseGame(state: GameState): GameState {
  return { ...state, paused: true }
}

export function resumeGame(state: GameState): GameState {
  return { ...state, paused: false }
}

export function incrementWave(state: GameState): GameState {
  return { ...state, wave: state.wave + 1 }
}

export function addScore(state: GameState, points: number): GameState {
  return { ...state, score: state.score + points }
}

export function damagePlayer(state: GameState, damage: number): GameState {
  const newHp = Math.max(0, state.player.hp - damage)
  return {
    ...state,
    player: { ...state.player, hp: newHp },
    paused: newHp <= 0 ? true : state.paused
  }
}

export function addExperienceToPlayer(state: GameState, exp: number): GameState {
  let newPlayer = { ...state.player }
  newPlayer.experience += exp
  
  // レベルアップチェック
  while (newPlayer.experience >= newPlayer.experienceToNext) {
    const remaining = newPlayer.experience - newPlayer.experienceToNext
    newPlayer.level++
    newPlayer.experience = remaining
    newPlayer.experienceToNext = Math.floor(100 * Math.pow(newPlayer.level, 1.5))
    newPlayer.passivePoints++
    newPlayer.maxHp += 50
    newPlayer.hp = newPlayer.maxHp // Full heal on level up
    newPlayer.damage += 5
  }
  
  return { ...state, player: newPlayer }
}

export function updatePlayerAttackTime(state: GameState, time: number): GameState {
  return {
    ...state,
    player: { ...state.player, lastAttackTime: time }
  }
}