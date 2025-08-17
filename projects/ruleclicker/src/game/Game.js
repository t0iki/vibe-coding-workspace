export class Game {
    constructor(content) {
        this.content = content;
        this.stats = {
            clickCount: 0,
            killCount: 0,
            dps: 0,
            clickDamage: 10
        };
        
        this.enemies = [];
        this.activeRunes = [];
        this.supportRunes = [];
        
        this.lastUpdate = Date.now();
        this.running = false;
        
        this.loadInitialRunes();
        this.spawnEnemies();
    }
    
    loadInitialRunes() {
        // Load first active rune
        if (this.content.runesActive.length > 0) {
            this.activeRunes.push(this.content.runesActive[0]);
        }
        
        // Load first support rune
        if (this.content.runesSupport.length > 0) {
            this.supportRunes.push(this.content.runesSupport[0]);
        }
        
        this.calculateDPS();
    }
    
    calculateDPS() {
        let baseDPS = this.stats.clickDamage;
        
        // Apply active rune base damage
        if (this.activeRunes.length > 0) {
            const activeRune = this.activeRunes[0];
            baseDPS = activeRune.base.hit || activeRune.base.dps || baseDPS;
        }
        
        // Apply support rune modifiers
        this.supportRunes.forEach(support => {
            if (support.effect && support.effect.more) {
                const moreMult = 1 + (support.effect.more.hit || 0);
                baseDPS *= moreMult;
            }
        });
        
        this.stats.dps = Math.floor(baseDPS);
    }
    
    spawnEnemies() {
        this.enemies = [];
        const enemyCount = 1 + Math.floor(this.stats.killCount / 10);
        
        for (let i = 0; i < Math.min(enemyCount, 5); i++) {
            this.enemies.push({
                id: Date.now() + i,
                hp: 100 + (this.stats.killCount * 2),
                maxHp: 100 + (this.stats.killCount * 2),
                name: '雑魚'
            });
        }
    }
    
    click() {
        this.stats.clickCount++;
        
        if (this.enemies.length > 0) {
            const damage = this.stats.dps;
            this.damageEnemy(this.enemies[0], damage);
        }
    }
    
    damageEnemy(enemy, damage) {
        enemy.hp -= damage;
        
        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('enemyDamaged', { 
            detail: { enemy, damage } 
        }));
    }
    
    killEnemy(enemy) {
        this.stats.killCount++;
        this.enemies = this.enemies.filter(e => e.id !== enemy.id);
        
        // Spawn new enemies if all dead
        if (this.enemies.length === 0) {
            setTimeout(() => this.spawnEnemies(), 500);
        }
        
        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('enemyKilled', { 
            detail: { enemy } 
        }));
    }
    
    update() {
        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;
        
        // Auto damage (if we have auto-click later)
        // For now, just update UI
        window.dispatchEvent(new CustomEvent('gameUpdate', { 
            detail: { stats: this.stats } 
        }));
    }
    
    start() {
        this.running = true;
        this.gameLoop();
    }
    
    stop() {
        this.running = false;
    }
    
    gameLoop() {
        if (!this.running) return;
        
        this.update();
        requestAnimationFrame(() => this.gameLoop());
    }
}