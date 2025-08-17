import { z } from 'zod'
import type { PassiveNode } from '../domain/passive'

const PassiveNodeSchema = z.object({
  id: z.string(),
  kind: z.enum(['small', 'notable', 'cornerstone']),
  grants: z.record(z.string(), z.number()).optional(),
  desc: z.string().optional(),
  cost: z.number(),
  pos: z.object({
    x: z.number(),
    y: z.number()
  }),
  requires: z.array(z.string()).optional(),
  links: z.array(z.string()).optional()
})

const PassiveTreeSchema = z.array(PassiveNodeSchema)

export async function loadPassiveTree(): Promise<PassiveNode[]> {
  try {
    const response = await fetch('/src/content/passives_core.json')
    if (!response.ok) {
      throw new Error(`Failed to load passive tree: ${response.statusText}`)
    }
    
    const data = await response.json()
    const validated = PassiveTreeSchema.parse(data)
    return validated
  } catch (error) {
    console.error('Error loading passive tree:', error)
    // フォールバック用のデフォルトツリー
    return getDefaultPassiveTree()
  }
}

function getDefaultPassiveTree(): PassiveNode[] {
  const nodes: PassiveNode[] = []
  
  // 開始点
  nodes.push(
    {
      id: 'start_str',
      kind: 'notable',
      grants: { max_life_pct: 5, armor_pct: 12 },
      desc: '開始点（力系）',
      cost: 0,
      pos: { x: 0, y: -200 },
      links: ['str_path_1', 'str_life_1']
    },
    {
      id: 'start_dex',
      kind: 'notable',
      grants: { evasion_pct: 12, attack_speed_pct: 6 },
      desc: '開始点（敏捷系）',
      cost: 0,
      pos: { x: 173, y: 100 },
      links: ['dex_path_1', 'dex_crit_1']
    },
    {
      id: 'start_int',
      kind: 'notable',
      grants: { spell_dmg_pct: 8, mana_pct: 10 },
      desc: '開始点（知性系）',
      cost: 0,
      pos: { x: -173, y: 100 },
      links: ['int_path_1', 'int_elem_1']
    }
  )
  
  // STR系統
  nodes.push(
    { id: 'str_path_1', kind: 'small', grants: { max_life: 15 }, cost: 1, pos: { x: 0, y: -150 }, requires: ['start_str'], links: ['str_path_2', 'str_dmg_1'] },
    { id: 'str_path_2', kind: 'small', grants: { physical_damage_pct: 8 }, cost: 1, pos: { x: 0, y: -100 }, requires: ['str_path_1'], links: ['str_notable_1'] },
    { id: 'str_life_1', kind: 'small', grants: { max_life: 20 }, cost: 1, pos: { x: -40, y: -180 }, requires: ['start_str'], links: ['str_life_2'] },
    { id: 'str_life_2', kind: 'small', grants: { max_life_pct: 4 }, cost: 1, pos: { x: -60, y: -150 }, requires: ['str_life_1'], links: ['str_life_notable'] },
    { id: 'str_dmg_1', kind: 'small', grants: { physical_damage_pct: 10 }, cost: 1, pos: { x: 40, y: -180 }, requires: ['str_path_1'], links: ['str_dmg_2'] },
    { id: 'str_dmg_2', kind: 'small', grants: { melee_damage_pct: 12 }, cost: 1, pos: { x: 60, y: -150 }, requires: ['str_dmg_1'], links: ['str_dmg_notable'] },
    
    { id: 'str_notable_1', kind: 'notable', grants: { physical_damage_pct: 20, max_life: 30 }, desc: '頑強', cost: 1, pos: { x: 0, y: -50 }, requires: ['str_path_2'], links: ['str_cs_1'] },
    { id: 'str_life_notable', kind: 'notable', grants: { max_life_pct: 10, life_regen: 2 }, desc: '生命力', cost: 1, pos: { x: -80, y: -120 }, requires: ['str_life_2'] },
    { id: 'str_dmg_notable', kind: 'notable', grants: { physical_damage_pct: 15, attack_speed_pct: 8 }, desc: '破壊力', cost: 1, pos: { x: 80, y: -120 }, requires: ['str_dmg_2'] },
    
    { id: 'str_cs_1', kind: 'cornerstone', grants: { more_physical_damage: 30, less_elemental_damage: -50 }, desc: '物理特化', cost: 2, pos: { x: 0, y: 0 }, requires: ['str_notable_1'] }
  )
  
  // DEX系統
  nodes.push(
    { id: 'dex_path_1', kind: 'small', grants: { attack_speed_pct: 4 }, cost: 1, pos: { x: 150, y: 80 }, requires: ['start_dex'], links: ['dex_path_2'] },
    { id: 'dex_path_2', kind: 'small', grants: { critical_chance: 10 }, cost: 1, pos: { x: 120, y: 60 }, requires: ['dex_path_1'], links: ['dex_notable_1'] },
    { id: 'dex_crit_1', kind: 'small', grants: { critical_chance: 15 }, cost: 1, pos: { x: 180, y: 130 }, requires: ['start_dex'], links: ['dex_crit_2'] },
    { id: 'dex_crit_2', kind: 'small', grants: { critical_multiplier: 20 }, cost: 1, pos: { x: 160, y: 150 }, requires: ['dex_crit_1'], links: ['dex_crit_notable'] },
    
    { id: 'dex_notable_1', kind: 'notable', grants: { attack_speed_pct: 12, evasion_pct: 15 }, desc: '機敏', cost: 1, pos: { x: 90, y: 40 }, requires: ['dex_path_2'], links: ['dex_cs_1'] },
    { id: 'dex_crit_notable', kind: 'notable', grants: { critical_chance: 25, critical_multiplier: 30 }, desc: 'クリティカル', cost: 1, pos: { x: 140, y: 170 }, requires: ['dex_crit_2'] },
    
    { id: 'dex_cs_1', kind: 'cornerstone', grants: { more_attack_speed: 50, less_damage: -20 }, desc: '高速攻撃', cost: 2, pos: { x: 60, y: 20 }, requires: ['dex_notable_1'] }
  )
  
  // INT系統
  nodes.push(
    { id: 'int_path_1', kind: 'small', grants: { spell_damage_pct: 8 }, cost: 1, pos: { x: -150, y: 80 }, requires: ['start_int'], links: ['int_path_2'] },
    { id: 'int_path_2', kind: 'small', grants: { elemental_damage_pct: 10 }, cost: 1, pos: { x: -120, y: 60 }, requires: ['int_path_1'], links: ['int_notable_1'] },
    { id: 'int_elem_1', kind: 'small', grants: { fire_damage_pct: 12 }, cost: 1, pos: { x: -180, y: 130 }, requires: ['start_int'], links: ['int_elem_2'] },
    { id: 'int_elem_2', kind: 'small', grants: { cold_damage_pct: 12 }, cost: 1, pos: { x: -160, y: 150 }, requires: ['int_elem_1'], links: ['int_elem_notable'] },
    
    { id: 'int_notable_1', kind: 'notable', grants: { spell_damage_pct: 20, cast_speed_pct: 10 }, desc: '呪文強化', cost: 1, pos: { x: -90, y: 40 }, requires: ['int_path_2'], links: ['int_cs_1'] },
    { id: 'int_elem_notable', kind: 'notable', grants: { elemental_damage_pct: 25, elemental_penetration: 10 }, desc: '元素の力', cost: 1, pos: { x: -140, y: 170 }, requires: ['int_elem_2'] },
    
    { id: 'int_cs_1', kind: 'cornerstone', grants: { more_spell_damage: 40, less_attack_damage: -60 }, desc: '呪文特化', cost: 2, pos: { x: -60, y: 20 }, requires: ['int_notable_1'] }
  )
  
  // 中央の共通ノード
  nodes.push(
    { id: 'center_life', kind: 'notable', grants: { max_life_pct: 8, all_resistance: 10 }, desc: '耐久', cost: 1, pos: { x: 0, y: 30 }, links: ['center_path_1'] },
    { id: 'center_path_1', kind: 'small', grants: { damage_pct: 5 }, cost: 1, pos: { x: 0, y: 60 }, requires: ['center_life'], links: ['center_path_2'] },
    { id: 'center_path_2', kind: 'small', grants: { damage_pct: 5 }, cost: 1, pos: { x: 0, y: 90 }, requires: ['center_path_1'], links: ['center_notable'] },
    { id: 'center_notable', kind: 'notable', grants: { more_damage: 15 }, desc: '万能', cost: 2, pos: { x: 0, y: 120 }, requires: ['center_path_2'] }
  )
  
  return nodes
}