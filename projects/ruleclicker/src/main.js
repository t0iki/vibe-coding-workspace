import { Game } from './game/Game.js';
import { UI } from './ui/UI.js';
import { loadContent } from './core/ContentLoader.js';

async function init() {
    try {
        // Load game content
        const content = await loadContent();
        
        // Initialize game
        const game = new Game(content);
        
        // Initialize UI
        const ui = new UI(game);
        
        // Start game loop
        game.start();
        
        console.log('RuleClicker started!');
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}