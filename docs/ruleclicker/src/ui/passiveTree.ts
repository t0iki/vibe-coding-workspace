import type { PassiveTree, PassiveNode } from '../domain/passive'

export interface PassiveTreeUI {
  render: (tree: PassiveTree, availablePoints: number) => void
  onNodeClick: (callback: (nodeId: string) => void) => void
  destroy: () => void
}

export function createPassiveTreeUI(container: HTMLElement): PassiveTreeUI {
  const wrapper = document.createElement('div')
  wrapper.className = 'passive-tree-container'
  wrapper.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    height: 80%;
    max-width: 1200px;
    max-height: 800px;
    background: rgba(10, 10, 20, 0.95);
    border: 2px solid #444;
    border-radius: 10px;
    display: none;
    z-index: 1000;
    overflow: hidden;
  `
  
  const header = document.createElement('div')
  header.style.cssText = `
    padding: 15px;
    background: rgba(0, 0, 0, 0.5);
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  
  const title = document.createElement('h2')
  title.textContent = 'パッシブツリー'
  title.style.cssText = `
    margin: 0;
    color: #fff;
    font-size: 24px;
  `
  
  const pointsDisplay = document.createElement('div')
  pointsDisplay.style.cssText = `
    color: #4ecdc4;
    font-size: 18px;
    font-weight: bold;
  `
  
  const closeBtn = document.createElement('button')
  closeBtn.textContent = '×'
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: #fff;
    font-size: 30px;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
  `
  
  const svgContainer = document.createElement('div')
  svgContainer.style.cssText = `
    width: 100%;
    height: calc(100% - 70px);
    overflow: auto;
    position: relative;
  `
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '1600')
  svg.setAttribute('height', '1200')
  svg.style.cssText = `
    display: block;
    margin: auto;
  `
  
  header.appendChild(title)
  header.appendChild(pointsDisplay)
  header.appendChild(closeBtn)
  wrapper.appendChild(header)
  svgContainer.appendChild(svg)
  wrapper.appendChild(svgContainer)
  container.appendChild(wrapper)
  
  let nodeClickCallback: ((nodeId: string) => void) | null = null
  
  closeBtn.addEventListener('click', () => {
    wrapper.style.display = 'none'
  })
  
  function renderNode(node: PassiveNode, isAllocated: boolean, canAllocate: boolean) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.setAttribute('data-node-id', node.id)
    group.style.cursor = canAllocate ? 'pointer' : 'default'
    
    // ノードの位置を中央基準に調整
    const x = 800 + node.pos.x * 3
    const y = 600 + node.pos.y * 3
    
    // ノードサイズと色の決定
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
    
    // ノード円
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', String(x))
    circle.setAttribute('cy', String(y))
    circle.setAttribute('r', String(radius))
    circle.setAttribute('fill', fillColor)
    circle.setAttribute('stroke', strokeColor)
    circle.setAttribute('stroke-width', String(strokeWidth))
    
    // ホバーエフェクト
    if (canAllocate || isAllocated) {
      circle.addEventListener('mouseenter', () => {
        circle.setAttribute('filter', 'brightness(1.3)')
      })
      circle.addEventListener('mouseleave', () => {
        circle.removeAttribute('filter')
      })
    }
    
    // クリックイベント
    if (canAllocate) {
      circle.addEventListener('click', () => {
        nodeClickCallback?.(node.id)
      })
    }
    
    group.appendChild(circle)
    
    // ツールチップ用のタイトル
    if (node.desc || node.grants) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
      let tooltipText = node.desc || node.id
      if (node.grants) {
        tooltipText += '\n'
        for (const [stat, value] of Object.entries(node.grants)) {
          tooltipText += `\n${stat}: +${value}`
        }
      }
      title.textContent = tooltipText
      group.appendChild(title)
    }
    
    return group
  }
  
  function renderLinks(tree: PassiveTree) {
    const links = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    links.setAttribute('class', 'links')
    
    for (const node of tree.nodes) {
      if (node.links) {
        for (const targetId of node.links) {
          const targetNode = tree.nodes.find(n => n.id === targetId)
          if (!targetNode) continue
          
          const x1 = 800 + node.pos.x * 3
          const y1 = 600 + node.pos.y * 3
          const x2 = 800 + targetNode.pos.x * 3
          const y2 = 600 + targetNode.pos.y * 3
          
          const isActive = tree.allocatedNodes.has(node.id) && tree.allocatedNodes.has(targetId)
          
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
          line.setAttribute('x1', String(x1))
          line.setAttribute('y1', String(y1))
          line.setAttribute('x2', String(x2))
          line.setAttribute('y2', String(y2))
          line.setAttribute('stroke', isActive ? '#4ecdc4' : '#444')
          line.setAttribute('stroke-width', isActive ? '3' : '2')
          line.setAttribute('opacity', isActive ? '0.8' : '0.3')
          
          links.appendChild(line)
        }
      }
    }
    
    return links
  }
  
  return {
    render: (tree: PassiveTree, availablePoints: number) => {
      svg.innerHTML = ''
      pointsDisplay.textContent = `利用可能ポイント: ${availablePoints}`
      
      // リンクを先に描画
      svg.appendChild(renderLinks(tree))
      
      // ノードを描画
      const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      for (const node of tree.nodes) {
        const isAllocated = tree.allocatedNodes.has(node.id)
        const canAllocate = !isAllocated && availablePoints >= node.cost && 
                           (node.cost === 0 || canAllocateNode(tree, node))
        
        nodesGroup.appendChild(renderNode(node, isAllocated, canAllocate))
      }
      svg.appendChild(nodesGroup)
    },
    
    onNodeClick: (callback) => {
      nodeClickCallback = callback
    },
    
    destroy: () => {
      wrapper.remove()
    }
  }
}

function canAllocateNode(tree: PassiveTree, node: PassiveNode): boolean {
  if (node.requires && node.requires.length > 0) {
    return node.requires.some(reqId => tree.allocatedNodes.has(reqId))
  }
  
  for (const allocatedId of tree.allocatedNodes) {
    const allocatedNode = tree.nodes.find(n => n.id === allocatedId)
    if (allocatedNode?.links?.includes(node.id)) {
      return true
    }
  }
  
  return false
}

export function createPassiveTreeToggle(container: HTMLElement, treeUI: HTMLElement): HTMLButtonElement {
  const button = document.createElement('button')
  button.textContent = 'パッシブツリー (P)'
  button.className = 'control-btn'
  button.style.cssText = `
    margin-left: 10px;
  `
  
  button.addEventListener('click', () => {
    treeUI.style.display = treeUI.style.display === 'none' ? 'block' : 'none'
  })
  
  // キーボードショートカット
  document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      treeUI.style.display = treeUI.style.display === 'none' ? 'block' : 'none'
    }
  })
  
  container.appendChild(button)
  return button
}