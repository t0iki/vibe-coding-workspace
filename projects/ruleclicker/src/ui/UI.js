export class UI {
    constructor(game) {
        this.game = game;
        this.elements = {};
        
        this.initElements();
        this.attachEventListeners();
        this.updateDisplay();
    }
    
    initElements() {
        this.elements = {
            clickButton: document.getElementById('click-button'),
            clickArea: document.getElementById('click-area'),
            enemyPack: document.getElementById('enemy-pack'),
            dps: document.getElementById('dps'),
            clickCount: document.getElementById('click-count'),
            killCount: document.getElementById('kill-count'),
            activeRunes: document.getElementById('active-runes'),
            supportRunes: document.getElementById('support-runes')
        };
    }
    
    attachEventListeners() {
        // Click button
        this.elements.clickButton.addEventListener('click', () => {
            this.game.click();
        });
        
        // Click on enemies
        this.elements.enemyPack.addEventListener('click', (e) => {
            if (e.target.closest('.enemy')) {
                this.game.click();
            }
        });
        
        // Game events
        window.addEventListener('gameUpdate', (e) => {
            this.updateStats(e.detail.stats);
        });
        
        window.addEventListener('enemyDamaged', (e) => {
            this.updateEnemy(e.detail.enemy);
            this.showDamageNumber(e.detail.enemy, e.detail.damage);
        });
        
        window.addEventListener('enemyKilled', (e) => {
            this.removeEnemy(e.detail.enemy);
        });
    }
    
    updateDisplay() {
        this.updateStats(this.game.stats);
        this.updateEnemies();
        this.updateRunes();
    }
    
    updateStats(stats) {
        this.elements.dps.textContent = stats.dps;
        this.elements.clickCount.textContent = stats.clickCount;
        this.elements.killCount.textContent = stats.killCount;
    }
    
    updateEnemies() {
        this.elements.enemyPack.innerHTML = '';
        
        this.game.enemies.forEach(enemy => {
            const enemyEl = this.createEnemyElement(enemy);
            this.elements.enemyPack.appendChild(enemyEl);
        });
    }
    
    createEnemyElement(enemy) {
        const div = document.createElement('div');
        div.className = 'enemy';
        div.dataset.id = enemy.id;
        div.innerHTML = `
            <div class="hp-bar">
                <div class="hp-fill" style="width: ${(enemy.hp / enemy.maxHp) * 100}%"></div>
            </div>
            <span class="enemy-name">${enemy.name}</span>
        `;
        return div;
    }
    
    updateEnemy(enemy) {
        const enemyEl = this.elements.enemyPack.querySelector(`[data-id="${enemy.id}"]`);
        if (enemyEl) {
            const hpFill = enemyEl.querySelector('.hp-fill');
            hpFill.style.width = `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
            
            // Add damage animation
            enemyEl.classList.add('damaged');
            setTimeout(() => enemyEl.classList.remove('damaged'), 200);
        }
    }
    
    removeEnemy(enemy) {
        const enemyEl = this.elements.enemyPack.querySelector(`[data-id="${enemy.id}"]`);
        if (enemyEl) {
            enemyEl.style.animation = 'fadeOut 0.3s';
            setTimeout(() => {
                enemyEl.remove();
                this.updateEnemies(); // Refresh enemy display
            }, 300);
        }
    }
    
    showDamageNumber(enemy, damage) {
        const enemyEl = this.elements.enemyPack.querySelector(`[data-id="${enemy.id}"]`);
        if (!enemyEl) return;
        
        const damageEl = document.createElement('div');
        damageEl.className = 'damage-number';
        damageEl.textContent = damage;
        damageEl.style.cssText = `
            position: absolute;
            color: #ff6666;
            font-size: 24px;
            font-weight: bold;
            pointer-events: none;
            animation: damageFloat 1s ease-out forwards;
        `;
        
        enemyEl.style.position = 'relative';
        enemyEl.appendChild(damageEl);
        
        setTimeout(() => damageEl.remove(), 1000);
    }
    
    updateRunes() {
        // Update active runes display
        this.elements.activeRunes.innerHTML = '';
        this.game.activeRunes.forEach(rune => {
            const runeEl = this.createRuneElement(rune, 'active');
            this.elements.activeRunes.appendChild(runeEl);
        });
        
        // Add empty slots
        for (let i = this.game.activeRunes.length; i < 2; i++) {
            const emptySlot = this.createEmptyRuneSlot('active');
            this.elements.activeRunes.appendChild(emptySlot);
        }
        
        // Update support runes display
        this.elements.supportRunes.innerHTML = '';
        this.game.supportRunes.forEach(rune => {
            const runeEl = this.createRuneElement(rune, 'support');
            this.elements.supportRunes.appendChild(runeEl);
        });
        
        // Add empty slots
        for (let i = this.game.supportRunes.length; i < 2; i++) {
            const emptySlot = this.createEmptyRuneSlot('support');
            this.elements.supportRunes.appendChild(emptySlot);
        }
    }
    
    createRuneElement(rune, type) {
        const div = document.createElement('div');
        div.className = `rune-slot ${type}`;
        div.title = rune.name;
        div.textContent = rune.name.charAt(0);
        return div;
    }
    
    createEmptyRuneSlot(type) {
        const div = document.createElement('div');
        div.className = `rune-slot empty ${type}`;
        return div;
    }
}