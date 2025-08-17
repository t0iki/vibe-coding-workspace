import type { Enemy, GameStats, RuneActive, RuneSupport } from '@/types'
import type { Game } from '@/game/Game'

interface UIElements {
  clickButton: HTMLButtonElement
  clickArea: HTMLElement
  enemyPack: HTMLElement
  dps: HTMLElement
  clickCount: HTMLElement
  killCount: HTMLElement
  activeRunes: HTMLElement
  supportRunes: HTMLElement
}

export class UI {
  game: Game
  elements: UIElements

  constructor(game: Game) {
    this.game = game
    this.elements = {} as UIElements

    this.createUI()
    this.initElements()
    this.attachEventListeners()
    this.updateDisplay()
  }

  createUI() {
    const app = document.getElementById('app')
    if (!app) return

    app.innerHTML = `
      <div class="game-container">
        <div class="main-panel">
          <div class="enemy-area">
            <div id="enemy-pack" class="enemy-pack"></div>
          </div>
          
          <div class="click-area" id="click-area">
            <button class="click-button" id="click-button">クリック！</button>
          </div>
        </div>
        
        <div class="side-panel">
          <div class="stats">
            <h3>ステータス</h3>
            <p>DPS: <span id="dps">0</span></p>
            <p>クリック数: <span id="click-count">0</span></p>
            <p>倒した敵: <span id="kill-count">0</span></p>
          </div>
          
          <div class="runes">
            <h3>アクティブルーン</h3>
            <div id="active-runes" class="rune-slots"></div>
            
            <h3>サポートルーン</h3>
            <div id="support-runes" class="rune-slots"></div>
          </div>
        </div>
      </div>
    `
  }

  initElements() {
    this.elements = {
      clickButton: document.getElementById('click-button') as HTMLButtonElement,
      clickArea: document.getElementById('click-area') as HTMLElement,
      enemyPack: document.getElementById('enemy-pack') as HTMLElement,
      dps: document.getElementById('dps') as HTMLElement,
      clickCount: document.getElementById('click-count') as HTMLElement,
      killCount: document.getElementById('kill-count') as HTMLElement,
      activeRunes: document.getElementById('active-runes') as HTMLElement,
      supportRunes: document.getElementById('support-runes') as HTMLElement,
    }
  }

  attachEventListeners() {
    this.elements.clickButton.addEventListener('click', () => {
      this.game.click()
    })

    this.elements.enemyPack.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.enemy')) {
        this.game.click()
      }
    })

    window.addEventListener('gameUpdate', ((e: CustomEvent) => {
      this.updateStats(e.detail.stats)
    }) as EventListener)

    window.addEventListener('enemyDamaged', ((e: CustomEvent) => {
      this.updateEnemy(e.detail.enemy)
      this.showDamageNumber(e.detail.enemy, e.detail.damage)
    }) as EventListener)

    window.addEventListener('enemyKilled', ((e: CustomEvent) => {
      this.removeEnemy(e.detail.enemy)
    }) as EventListener)
  }

  updateDisplay() {
    this.updateStats(this.game.stats)
    this.updateEnemies()
    this.updateRunes()
  }

  updateStats(stats: GameStats) {
    this.elements.dps.textContent = stats.dps.toString()
    this.elements.clickCount.textContent = stats.clickCount.toString()
    this.elements.killCount.textContent = stats.killCount.toString()
  }

  updateEnemies() {
    this.elements.enemyPack.innerHTML = ''

    this.game.enemies.forEach((enemy) => {
      const enemyEl = this.createEnemyElement(enemy)
      this.elements.enemyPack.appendChild(enemyEl)
    })
  }

  createEnemyElement(enemy: Enemy): HTMLElement {
    const div = document.createElement('div')
    div.className = 'enemy'
    div.dataset.id = enemy.id.toString()
    div.innerHTML = `
      <div class="hp-bar">
        <div class="hp-fill" style="width: ${(enemy.hp / enemy.maxHp) * 100}%"></div>
      </div>
      <span class="enemy-name">${enemy.name}</span>
    `
    return div
  }

  updateEnemy(enemy: Enemy) {
    const enemyEl = this.elements.enemyPack.querySelector(`[data-id="${enemy.id}"]`)
    if (enemyEl) {
      const hpFill = enemyEl.querySelector('.hp-fill') as HTMLElement
      hpFill.style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`

      enemyEl.classList.add('damaged')
      setTimeout(() => enemyEl.classList.remove('damaged'), 200)
    }
  }

  removeEnemy(enemy: Enemy) {
    const enemyEl = this.elements.enemyPack.querySelector(`[data-id="${enemy.id}"]`)
    if (enemyEl) {
      ;(enemyEl as HTMLElement).style.animation = 'fadeOut 0.3s'
      setTimeout(() => {
        enemyEl.remove()
        this.updateEnemies()
      }, 300)
    }
  }

  showDamageNumber(enemy: Enemy, damage: number) {
    const enemyEl = this.elements.enemyPack.querySelector(`[data-id="${enemy.id}"]`) as HTMLElement
    if (!enemyEl) return

    const damageEl = document.createElement('div')
    damageEl.className = 'damage-number'
    damageEl.textContent = damage.toString()
    damageEl.style.cssText = `
      position: absolute;
      color: #ff6666;
      font-size: 24px;
      font-weight: bold;
      pointer-events: none;
      animation: damageFloat 1s ease-out forwards;
    `

    enemyEl.style.position = 'relative'
    enemyEl.appendChild(damageEl)

    setTimeout(() => damageEl.remove(), 1000)
  }

  updateRunes() {
    this.elements.activeRunes.innerHTML = ''
    this.game.activeRunes.forEach((rune) => {
      const runeEl = this.createRuneElement(rune, 'active')
      this.elements.activeRunes.appendChild(runeEl)
    })

    for (let i = this.game.activeRunes.length; i < 2; i++) {
      const emptySlot = this.createEmptyRuneSlot('active')
      this.elements.activeRunes.appendChild(emptySlot)
    }

    this.elements.supportRunes.innerHTML = ''
    this.game.supportRunes.forEach((rune) => {
      const runeEl = this.createRuneElement(rune, 'support')
      this.elements.supportRunes.appendChild(runeEl)
    })

    for (let i = this.game.supportRunes.length; i < 2; i++) {
      const emptySlot = this.createEmptyRuneSlot('support')
      this.elements.supportRunes.appendChild(emptySlot)
    }
  }

  createRuneElement(rune: RuneActive | RuneSupport, type: string): HTMLElement {
    const div = document.createElement('div')
    div.className = `rune-slot ${type}`
    div.title = rune.name
    div.textContent = rune.name.charAt(0)
    return div
  }

  createEmptyRuneSlot(type: string): HTMLElement {
    const div = document.createElement('div')
    div.className = `rune-slot empty ${type}`
    return div
  }
}
