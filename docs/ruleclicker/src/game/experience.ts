import type { PlayerStats } from '../domain/stats'

const EXPERIENCE_CURVE = {
  base: 100,
  exponent: 1.5,
  multiplier: 1.2
}

export function calculateExperienceToNext(level: number): number {
  return Math.floor(
    EXPERIENCE_CURVE.base * 
    Math.pow(level, EXPERIENCE_CURVE.exponent) * 
    EXPERIENCE_CURVE.multiplier
  )
}

export function addExperience(stats: PlayerStats, amount: number): PlayerStats {
  let newStats = { ...stats }
  newStats.experience += amount
  
  // レベルアップチェック
  while (newStats.experience >= newStats.experienceToNext) {
    newStats = levelUp(newStats)
  }
  
  return newStats
}

export function levelUp(stats: PlayerStats): PlayerStats {
  const remainingExp = stats.experience - stats.experienceToNext
  const newLevel = stats.level + 1
  
  return {
    ...stats,
    level: newLevel,
    experience: remainingExp,
    experienceToNext: calculateExperienceToNext(newLevel),
    passivePoints: stats.passivePoints + 1,
    
    // レベルアップボーナス
    maxLife: stats.maxLife + 50,
    maxMana: stats.maxMana + 10,
    strength: stats.strength + 1,
    dexterity: stats.dexterity + 1,
    intelligence: stats.intelligence + 1,
    
    // 回復
    currentLife: stats.maxLife + 50,
    currentMana: stats.maxMana + 10
  }
}

export function getExperienceFromEnemy(enemyLevel: number, playerLevel: number): number {
  const baseExp = 10 * enemyLevel
  const levelDiff = Math.abs(enemyLevel - playerLevel)
  
  // レベル差によるペナルティ
  if (levelDiff > 5) {
    return Math.max(1, Math.floor(baseExp * 0.5))
  } else if (levelDiff > 3) {
    return Math.max(1, Math.floor(baseExp * 0.75))
  }
  
  return baseExp
}