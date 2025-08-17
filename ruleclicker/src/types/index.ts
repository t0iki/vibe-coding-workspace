export type Elem = 'phys' | 'fire' | 'cold' | 'light' | 'chaos'
export type Tag =
  | 'Projectile'
  | 'Spell'
  | 'Trap'
  | 'Totem'
  | 'Summon'
  | 'Aura'
  | 'Melee'
  | 'DoT'
  | 'Channel'

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
    more?: {
      hit?: number
      dot?: number
      area?: number
      duration?: number
    }
    add?: {
      repeat?: number
      chains?: number
      pierce?: number
    }
    convert?: {
      to_fire?: number
      to_cold?: number
      to_light?: number
    }
  }
  linkCost?: number
  allowTags?: Tag[]
  forbidTags?: Tag[]
}

export interface PassiveNode {
  id: string
  kind: 'small' | 'notable' | 'cornerstone'
  grants?: Record<string, number>
  desc?: string
  cost: number
  pos?: { x: number; y: number }
  requires?: string[]
}

export interface Enemy {
  id: number
  hp: number
  maxHp: number
  name: string
}

export interface GameStats {
  clickCount: number
  killCount: number
  dps: number
  clickDamage: number
}

export interface GameContent {
  runesActive: RuneActive[]
  runesSupport: RuneSupport[]
  passivesCore: PassiveNode[]
  mapMods: any[]
  atlasNodes: any[]
  craftTiers: any
  qolUnlocks: any[]
  dropTable: any[]
}
