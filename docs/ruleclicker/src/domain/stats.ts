export interface BaseStats {
  // 基礎ステータス
  strength: number
  dexterity: number
  intelligence: number
  
  // 派生ステータス
  maxLife: number
  maxMana: number
  armor: number
  evasion: number
  energyShield: number
}

export interface DamageStats {
  // ダメージ増加
  physicalDamage: number
  elementalDamage: number
  chaosDamage: number
  
  // ダメージタイプ別
  spellDamage: number
  attackDamage: number
  projectileDamage: number
  areaDamage: number
  
  // クリティカル
  criticalChance: number
  criticalMultiplier: number
}

export interface DefenseStats {
  // 軽減
  physicalReduction: number
  elementalResistance: number
  chaosResistance: number
  
  // 回避・ブロック
  dodgeChance: number
  blockChance: number
  
  // 回復
  lifeRegen: number
  manaRegen: number
  lifeLeech: number
}

export interface UtilityStats {
  // 速度
  attackSpeed: number
  castSpeed: number
  movementSpeed: number
  
  // その他
  areaOfEffect: number
  projectileSpeed: number
  duration: number
  cooldownReduction: number
}

export interface PlayerStats extends BaseStats, DamageStats, DefenseStats, UtilityStats {
  // 経験値とレベル
  level: number
  experience: number
  experienceToNext: number
  passivePoints: number
  
  // 現在値
  currentLife: number
  currentMana: number
}

export function createInitialStats(): PlayerStats {
  return {
    // Base
    strength: 10,
    dexterity: 10,
    intelligence: 10,
    maxLife: 1000,
    maxMana: 100,
    armor: 0,
    evasion: 0,
    energyShield: 0,
    
    // Damage
    physicalDamage: 50,
    elementalDamage: 0,
    chaosDamage: 0,
    spellDamage: 0,
    attackDamage: 0,
    projectileDamage: 0,
    areaDamage: 0,
    criticalChance: 5,
    criticalMultiplier: 150,
    
    // Defense
    physicalReduction: 0,
    elementalResistance: 0,
    chaosResistance: 0,
    dodgeChance: 0,
    blockChance: 0,
    lifeRegen: 5,
    manaRegen: 2,
    lifeLeech: 0,
    
    // Utility
    attackSpeed: 1.5,
    castSpeed: 1.0,
    movementSpeed: 1.0,
    areaOfEffect: 1.0,
    projectileSpeed: 1.0,
    duration: 1.0,
    cooldownReduction: 0,
    
    // Level and Experience
    level: 1,
    experience: 0,
    experienceToNext: 100,
    passivePoints: 0,
    
    // Current values
    currentLife: 1000,
    currentMana: 100
  }
}

import type { GameState } from './types'
import { calculatePassiveStats } from './passive'
import { calculateRuneDPS } from './rune'

/**
 * 統合ダメージ計算システム
 * パッシブツリー、ルーン、基礎ダメージを全て考慮
 */
export function calculateTotalDamage(state: GameState): number {
  const baseDamage = state.player.damage
  
  // パッシブツリーからのステータスを取得
  let passiveMultiplier = 1
  if (state.passiveTree) {
    const passiveStats = calculatePassiveStats(state.passiveTree)
    
    // ダメージ増加の適用（%なので100で割る）
    const dmgIncrease = (passiveStats.damage_pct || 0) / 100
    const physIncrease = (passiveStats.phys_dmg_pct || 0) / 100
    const spellIncrease = (passiveStats.spell_dmg_pct || 0) / 100
    const projIncrease = (passiveStats.proj_dmg_pct || 0) / 100
    
    // 現在のルーンのタグに応じて適切な増加を適用
    let totalIncrease = dmgIncrease
    if (state.runeBuild?.activeRune) {
      const tags = state.runeBuild.activeRune.tags
      if (tags.includes('Spell')) totalIncrease += spellIncrease
      if (tags.includes('Projectile')) totalIncrease += projIncrease
      // 物理ダメージの場合
      if (state.runeBuild.activeRune.base.elem === 'phys') {
        totalIncrease += physIncrease
      }
    } else {
      // ルーンなしの場合は物理扱い
      totalIncrease += physIncrease
    }
    
    passiveMultiplier = 1 + totalIncrease
  }
  
  // ルーンDPSの取得
  let runeDamage = baseDamage
  if (state.runeBuild) {
    const runeDPS = calculateRuneDPS(state.runeBuild)
    if (runeDPS > 0) {
      // ルーンのDPSを基礎ダメージの代わりに使用
      runeDamage = runeDPS
    }
  }
  
  // 最終ダメージ計算
  const finalDamage = runeDamage * passiveMultiplier
  
  return Math.floor(finalDamage)
}

/**
 * クリティカル計算
 */
export function calculateCriticalDamage(baseDamage: number, state: GameState): number {
  if (!state.passiveTree) return baseDamage
  
  const passiveStats = calculatePassiveStats(state.passiveTree)
  const critChance = (passiveStats.crit_chance || 0) / 100
  const critMulti = 1.5 + (passiveStats.crit_multi || 0) / 100
  
  // クリティカル判定（簡易版）
  if (Math.random() < critChance) {
    return Math.floor(baseDamage * critMulti)
  }
  
  return baseDamage
}

/**
 * 攻撃速度の計算
 */
export function calculateAttackSpeed(state: GameState): number {
  let baseSpeed = state.player.attackSpeed
  
  if (state.passiveTree) {
    const passiveStats = calculatePassiveStats(state.passiveTree)
    const speedIncrease = (passiveStats.attack_speed_pct || 0) / 100
    baseSpeed *= (1 + speedIncrease)
  }
  
  // ルーンのcast時間を考慮
  if (state.runeBuild?.activeRune) {
    const castMs = state.runeBuild.activeRune.base.castMs
    // castMsから攻撃速度に変換（1000ms / castMs = attacks per second）
    const runeSpeed = 1000 / castMs
    return runeSpeed * baseSpeed / state.player.attackSpeed
  }
  
  return baseSpeed
}

/**
 * 属性色の取得
 */
export function getElementColor(elem: string): string {
  const colors: Record<string, string> = {
    phys: '#888888',
    fire: '#ff6644',
    cold: '#4488ff',
    light: '#ffdd44',
    chaos: '#cc44cc'
  }
  
  return colors[elem] || '#ffffff'
}

/**
 * エフェクトタイプの取得
 */
export function getEffectType(state: GameState): string {
  if (!state.runeBuild?.activeRune) return 'default'
  
  const runeId = state.runeBuild.activeRune.id
  
  // ルーンIDに基づいてエフェクトタイプを返す
  const effectMap: Record<string, string> = {
    r_beam: 'beam',
    r_chain_bolt: 'chain',
    r_poison_rain: 'rain',
    r_fire_burst: 'explosion',
    r_frost_nova: 'nova',
    r_totem: 'totem',
    r_trap: 'trap',
    r_summon_skel: 'summon'
  }
  
  return effectMap[runeId] || 'default'
}