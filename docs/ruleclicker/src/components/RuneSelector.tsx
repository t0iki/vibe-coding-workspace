import { useState } from 'react'
import type { RuneActive, RuneSupport, RuneBuild } from '../domain/rune'
import { canLinkSupport, calculateRuneDPS, getSupportDescription } from '../domain/rune'
import runesActiveData from '../content/runes_active.json'
import runesSupportData from '../content/runes_support.json'
import './RuneSelector.css'

interface RuneSelectorProps {
  playerLevel: number
  currentBuild: RuneBuild
  onBuildChange: (build: RuneBuild) => void
}

export function RuneSelector({ playerLevel, currentBuild, onBuildChange }: RuneSelectorProps) {
  const [activeRunes] = useState<RuneActive[]>(runesActiveData as RuneActive[])
  const [supportRunes] = useState<RuneSupport[]>(runesSupportData as RuneSupport[])
  const [showSelector, setShowSelector] = useState(false)

  const availableActiveRunes = activeRunes.filter(rune => rune.levelReq <= playerLevel)
  const currentDPS = calculateRuneDPS(currentBuild)

  function selectActiveRune(rune: RuneActive) {
    const newBuild: RuneBuild = {
      ...currentBuild,
      activeRune: rune,
      supportRunes: [] // Reset supports when changing active
    }
    onBuildChange(newBuild)
  }

  function toggleSupportRune(support: RuneSupport) {
    if (!currentBuild.activeRune) return
    
    const canLink = canLinkSupport(currentBuild.activeRune, support)
    if (!canLink) return
    
    const currentIndex = currentBuild.supportRunes.findIndex(s => s.id === support.id)
    let newSupports: RuneSupport[]
    
    if (currentIndex >= 0) {
      // Remove if already selected
      newSupports = currentBuild.supportRunes.filter(s => s.id !== support.id)
    } else if (currentBuild.supportRunes.length < 3) {
      // Add if under limit
      newSupports = [...currentBuild.supportRunes, support]
    } else {
      return // Can't add more than 3
    }
    
    onBuildChange({
      ...currentBuild,
      supportRunes: newSupports
    })
  }

  return (
    <div className="rune-selector">
      <button 
        className="rune-toggle-btn"
        onClick={() => setShowSelector(!showSelector)}
      >
        ルーン設定 (R)
      </button>

      {showSelector && (
        <div className="rune-modal">
          <div className="modal-header">
            <h3>ルーン選択</h3>
            <span className="dps-display">DPS: {currentDPS}</span>
            <button className="close-btn" onClick={() => setShowSelector(false)}>×</button>
          </div>

          <div className="rune-content">
            <div className="active-runes-section">
              <h4>アクティブルーン</h4>
              <div className="rune-grid">
                {availableActiveRunes.map(rune => (
                  <div
                    key={rune.id}
                    className={`rune-card ${currentBuild.activeRune?.id === rune.id ? 'selected' : ''}`}
                    onClick={() => selectActiveRune(rune)}
                  >
                    <div className="rune-name">{rune.name}</div>
                    <div className="rune-stats">
                      <span className={`elem-${rune.base.elem}`}>
                        {rune.base.elem}
                      </span>
                      <span>DPS: {rune.base.dps}</span>
                    </div>
                    <div className="rune-tags">
                      {rune.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {currentBuild.activeRune && (
              <div className="support-runes-section">
                <h4>サポートルーン（リンク） - {currentBuild.supportRunes.length}/3</h4>
                <div className="rune-grid">
                  {supportRunes.map(support => {
                    const canLink = canLinkSupport(currentBuild.activeRune!, support)
                    const isSelected = currentBuild.supportRunes.some(s => s.id === support.id)
                    
                    return (
                      <div
                        key={support.id}
                        className={`rune-card support ${isSelected ? 'selected' : ''} ${!canLink ? 'disabled' : ''}`}
                        onClick={() => canLink && toggleSupportRune(support)}
                      >
                        <div className="rune-name">{support.name}</div>
                        <div className="rune-effect">
                          {getSupportDescription(support)}
                        </div>
                        {!canLink && (
                          <div className="incompatible">互換性なし</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="current-build">
              <h4>現在のビルド</h4>
              {currentBuild.activeRune ? (
                <div className="build-summary">
                  <div className="active-display">
                    {currentBuild.activeRune.name}
                  </div>
                  {currentBuild.supportRunes.length > 0 && (
                    <div className="support-display">
                      + {currentBuild.supportRunes.map(s => s.name).join(' + ')}
                    </div>
                  )}
                  <div className="dps-breakdown">
                    基礎DPS: {currentBuild.activeRune.base.dps} → {currentDPS}
                  </div>
                </div>
              ) : (
                <div className="no-build">ルーンを選択してください</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}