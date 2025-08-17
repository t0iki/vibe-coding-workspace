export interface Controls {
  onPause: (callback: () => void) => void
  onResume: (callback: () => void) => void
  onReset: (callback: () => void) => void
  setPaused: (paused: boolean) => void
  destroy: () => void
}

export function createControls(container: HTMLElement): Controls {
  const controlsDiv = document.createElement('div')
  controlsDiv.className = 'controls'
  
  const pauseBtn = document.createElement('button')
  pauseBtn.id = 'pause-btn'
  pauseBtn.className = 'control-btn'
  pauseBtn.textContent = 'Pause'
  
  const resetBtn = document.createElement('button')
  resetBtn.id = 'reset-btn'
  resetBtn.className = 'control-btn'
  resetBtn.textContent = 'Reset'
  
  controlsDiv.appendChild(pauseBtn)
  controlsDiv.appendChild(resetBtn)
  container.appendChild(controlsDiv)

  let isPaused = false
  let pauseCallback: (() => void) | null = null
  let resumeCallback: (() => void) | null = null
  let resetCallback: (() => void) | null = null

  const handlePauseClick = () => {
    if (isPaused) {
      resumeCallback?.()
    } else {
      pauseCallback?.()
    }
  }

  const handleResetClick = () => {
    resetCallback?.()
  }

  pauseBtn.addEventListener('click', handlePauseClick)
  resetBtn.addEventListener('click', handleResetClick)

  return {
    onPause: (callback) => {
      pauseCallback = callback
    },
    
    onResume: (callback) => {
      resumeCallback = callback
    },
    
    onReset: (callback) => {
      resetCallback = callback
    },
    
    setPaused: (paused) => {
      isPaused = paused
      pauseBtn.textContent = paused ? 'Resume' : 'Pause'
    },
    
    destroy: () => {
      pauseBtn.removeEventListener('click', handlePauseClick)
      resetBtn.removeEventListener('click', handleResetClick)
      controlsDiv.remove()
    }
  }
}