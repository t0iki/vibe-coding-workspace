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