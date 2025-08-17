import { createRoot } from 'react-dom/client'
import { App } from './App'
import './App.css'

const container = document.getElementById('app')
if (!container) throw new Error('App container not found')

const root = createRoot(container)
root.render(<App />)
