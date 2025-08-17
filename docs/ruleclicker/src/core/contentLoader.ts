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
  return [
    {
      id: 'start_str',
      kind: 'notable',
      grants: {
        max_life_pct: 5,
        armor_pct: 12
      },
      desc: '開始点（力系）',
      cost: 0,
      pos: { x: 0, y: 0 },
      links: ['p_str_01']
    },
    {
      id: 'start_dex',
      kind: 'notable',
      grants: {
        evasion_pct: 12,
        proj_dmg_pct: 6
      },
      desc: '開始点（敏捷系）',
      cost: 0,
      pos: { x: 200, y: 0 },
      links: ['p_dex_01']
    },
    {
      id: 'start_int',
      kind: 'notable',
      grants: {
        spell_dmg_pct: 8,
        res_all_pct: 5
      },
      desc: '開始点（知性系）',
      cost: 0,
      pos: { x: -200, y: 0 },
      links: ['p_int_01']
    },
    {
      id: 'p_str_01',
      kind: 'small',
      grants: { max_life: 20 },
      cost: 1,
      pos: { x: 50, y: 0 },
      requires: ['start_str'],
      links: ['p_str_02']
    },
    {
      id: 'p_str_02',
      kind: 'small',
      grants: { physical_damage: 10 },
      cost: 1,
      pos: { x: 100, y: 0 },
      requires: ['p_str_01']
    },
    {
      id: 'p_dex_01',
      kind: 'small',
      grants: { attack_speed_pct: 5 },
      cost: 1,
      pos: { x: 250, y: 0 },
      requires: ['start_dex']
    },
    {
      id: 'p_int_01',
      kind: 'small',
      grants: { spell_damage_pct: 10 },
      cost: 1,
      pos: { x: -250, y: 0 },
      requires: ['start_int']
    }
  ]
}