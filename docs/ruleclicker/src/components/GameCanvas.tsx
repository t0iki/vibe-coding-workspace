import { useRef, useEffect } from 'react'
import type { GameState } from '../domain/types'
import { PLAYER_RADIUS, ENEMY_RADIUS, ATTACK_EFFECT_DURATION } from '../domain/constants'
import { getElementColor, getEffectType } from '../domain/stats'

interface GameCanvasProps {
  gameState: GameState
  onClick: () => void
}

export function GameCanvas({ gameState, onClick }: GameCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = svgRef.current
    svg.innerHTML = ''

    // Draw links (for future passive tree integration)
    // ...

    // Draw player
    const playerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    
    const playerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    playerCircle.setAttribute('cx', String(gameState.player.position.x))
    playerCircle.setAttribute('cy', String(gameState.player.position.y))
    playerCircle.setAttribute('r', String(PLAYER_RADIUS))
    playerCircle.setAttribute('fill', '#4488ff')
    playerCircle.setAttribute('stroke', '#66aaff')
    playerCircle.setAttribute('stroke-width', '2')
    
    const playerHealthBar = createHealthBar(
      gameState.player.position.x - 25,
      gameState.player.position.y - 35,
      50,
      6,
      gameState.player.hp,
      gameState.player.maxHp,
      '#44ff44'
    )
    
    playerGroup.appendChild(playerCircle)
    playerGroup.appendChild(playerHealthBar)
    svg.appendChild(playerGroup)

    // Draw enemies
    gameState.enemies.forEach(enemy => {
      const enemyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      
      const enemyCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      enemyCircle.setAttribute('cx', String(enemy.position.x))
      enemyCircle.setAttribute('cy', String(enemy.position.y))
      enemyCircle.setAttribute('r', String(ENEMY_RADIUS))
      enemyCircle.setAttribute('fill', enemy.color)
      enemyCircle.setAttribute('stroke', '#ffffff')
      enemyCircle.setAttribute('stroke-width', '1')
      enemyCircle.setAttribute('opacity', '0.9')
      
      const enemyHealthBar = createHealthBar(
        enemy.position.x - 20,
        enemy.position.y - 25,
        40,
        4,
        enemy.hp,
        enemy.maxHp,
        '#ff4444'
      )
      
      // Level indicator
      const levelText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      levelText.setAttribute('x', String(enemy.position.x))
      levelText.setAttribute('y', String(enemy.position.y + 5))
      levelText.setAttribute('text-anchor', 'middle')
      levelText.setAttribute('fill', 'white')
      levelText.setAttribute('font-size', '12')
      levelText.setAttribute('font-weight', 'bold')
      levelText.textContent = String(enemy.level)
      
      enemyGroup.appendChild(enemyCircle)
      enemyGroup.appendChild(enemyHealthBar)
      enemyGroup.appendChild(levelText)
      svg.appendChild(enemyGroup)
    })

    // Draw attack effect based on rune type
    const currentTime = Date.now()
    const timeSinceAttack = currentTime - gameState.player.lastAttackTime
    
    if (timeSinceAttack < ATTACK_EFFECT_DURATION) {
      const effectType = getEffectType(gameState)
      const elem = gameState.runeBuild?.activeRune?.base.elem || 'phys'
      const color = getElementColor(elem)
      const opacity = 1 - timeSinceAttack / ATTACK_EFFECT_DURATION
      
      drawRuneEffect(svg, effectType, gameState.player.position, color, opacity, timeSinceAttack)
    }
  }, [gameState])

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

  function drawRuneEffect(
    svg: SVGSVGElement,
    effectType: string,
    position: { x: number, y: number },
    color: string,
    opacity: number,
    timeSinceAttack: number
  ) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.setAttribute('opacity', String(opacity))
    
    switch (effectType) {
      case 'beam': {
        // 光束ビーム - 直線的なビーム
        const beam = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        beam.setAttribute('x', String(position.x))
        beam.setAttribute('y', String(position.y - 100))
        beam.setAttribute('width', String(5 + timeSinceAttack / 50))
        beam.setAttribute('height', '200')
        beam.setAttribute('fill', color)
        beam.setAttribute('transform', `rotate(${timeSinceAttack / 5}, ${position.x}, ${position.y})`)
        group.appendChild(beam)
        break
      }
      
      case 'chain': {
        // 連鎖雷弾 - ジグザグの電撃
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        const zigzag = `M ${position.x} ${position.y} L ${position.x + 50} ${position.y - 20} L ${position.x + 80} ${position.y + 10} L ${position.x + 120} ${position.y - 30}`
        path.setAttribute('d', zigzag)
        path.setAttribute('stroke', color)
        path.setAttribute('stroke-width', '3')
        path.setAttribute('fill', 'none')
        group.appendChild(path)
        break
      }
      
      case 'rain': {
        // 毒雨 - 降る粒子
        for (let i = 0; i < 8; i++) {
          const drop = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          drop.setAttribute('cx', String(position.x + (Math.random() - 0.5) * 100))
          drop.setAttribute('cy', String(position.y - 50 + timeSinceAttack / 5 + i * 10))
          drop.setAttribute('r', '3')
          drop.setAttribute('fill', color)
          group.appendChild(drop)
        }
        break
      }
      
      case 'explosion': {
        // 灼熱爆 - 爆発円
        const explosion = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        explosion.setAttribute('cx', String(position.x))
        explosion.setAttribute('cy', String(position.y))
        explosion.setAttribute('r', String(20 + timeSinceAttack / 5))
        explosion.setAttribute('fill', color)
        explosion.setAttribute('fill-opacity', '0.3')
        explosion.setAttribute('stroke', color)
        explosion.setAttribute('stroke-width', '2')
        group.appendChild(explosion)
        break
      }
      
      case 'nova': {
        // 寒冷ノヴァ - 氷結リング
        const nova = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        nova.setAttribute('cx', String(position.x))
        nova.setAttribute('cy', String(position.y))
        nova.setAttribute('r', String(30 + timeSinceAttack / 3))
        nova.setAttribute('fill', 'none')
        nova.setAttribute('stroke', color)
        nova.setAttribute('stroke-width', String(5 - timeSinceAttack / 100))
        group.appendChild(nova)
        break
      }
      
      default: {
        // デフォルト - 基本的な円形エフェクト
        const effect = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        effect.setAttribute('cx', String(position.x))
        effect.setAttribute('cy', String(position.y))
        effect.setAttribute('r', String(30 + timeSinceAttack / 10))
        effect.setAttribute('fill', 'none')
        effect.setAttribute('stroke', color)
        effect.setAttribute('stroke-width', '2')
        group.appendChild(effect)
      }
    }
    
    svg.appendChild(group)
  }

  return (
    <div id="game-canvas">
      <svg
        ref={svgRef}
        width="800"
        height="600"
        onClick={onClick}
        style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #16213e',
          borderRadius: '8px',
          cursor: 'crosshair'
        }}
      />
    </div>
  )
}