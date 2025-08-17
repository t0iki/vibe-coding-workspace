export type PassiveNodeKind = 'small' | 'notable' | 'cornerstone'

export interface PassiveNode {
  id: string
  kind: PassiveNodeKind
  grants?: Record<string, number>
  desc?: string
  cost: number
  pos: {
    x: number
    y: number
  }
  requires?: string[]
  links?: string[]
}

export interface PassiveTree {
  nodes: PassiveNode[]
  allocatedNodes: Set<string>
  startingClass: 'str' | 'dex' | 'int'
}

export function createPassiveTree(startingClass: 'str' | 'dex' | 'int' = 'str'): PassiveTree {
  return {
    nodes: [],
    allocatedNodes: new Set([`start_${startingClass}`]),
    startingClass
  }
}

export function canAllocateNode(tree: PassiveTree, nodeId: string): boolean {
  const node = tree.nodes.find(n => n.id === nodeId)
  if (!node) return false
  
  // すでに割り当て済み
  if (tree.allocatedNodes.has(nodeId)) return false
  
  // コストが0（開始点）は自動的に割り当て済み
  if (node.cost === 0) return false
  
  // 前提ノードが必要な場合
  if (node.requires && node.requires.length > 0) {
    return node.requires.some(reqId => tree.allocatedNodes.has(reqId))
  }
  
  // リンクから到達可能か確認
  for (const allocatedId of tree.allocatedNodes) {
    const allocatedNode = tree.nodes.find(n => n.id === allocatedId)
    if (allocatedNode?.links?.includes(nodeId)) {
      return true
    }
  }
  
  return false
}

export function allocateNode(tree: PassiveTree, nodeId: string): PassiveTree {
  if (!canAllocateNode(tree, nodeId)) return tree
  
  return {
    ...tree,
    allocatedNodes: new Set([...tree.allocatedNodes, nodeId])
  }
}

export function deallocateNode(tree: PassiveTree, nodeId: string): PassiveTree {
  // 開始点は解除できない
  if (nodeId.startsWith('start_')) return tree
  
  // 他のノードの前提条件になっていないか確認
  const dependentNodes = tree.nodes.filter(node => 
    node.requires?.includes(nodeId) && tree.allocatedNodes.has(node.id)
  )
  
  if (dependentNodes.length > 0) return tree
  
  const newAllocated = new Set(tree.allocatedNodes)
  newAllocated.delete(nodeId)
  
  return {
    ...tree,
    allocatedNodes: newAllocated
  }
}

export function calculatePassiveStats(tree: PassiveTree): Record<string, number> {
  const stats: Record<string, number> = {}
  
  for (const nodeId of tree.allocatedNodes) {
    const node = tree.nodes.find(n => n.id === nodeId)
    if (node?.grants) {
      for (const [stat, value] of Object.entries(node.grants)) {
        stats[stat] = (stats[stat] || 0) + value
      }
    }
  }
  
  return stats
}

export function getUsedPassivePoints(tree: PassiveTree): number {
  let total = 0
  for (const nodeId of tree.allocatedNodes) {
    const node = tree.nodes.find(n => n.id === nodeId)
    if (node) {
      total += node.cost
    }
  }
  return total
}