import type { Elem, Tag } from './types'

export interface RuneActive {
  id: string
  name: string
  base: {
    hit: number
    dps: number
    elem: Elem
    castMs: number
    proj?: number
  }
  tags: Tag[]
  scales: string[]
  levelReq: number
}

export interface RuneSupport {
  id: string
  name: string
  effect: {
    more?: Record<string, number>
    add?: Record<string, number>
    chains?: number
    pierce?: number
    convert?: Record<string, number>
  }
  linkCost?: number
  allowTags?: Tag[]
  forbidTags?: Tag[]
}

export interface RuneBuild {
  activeRune: RuneActive | null
  supportRunes: RuneSupport[]
}

export function createEmptyRuneBuild(): RuneBuild {
  return {
    activeRune: null,
    supportRunes: []
  }
}

export function canLinkSupport(active: RuneActive, support: RuneSupport): boolean {
  // Check if support allows the active rune's tags
  if (support.allowTags && support.allowTags.length > 0) {
    const hasAllowedTag = support.allowTags.some(tag => active.tags.includes(tag))
    if (!hasAllowedTag) return false
  }
  
  // Check if support forbids any of the active rune's tags
  if (support.forbidTags && support.forbidTags.length > 0) {
    const hasForbiddenTag = support.forbidTags.some(tag => active.tags.includes(tag))
    if (hasForbiddenTag) return false
  }
  
  return true
}

export function calculateRuneDPS(build: RuneBuild): number {
  if (!build.activeRune) return 0
  
  let baseDPS = build.activeRune.base.dps
  let totalIncrease = 0
  let totalMore = 1
  
  // Apply support effects
  build.supportRunes.forEach(support => {
    if (support.effect.more) {
      Object.entries(support.effect.more).forEach(([stat, value]) => {
        if (stat === 'hit' || stat === 'damage') {
          // Apply diminishing returns: More_eff = 1 - (1 - More)^0.7
          const moreEff = 1 - Math.pow(1 - value, 0.7)
          totalMore *= (1 + moreEff)
        }
      })
    }
    
    if (support.effect.add) {
      Object.entries(support.effect.add).forEach(([stat, value]) => {
        if (stat === 'damage_pct') {
          totalIncrease += value
        }
      })
    }
  })
  
  // Apply the DPS formula from README.md
  const finalDPS = baseDPS * (1 + totalIncrease) * totalMore
  
  return Math.floor(finalDPS)
}

export function getRuneDescription(rune: RuneActive): string {
  return `${rune.name} - ${rune.base.elem} damage`
}

export function getSupportDescription(support: RuneSupport): string {
  const effects: string[] = []
  
  if (support.effect.more) {
    Object.entries(support.effect.more).forEach(([stat, value]) => {
      const percent = Math.floor(value * 100)
      if (percent > 0) {
        effects.push(`+${percent}% more ${stat}`)
      } else {
        effects.push(`${percent}% less ${stat}`)
      }
    })
  }
  
  if (support.effect.chains) {
    effects.push(`Chains ${support.effect.chains} times`)
  }
  
  if (support.effect.add?.repeat) {
    effects.push(`Repeats ${support.effect.add.repeat} additional times`)
  }
  
  return effects.join(', ')
}