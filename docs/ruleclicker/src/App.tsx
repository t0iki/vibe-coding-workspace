import { useState, useEffect, useCallback, useRef } from 'react'
import { GameCanvas } from './components/GameCanvas'
import { GameUI } from './components/GameUI'
import { PassiveTreeModal } from './components/PassiveTreeModal'
import { createGameEngine } from './game/engine'
import { createPassiveTree, allocateNode, getUsedPassivePoints } from './domain/passive'
import { loadPassiveTree } from './core/contentLoader'
import type { GameState } from './domain/types'
import type { PassiveTree } from './domain/passive'

export function App() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [passiveTree, setPassiveTree] = useState<PassiveTree>(createPassiveTree('str'))
  const [showPassiveTree, setShowPassiveTree] = useState(false)
  const engineRef = useRef<ReturnType<typeof createGameEngine> | null>(null)

  useEffect(() => {
    // Load passive tree data
    loadPassiveTree().then(nodes => {
      setPassiveTree(prev => ({ ...prev, nodes }))
    })

    // Create game engine
    const engine = createGameEngine((state) => {
      setGameState(state)
    })
    engineRef.current = engine
    engine.start()

    return () => {
      engine.stop()
    }
  }, [])

  const handlePause = useCallback(() => {
    engineRef.current?.pause()
  }, [])

  const handleResume = useCallback(() => {
    engineRef.current?.resume()
  }, [])

  const handleReset = useCallback(() => {
    window.location.reload()
  }, [])

  const handleCanvasClick = useCallback(() => {
    engineRef.current?.handleClick()
  }, [])

  const handleAllocateNode = useCallback((nodeId: string) => {
    if (!gameState) return
    
    const usedPoints = getUsedPassivePoints(passiveTree)
    const availablePoints = gameState.player.passivePoints
    
    if (availablePoints > usedPoints) {
      setPassiveTree(prev => allocateNode(prev, nodeId))
    }
  }, [gameState, passiveTree])

  const togglePassiveTree = useCallback(() => {
    setShowPassiveTree(prev => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        togglePassiveTree()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [togglePassiveTree])

  if (!gameState) {
    return <div className="loading">Loading...</div>
  }

  const availablePoints = gameState.player.passivePoints - getUsedPassivePoints(passiveTree)

  return (
    <div className="app">
      <div className="game-container">
        <h1>RUNECLICKER</h1>
        
        <div className="game-content">
          <GameCanvas 
            gameState={gameState}
            onClick={handleCanvasClick}
          />
          
          <GameUI 
            gameState={gameState}
            availablePoints={availablePoints}
          />
        </div>

        <div className="controls">
          <button 
            className="control-btn" 
            onClick={gameState.paused ? handleResume : handlePause}
          >
            {gameState.paused ? 'Resume' : 'Pause'}
          </button>
          <button className="control-btn" onClick={handleReset}>Reset</button>
          <button className="control-btn" onClick={togglePassiveTree}>
            Passive Tree (P)
          </button>
        </div>
      </div>

      {showPassiveTree && (
        <PassiveTreeModal
          tree={passiveTree}
          availablePoints={availablePoints}
          onAllocateNode={handleAllocateNode}
          onClose={togglePassiveTree}
        />
      )}
    </div>
  )
}