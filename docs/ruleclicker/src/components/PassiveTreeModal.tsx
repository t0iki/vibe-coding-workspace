import { useRef, useEffect, useState, type WheelEvent, type MouseEvent } from 'react'
import type { PassiveTree, PassiveNode } from '../domain/passive'
import { canAllocateNode } from '../domain/passive'

interface PassiveTreeModalProps {
  tree: PassiveTree
  availablePoints: number
  onAllocateNode: (nodeId: string) => void
  onClose: () => void
}

export function PassiveTreeModal({ 
  tree, 
  availablePoints, 
  onAllocateNode, 
  onClose 
}: PassiveTreeModalProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredNode, setHoveredNode] = useState<PassiveNode | null>(null)
  const [viewBox, setViewBox] = useState({ x: -400, y: -300, width: 800, height: 600 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!svgRef.current) return
    renderTree()
  }, [tree, availablePoints])

  function renderTree() {
    if (!svgRef.current) return
    const svg = svgRef.current
    svg.innerHTML = ''

    // Draw links
    const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    tree.nodes.forEach(node => {
      if (node.links) {
        node.links.forEach(targetId => {
          const targetNode = tree.nodes.find(n => n.id === targetId)
          if (!targetNode) return

          const isActive = tree.allocatedNodes.has(node.id) && tree.allocatedNodes.has(targetId)
          
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          line.setAttribute('x1', String(node.pos.x))
          line.setAttribute('y1', String(node.pos.y))
          line.setAttribute('x2', String(targetNode.pos.x))
          line.setAttribute('y2', String(targetNode.pos.y))
          line.setAttribute('stroke', isActive ? '#4ecdc4' : '#444')
          line.setAttribute('stroke-width', isActive ? '3' : '2')
          line.setAttribute('opacity', isActive ? '0.8' : '0.3')
          
          linksGroup.appendChild(line)
        })
      }
    })
    svg.appendChild(linksGroup)

    // Draw nodes
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    tree.nodes.forEach(node => {
      const isAllocated = tree.allocatedNodes.has(node.id)
      const canAllocate = !isAllocated && canAllocateNode(tree, node.id) && availablePoints >= node.cost

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      group.style.cursor = canAllocate ? 'pointer' : 'default'

      // Determine node size and color
      let radius = 15
      let fillColor = '#333'
      let strokeColor = '#666'
      let strokeWidth = 2

      if (node.kind === 'notable') {
        radius = 25
      } else if (node.kind === 'cornerstone') {
        radius = 35
      }

      if (isAllocated) {
        fillColor = node.kind === 'cornerstone' ? '#ff6b6b' : 
                    node.kind === 'notable' ? '#4ecdc4' : '#66bb6a'
        strokeColor = '#fff'
        strokeWidth = 3
      } else if (canAllocate) {
        fillColor = '#555'
        strokeColor = '#4ecdc4'
        strokeWidth = 2
      }

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', String(node.pos.x))
      circle.setAttribute('cy', String(node.pos.y))
      circle.setAttribute('r', String(radius))
      circle.setAttribute('fill', fillColor)
      circle.setAttribute('stroke', strokeColor)
      circle.setAttribute('stroke-width', String(strokeWidth))

      // Event handlers
      circle.addEventListener('mouseenter', () => setHoveredNode(node))
      circle.addEventListener('mouseleave', () => setHoveredNode(null))
      
      if (canAllocate) {
        circle.addEventListener('click', () => onAllocateNode(node.id))
      }

      group.appendChild(circle)
      nodesGroup.appendChild(group)
    })
    svg.appendChild(nodesGroup)
  }

  // Pan and zoom handlers
  const handleWheel = (e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const scale = e.deltaY > 0 ? 1.1 : 0.9
    setViewBox(prev => ({
      ...prev,
      width: prev.width * scale,
      height: prev.height * scale
    }))
  }

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!isPanning) return
    
    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y
    
    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx * (prev.width / 800),
      y: prev.y - dy * (prev.height / 600)
    }))
    
    setPanStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  return (
    <div className="passive-tree-modal">
      <div className="modal-header">
        <h2>Passive Tree</h2>
        <div className="points-display">
          Available Points: <span className="points-value">{availablePoints}</span>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="modal-body">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        />

        {hoveredNode && (
          <div className="node-tooltip" style={{
            position: 'absolute',
            left: '10px',
            top: '60px',
            background: 'rgba(34, 34, 34, 0.95)',
            padding: '12px',
            border: '2px solid #666',
            borderRadius: '6px',
            minWidth: '220px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            zIndex: 1000
          }}>
            <div className="tooltip-title" style={{
              fontWeight: 'bold',
              marginBottom: '8px',
              fontSize: '14px',
              color: hoveredNode.kind === 'cornerstone' ? '#ff6' : hoveredNode.kind === 'notable' ? '#6cf' : '#fff'
            }}>
              {hoveredNode.desc || hoveredNode.id}
            </div>
            {hoveredNode.grants && (
              <div className="tooltip-stats">
                {Object.entries(hoveredNode.grants).map(([stat, value]) => {
                  const statDisplayNames: Record<string, string> = {
                    'damage_pct': 'ダメージ増加',
                    'phys_dmg_pct': '物理ダメージ増加',
                    'spell_dmg_pct': 'スペルダメージ増加',
                    'proj_dmg_pct': '投射物ダメージ増加',
                    'attack_speed_pct': '攻撃速度',
                    'crit_chance': 'クリティカル率',
                    'crit_multi': 'クリティカル倍率',
                    'max_life_pct': '最大ライフ',
                    'armor_pct': 'アーマー',
                    'evasion_pct': '回避率',
                    'res_all_pct': '全耐性'
                  }
                  const displayName = statDisplayNames[stat] || stat
                  return (
                    <div key={stat} className="stat-line" style={{
                      fontSize: '12px',
                      margin: '2px 0',
                      color: value > 0 ? '#8f8' : '#f88'
                    }}>
                      {displayName}: {value > 0 ? '+' : ''}{value}%
                    </div>
                  )
                })}
              </div>
            )}
            <div className="tooltip-cost" style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #444',
              fontSize: '11px',
              color: '#aaf'
            }}>
              コスト: {hoveredNode.cost} ポイント
            </div>
            {hoveredNode.kind === 'cornerstone' && (
              <div style={{
                marginTop: '5px',
                fontSize: '11px',
                color: '#fa6',
                fontStyle: 'italic'
              }}>
                ⚠️ コーナーストーン - 強力だが制限あり
              </div>
            )}
          </div>
        )}
      </div>

      <div className="modal-footer">
        <div className="controls-hint">
          Scroll to zoom • Drag to pan • Click nodes to allocate
        </div>
      </div>
    </div>
  )
}