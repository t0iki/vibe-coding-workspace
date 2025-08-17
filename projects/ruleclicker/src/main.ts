import { Game } from './game/Game'
import { UI } from './ui/UI'
import { loadContent } from './core/ContentLoader'
import './styles/main.css'

async function init() {
  try {
    const content = await loadContent()
    const game = new Game(content)
    new UI(game)

    game.start()

    console.log('RuleClicker started!')
  } catch (error) {
    console.error('Failed to initialize game:', error)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
