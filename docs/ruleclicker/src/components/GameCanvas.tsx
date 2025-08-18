import { useRef, useEffect } from 'react'
import type { GameState, Enemy } from '../domain/types'
import { PLAYER_RADIUS, ENEMY_RADIUS, ATTACK_EFFECT_DURATION } from '../domain/constants'
import { getElementColor, getEffectType } from '../domain/stats'
import { findChainTargets } from '../game/combat'

interface GameCanvasProps {
  gameState: GameState
  onMouseDown: () => void
  onMouseUp: () => void
}

export function GameCanvas({ gameState, onMouseDown, onMouseUp }: GameCanvasProps) {
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
    
    // ビームエフェクトは長押し中は常に表示
    const effectType = getEffectType(gameState)
    if (effectType === 'beam' && gameState.player.isHoldingAttack) {
      const elem = gameState.runeBuild?.activeRune?.base.elem || 'phys'
      const color = getElementColor(elem)
      
      // サポートルーンによる連鎖数を計算
      let chainCount = 1
      if (gameState.runeBuild?.supportRunes) {
        gameState.runeBuild.supportRunes.forEach(support => {
          if (support.effect.chains) {
            chainCount += support.effect.chains
          }
        })
      }
      
      const chainTargets = findChainTargets(gameState, chainCount)
      if (chainTargets.length > 0) {
        drawChainedBeam(svg, gameState.player.position, chainTargets, color, timeSinceAttack)
      }
    } else if (timeSinceAttack < ATTACK_EFFECT_DURATION) {
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



  function drawChainedBeam(
    svg: SVGSVGElement,
    startPos: { x: number, y: number },
    targets: Enemy[],
    color: string,
    timeSinceAttack: number
  ) {
    if (targets.length === 0) return
    
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    let currentPos = startPos
    
    // 各ターゲットに向けてビームを描画
    targets.forEach((target, index) => {
      const targetPos = target.position
      
      // 角度を計算
      const dx = targetPos.x - currentPos.x
      const dy = targetPos.y - currentPos.y
      const angle = Math.atan2(dy, dx) * 180 / Math.PI - 90
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // グラデーション定義（各ビームごとに固有のID）
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
      const gradientId = `beamGradient_${Date.now()}_${index}`
      gradient.setAttribute('id', gradientId)
      gradient.setAttribute('x1', '0%')
      gradient.setAttribute('y1', '0%')
      gradient.setAttribute('x2', '0%')
      gradient.setAttribute('y2', '100%')
      
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop1.setAttribute('offset', '0%')
      stop1.setAttribute('stop-color', color)
      stop1.setAttribute('stop-opacity', '0.2')
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop2.setAttribute('offset', '30%')
      stop2.setAttribute('stop-color', color)
      stop2.setAttribute('stop-opacity', String(1 - index * 0.2)) // 連鎖するごとに薄くなる
      
      const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop3.setAttribute('offset', '70%')
      stop3.setAttribute('stop-color', color)
      stop3.setAttribute('stop-opacity', String(1 - index * 0.2))
      
      const stop4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop4.setAttribute('offset', '100%')
      stop4.setAttribute('stop-color', color)
      stop4.setAttribute('stop-opacity', '0.2')
      
      gradient.appendChild(stop1)
      gradient.appendChild(stop2)
      gradient.appendChild(stop3)
      gradient.appendChild(stop4)
      defs.appendChild(gradient)
      svg.appendChild(defs)
      
      // メインビーム（連鎖するごとに細くなる）
      const beamWidth = (15 - index * 3) + Math.sin(timeSinceAttack / 50) * 2
      const mainBeam = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      mainBeam.setAttribute('x', String(-beamWidth / 2))
      mainBeam.setAttribute('y', '0')
      mainBeam.setAttribute('width', String(beamWidth))
      mainBeam.setAttribute('height', String(distance))
      mainBeam.setAttribute('fill', `url(#${gradientId})`)
      mainBeam.setAttribute('transform', `translate(${currentPos.x}, ${currentPos.y}) rotate(${angle})`)
      
      // コアビーム
      const coreWidth = beamWidth * 0.4
      const coreBeam = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      coreBeam.setAttribute('x', String(-coreWidth / 2))
      coreBeam.setAttribute('y', '0')
      coreBeam.setAttribute('width', String(coreWidth))
      coreBeam.setAttribute('height', String(distance))
      coreBeam.setAttribute('fill', '#ffffff')
      coreBeam.setAttribute('opacity', String(0.8 - index * 0.2))
      coreBeam.setAttribute('transform', `translate(${currentPos.x}, ${currentPos.y}) rotate(${angle})`)
      
      // グロー効果
      const glowWidth = beamWidth * 2
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      glow.setAttribute('x', String(-glowWidth / 2))
      glow.setAttribute('y', '0')
      glow.setAttribute('width', String(glowWidth))
      glow.setAttribute('height', String(distance))
      glow.setAttribute('fill', color)
      glow.setAttribute('opacity', String(0.2 - index * 0.05))
      glow.setAttribute('filter', 'blur(8px)')
      glow.setAttribute('transform', `translate(${currentPos.x}, ${currentPos.y}) rotate(${angle})`)
      
      // インパクトエフェクト
      const impact = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      impact.setAttribute('cx', String(targetPos.x))
      impact.setAttribute('cy', String(targetPos.y))
      impact.setAttribute('r', String((10 - index * 2) + Math.sin(timeSinceAttack / 30) * 3))
      impact.setAttribute('fill', color)
      impact.setAttribute('opacity', String(0.5 - index * 0.1))
      
      group.appendChild(glow)
      group.appendChild(mainBeam)
      group.appendChild(coreBeam)
      group.appendChild(impact)
      
      // 次のビームの開始位置を更新
      currentPos = targetPos
    })
    
    svg.appendChild(group)
  }

  // 単体ビーム用（将来的に使用可能）
  // @ts-expect-error: Preserved for future use
  const _drawBeamToTarget = (
    svg: SVGSVGElement,
    playerPos: { x: number, y: number },
    targetPos: { x: number, y: number },
    color: string,
    timeSinceAttack: number
  ) => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    
    // 角度を計算（ビームは敵の方向に向ける）
    const dx = targetPos.x - playerPos.x
    const dy = targetPos.y - playerPos.y
    const angle = Math.atan2(dy, dx) * 180 / Math.PI - 90
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // グラデーション定義
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
    const gradientId = `beamGradient_${Date.now()}`
    gradient.setAttribute('id', gradientId)
    gradient.setAttribute('x1', '0%')
    gradient.setAttribute('y1', '0%')
    gradient.setAttribute('x2', '0%')
    gradient.setAttribute('y2', '100%')
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop1.setAttribute('offset', '0%')
    stop1.setAttribute('stop-color', color)
    stop1.setAttribute('stop-opacity', '0.2')
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop2.setAttribute('offset', '30%')
    stop2.setAttribute('stop-color', color)
    stop2.setAttribute('stop-opacity', '1')
    
    const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop3.setAttribute('offset', '70%')
    stop3.setAttribute('stop-color', color)
    stop3.setAttribute('stop-opacity', '1')
    
    const stop4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
    stop4.setAttribute('offset', '100%')
    stop4.setAttribute('stop-color', color)
    stop4.setAttribute('stop-opacity', '0.2')
    
    gradient.appendChild(stop1)
    gradient.appendChild(stop2)
    gradient.appendChild(stop3)
    gradient.appendChild(stop4)
    defs.appendChild(gradient)
    svg.appendChild(defs)
    
    // メインビーム
    const beamWidth = 15 + Math.sin(timeSinceAttack / 50) * 3
    const mainBeam = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    mainBeam.setAttribute('x', String(-beamWidth / 2))
    mainBeam.setAttribute('y', '0')
    mainBeam.setAttribute('width', String(beamWidth))
    mainBeam.setAttribute('height', String(distance))
    mainBeam.setAttribute('fill', `url(#${gradientId})`)
    mainBeam.setAttribute('transform', `translate(${playerPos.x}, ${playerPos.y}) rotate(${angle})`)
    
    // コアビーム
    const coreWidth = beamWidth * 0.4
    const coreBeam = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    coreBeam.setAttribute('x', String(-coreWidth / 2))
    coreBeam.setAttribute('y', '0')
    coreBeam.setAttribute('width', String(coreWidth))
    coreBeam.setAttribute('height', String(distance))
    coreBeam.setAttribute('fill', '#ffffff')
    coreBeam.setAttribute('opacity', '0.8')
    coreBeam.setAttribute('transform', `translate(${playerPos.x}, ${playerPos.y}) rotate(${angle})`)
    
    // グロー効果
    const glowWidth = beamWidth * 2
    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    glow.setAttribute('x', String(-glowWidth / 2))
    glow.setAttribute('y', '0')
    glow.setAttribute('width', String(glowWidth))
    glow.setAttribute('height', String(distance))
    glow.setAttribute('fill', color)
    glow.setAttribute('opacity', '0.2')
    glow.setAttribute('filter', 'blur(8px)')
    glow.setAttribute('transform', `translate(${playerPos.x}, ${playerPos.y}) rotate(${angle})`)
    
    // インパクトエフェクト
    const impact = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    impact.setAttribute('cx', String(targetPos.x))
    impact.setAttribute('cy', String(targetPos.y))
    impact.setAttribute('r', String(10 + Math.sin(timeSinceAttack / 30) * 5))
    impact.setAttribute('fill', color)
    impact.setAttribute('opacity', '0.5')
    
    group.appendChild(glow)
    group.appendChild(mainBeam)
    group.appendChild(coreBeam)
    group.appendChild(impact)
    
    svg.appendChild(group)
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
        // 光束ビーム - レーザービームエフェクト
        const beamGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        
        // グラデーション定義
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
        gradient.setAttribute('id', 'beamGradient')
        gradient.setAttribute('x1', '0%')
        gradient.setAttribute('y1', '0%')
        gradient.setAttribute('x2', '0%')
        gradient.setAttribute('y2', '100%')
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop1.setAttribute('offset', '0%')
        stop1.setAttribute('stop-color', color)
        stop1.setAttribute('stop-opacity', '0')
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop2.setAttribute('offset', '20%')
        stop2.setAttribute('stop-color', color)
        stop2.setAttribute('stop-opacity', '1')
        
        const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop3.setAttribute('offset', '80%')
        stop3.setAttribute('stop-color', color)
        stop3.setAttribute('stop-opacity', '1')
        
        const stop4 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop4.setAttribute('offset', '100%')
        stop4.setAttribute('stop-color', color)
        stop4.setAttribute('stop-opacity', '0')
        
        gradient.appendChild(stop1)
        gradient.appendChild(stop2)
        gradient.appendChild(stop3)
        gradient.appendChild(stop4)
        defs.appendChild(gradient)
        svg.appendChild(defs)
        
        // メインビーム
        const mainBeam = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        const beamWidth = 20 + Math.sin(timeSinceAttack / 50) * 5
        mainBeam.setAttribute('x', String(position.x - beamWidth / 2))
        mainBeam.setAttribute('y', String(position.y - 300))
        mainBeam.setAttribute('width', String(beamWidth))
        mainBeam.setAttribute('height', '300')
        mainBeam.setAttribute('fill', 'url(#beamGradient)')
        
        // 中心の明るいコア
        const coreBeam = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        const coreWidth = beamWidth * 0.4
        coreBeam.setAttribute('x', String(position.x - coreWidth / 2))
        coreBeam.setAttribute('y', String(position.y - 300))
        coreBeam.setAttribute('width', String(coreWidth))
        coreBeam.setAttribute('height', '300')
        coreBeam.setAttribute('fill', '#ffffff')
        coreBeam.setAttribute('opacity', '0.8')
        
        // グロー効果
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        const glowWidth = beamWidth * 2
        glow.setAttribute('x', String(position.x - glowWidth / 2))
        glow.setAttribute('y', String(position.y - 300))
        glow.setAttribute('width', String(glowWidth))
        glow.setAttribute('height', '300')
        glow.setAttribute('fill', color)
        glow.setAttribute('opacity', '0.3')
        glow.setAttribute('filter', 'blur(10px)')
        
        // パーティクル効果
        for (let i = 0; i < 5; i++) {
          const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          const yPos = position.y - 50 - (timeSinceAttack * 2 + i * 40) % 300
          particle.setAttribute('cx', String(position.x + (Math.random() - 0.5) * beamWidth))
          particle.setAttribute('cy', String(yPos))
          particle.setAttribute('r', String(2 + Math.random() * 2))
          particle.setAttribute('fill', color)
          particle.setAttribute('opacity', String(0.6 + Math.random() * 0.4))
          beamGroup.appendChild(particle)
        }
        
        beamGroup.appendChild(glow)
        beamGroup.appendChild(mainBeam)
        beamGroup.appendChild(coreBeam)
        group.appendChild(beamGroup)
        break
      }
      
      case 'chain': {
        // 連鎖雷弾 - ジグザグの電撃
        // サポートルーンによる連鎖数を計算
        let chainCount = 1
        if (gameState.runeBuild?.supportRunes) {
          gameState.runeBuild.supportRunes.forEach(support => {
            if (support.effect.chains) {
              chainCount += support.effect.chains
            }
          })
        }
        
        const chainTargets = findChainTargets(gameState, chainCount)
        if (chainTargets.length > 0) {
          let currentPos = position
          chainTargets.forEach((target, index) => {
            const targetPos = target.position
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
            
            // ジグザグパスを生成
            const midX = (currentPos.x + targetPos.x) / 2
            const midY = (currentPos.y + targetPos.y) / 2
            const offsetX = (Math.random() - 0.5) * 30
            const offsetY = (Math.random() - 0.5) * 30
            
            const zigzag = `M ${currentPos.x} ${currentPos.y} L ${midX + offsetX} ${midY + offsetY} L ${targetPos.x} ${targetPos.y}`
            path.setAttribute('d', zigzag)
            path.setAttribute('stroke', color)
            path.setAttribute('stroke-width', String(3 - index * 0.5))
            path.setAttribute('fill', 'none')
            path.setAttribute('opacity', String(1 - index * 0.2))
            group.appendChild(path)
            
            // インパクトエフェクト
            const impact = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
            impact.setAttribute('cx', String(targetPos.x))
            impact.setAttribute('cy', String(targetPos.y))
            impact.setAttribute('r', String(5 + Math.random() * 5))
            impact.setAttribute('fill', color)
            impact.setAttribute('opacity', String(0.6 - index * 0.1))
            group.appendChild(impact)
            
            currentPos = targetPos
          })
        }
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
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
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