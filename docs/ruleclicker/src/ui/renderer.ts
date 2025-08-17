import type { GameState } from '../domain/types'
import { PLAYER_RADIUS, ENEMY_RADIUS, ATTACK_EFFECT_DURATION } from '../domain/constants'

export interface Renderer {
  render: (state: GameState) => void
  getSVG: () => SVGSVGElement
  destroy: () => void
}

export function createRenderer(container: HTMLElement): Renderer {
  const wrapper = document.createElement('div')
  wrapper.style.position = 'relative'
  wrapper.style.display = 'inline-block'
  
  const svg = createSVG()
  const gameArea = createGameArea()
  const uiLayer = createUILayer()
  
  svg.appendChild(gameArea)
  wrapper.appendChild(svg)
  wrapper.appendChild(uiLayer)
  container.appendChild(wrapper)

  function createSVG(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '800')
    svg.setAttribute('height', '600')
    svg.style.backgroundColor = '#1a1a2e'
    svg.style.border = '2px solid #16213e'
    svg.style.borderRadius = '8px'
    svg.style.cursor = 'crosshair'
    return svg
  }

  function createGameArea(): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.id = 'game-area'
    return group
  }

  function createUILayer(): HTMLDivElement {
    const ui = document.createElement('div')
    ui.style.position = 'absolute'
    ui.style.top = '15px'
    ui.style.left = '15px'
    ui.style.color = 'white'
    ui.style.fontFamily = 'monospace'
    ui.style.fontSize = '16px'
    ui.style.fontWeight = 'bold'
    ui.style.pointerEvents = 'none'
    ui.style.textShadow = '2px 2px 4px rgba(0,0,0,0.9)'
    ui.style.background = 'rgba(0,0,0,0.5)'
    ui.style.padding = '10px'
    ui.style.borderRadius = '5px'
    ui.style.minWidth = '150px'
    return ui
  }

  function createHealthBar(
    x: number,
    y: number,
    width: number,
    height: number,
    current: number,
    max: number,
    color: string
  ): SVGGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('x', String(x))
    bg.setAttribute('y', String(y))
    bg.setAttribute('width', String(width))
    bg.setAttribute('height', String(height))
    bg.setAttribute('fill', '#333333')
    bg.setAttribute('stroke', '#666666')
    bg.setAttribute('stroke-width', '1')
    
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bar.setAttribute('x', String(x))
    bar.setAttribute('y', String(y))
    bar.setAttribute('width', String(width * (current / max)))
    bar.setAttribute('height', String(height))
    bar.setAttribute('fill', color)
    
    group.appendChild(bg)
    group.appendChild(bar)
    
    return group
  }

  function renderPlayer(state: GameState) {
    const player = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    body.setAttribute('cx', String(state.player.position.x))
    body.setAttribute('cy', String(state.player.position.y))
    body.setAttribute('r', String(PLAYER_RADIUS))
    body.setAttribute('fill', '#4488ff')
    body.setAttribute('stroke', '#66aaff')
    body.setAttribute('stroke-width', '2')
    
    const healthBar = createHealthBar(
      state.player.position.x - 25,
      state.player.position.y - 35,
      50,
      6,
      state.player.hp,
      state.player.maxHp,
      '#44ff44'
    )
    
    player.appendChild(body)
    player.appendChild(healthBar)
    gameArea.appendChild(player)
  }

  function renderEnemies(state: GameState) {
    state.enemies.forEach(enemy => {
      const enemyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      
      const body = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      body.setAttribute('cx', String(enemy.position.x))
      body.setAttribute('cy', String(enemy.position.y))
      body.setAttribute('r', String(ENEMY_RADIUS))
      body.setAttribute('fill', enemy.color)
      body.setAttribute('stroke', '#ffffff')
      body.setAttribute('stroke-width', '1')
      body.setAttribute('opacity', '0.9')
      
      const healthBar = createHealthBar(
        enemy.position.x - 20,
        enemy.position.y - 25,
        40,
        4,
        enemy.hp,
        enemy.maxHp,
        '#ff4444'
      )
      
      enemyGroup.appendChild(body)
      enemyGroup.appendChild(healthBar)
      gameArea.appendChild(enemyGroup)
    })
  }

  function renderAttackEffect(state: GameState) {
    const currentTime = Date.now()
    const timeSinceAttack = currentTime - state.player.lastAttackTime
    
    if (timeSinceAttack < ATTACK_EFFECT_DURATION) {
      const effect = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      effect.setAttribute('cx', String(state.player.position.x))
      effect.setAttribute('cy', String(state.player.position.y))
      effect.setAttribute('r', String(30 + (timeSinceAttack / 10)))
      effect.setAttribute('fill', 'none')
      effect.setAttribute('stroke', '#ffaa00')
      effect.setAttribute('stroke-width', '2')
      effect.setAttribute('opacity', String(1 - timeSinceAttack / ATTACK_EFFECT_DURATION))
      gameArea.appendChild(effect)
    }
  }

  function updateUI(state: GameState) {
    const expPercent = Math.floor((state.player.experience / state.player.experienceToNext) * 100)
    
    uiLayer.innerHTML = `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <span>Lv:</span> <span style="color: #ffdd44; font-size: 18px;">${state.player.level}</span>
        </div>
        <div style="margin-top: 4px;">
          <div style="background: #333; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #4ecdc4, #44ff88); height: 100%; width: ${expPercent}%; transition: width 0.3s;"></div>
          </div>
          <div style="font-size: 11px; color: #aaa; margin-top: 2px;">EXP: ${state.player.experience}/${state.player.experienceToNext}</div>
        </div>
      </div>
      <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
        <span>HP:</span> <span style="color: #44ff44;">${state.player.hp}/${state.player.maxHp}</span>
      </div>
      <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
        <span>Score:</span> <span style="color: #ffaa44;">${state.score}</span>
      </div>
      <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
        <span>Wave:</span> <span style="color: #44aaff;">${state.wave}</span>
      </div>
      <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
        <span>Enemies:</span> <span style="color: #ff4444;">${state.enemies.length}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Points:</span> <span style="color: #ff88ff;">${state.player.passivePoints}</span>
      </div>
      ${state.paused ? '<div style="color: #ff4444; font-size: 20px; margin-top: 15px; text-align: center; animation: pulse 1s infinite;">GAME OVER</div>' : ''}
    `
  }

  return {
    render: (state: GameState) => {
      gameArea.innerHTML = ''
      renderPlayer(state)
      renderEnemies(state)
      renderAttackEffect(state)
      updateUI(state)
    },
    
    getSVG: () => svg,
    
    destroy: () => {
      wrapper.remove()
    }
  }
}