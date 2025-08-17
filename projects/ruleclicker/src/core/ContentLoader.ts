import type { GameContent } from '@/types'

export async function loadContent(): Promise<GameContent> {
  const content: GameContent = {
    runesActive: [],
    runesSupport: [],
    passivesCore: [],
    mapMods: [],
    atlasNodes: [],
    craftTiers: {},
    qolUnlocks: [],
    dropTable: [],
  }

  try {
    const files = [
      { key: 'runesActive', path: '/src/content/runes_active.json' },
      { key: 'runesSupport', path: '/src/content/runes_support.json' },
      { key: 'passivesCore', path: '/src/content/passives_core.json' },
      { key: 'mapMods', path: '/src/content/mapmods.json' },
      { key: 'atlasNodes', path: '/src/content/atlas_nodes.json' },
      { key: 'craftTiers', path: '/src/content/craft_tiers.json' },
      { key: 'qolUnlocks', path: '/src/content/qol_unlocks.json' },
    ] as const

    const promises = files.map(async ({ key, path }) => {
      try {
        const response = await fetch(path)
        if (response.ok) {
          const data = await response.json()
          ;(content as any)[key] = data
        } else {
          console.warn(`Failed to load ${path}`)
        }
      } catch (error) {
        console.warn(`Error loading ${path}:`, error)
      }
    })

    await Promise.all(promises)

    console.log('Content loaded:', content)
  } catch (error) {
    console.error('Failed to load content:', error)
  }

  return content
}
