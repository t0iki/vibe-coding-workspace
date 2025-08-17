import React from 'react'
import type { GameState } from '../domain/types'

interface GameUIProps {
  gameState: GameState
  availablePoints: number
}

export function GameUI({ gameState, availablePoints }: GameUIProps) {
  const expPercent = Math.floor((gameState.player.experience / gameState.player.experienceToNext) * 100)

  return (
    <div className="game-ui">
      <div className="stat-panel">
        <div className="stat-group">
          <div className="level-display">
            <span className="label">Lv</span>
            <span className="value level">{gameState.player.level}</span>
          </div>
          <div className="exp-bar">
            <div className="exp-fill" style={{ width: `${expPercent}%` }} />
            <div className="exp-text">
              {gameState.player.experience} / {gameState.player.experienceToNext} EXP
            </div>
          </div>
        </div>

        <div className="stat-row">
          <span className="label">HP</span>
          <span className="value health">
            {gameState.player.hp} / {gameState.player.maxHp}
          </span>
        </div>

        <div className="stat-row">
          <span className="label">Score</span>
          <span className="value score">{gameState.score}</span>
        </div>

        <div className="stat-row">
          <span className="label">Wave</span>
          <span className="value wave">{gameState.wave}</span>
        </div>

        <div className="stat-row">
          <span className="label">Enemies</span>
          <span className="value enemies">{gameState.enemies.length}</span>
        </div>

        <div className="stat-row">
          <span className="label">Points</span>
          <span className="value points">{availablePoints}</span>
        </div>

        {gameState.paused && (
          <div className="game-over">GAME OVER</div>
        )}
      </div>
    </div>
  )
}