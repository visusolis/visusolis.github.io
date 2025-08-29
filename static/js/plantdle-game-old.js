// Plantdle Game Logic
class PlantdleGame {
    constructor() {
        this.maxGuesses = 4;
        this.currentGuess = 0;
        this.guesses = [];
        this.gameState = 'playing'; // playing, won, lost
        this.todaysPlant = null;
        this.gameDate = this.getTodaysDate();
        
        this.initializeElements();
        this.loadGameState();
        this.startGame();
    }
    
    initializeElements() {
        this.plantImage = document.getElementById('plant-image');
        this.loading = document.getElementById('loading');
        this.hintsContainer = document.getElementById('hints-container');
        this.guessInput = document.getElementById('guess-input');
        this.submitButton = document.getElementById('submit-guess');
        this.guessesList = document.getElementById('guesses-list');
        this.gameMessage = document.getElementById('game-message');
        this.gameStats = document.getElementById('game-stats');
        this.statsContent = document.getElementById('stats-content');
        
        // Event listeners
        this.submitButton.addEventListener('click', () => this.submitGuess());
        this.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitGuess();
            }
        });
        
        // Image error handling
        this.plantImage.addEventListener('error', () => this.handleImageError());
    }
    
    getTodaysDate() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    getTodaysPlant() {
        // Deterministic daily plant selection
        const today = new Date();
        const seed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 100 + today.getDate();
        const plantIndex = seed % window.plantsDatabase.length;
        return window.plantsDatabase[plantIndex];
    }
    
    loadGameState() {
        const saved = localStorage.getItem('plantdle-game');
        if (saved) {
            try {
                const gameData = JSON.parse(saved);
                
                // Check if it's the same day
                if (gameData.date === this.gameDate) {
                    this.currentGuess = gameData.currentGuess || 0;
                    this.guesses = gameData.guesses || [];
                    this.gameState = gameData.gameState || 'playing';
                }
            } catch (e) {
                console.log('Error loading game state:', e);
            }
        }
    }
    
    saveGameState() {
        const gameData = {
            date: this.gameDate,
            currentGuess: this.currentGuess,
            guesses: this.guesses,
            gameState: this.gameState
        };
        localStorage.setItem('plantdle-game', JSON.stringify(gameData));
    }
    
    startGame() {
        this.todaysPlant = this.getTodaysPlant();
        this.loadPlantImage();
        this.updateUI();
        
        if (this.gameState === 'playing') {
            this.enableInput();
        } else {
            this.endGame(false); // Pass false for loaded game
        }
    }
    
    loadPlantImage() {
        this.loading.style.display = 'block';
        this.plantImage.style.display = 'none';
        
        // Preload image
        const img = new Image();
        img.onload = () => {
            this.plantImage.src = this.todaysPlant.wikipediaImageUrl;
            this.plantImage.style.display = 'block';
            this.loading.style.display = 'none';
        };
        img.onerror = () => this.handleImageError();
        img.src = this.todaysPlant.wikipediaImageUrl;
    }
    
    handleImageError() {
        this.loading.style.display = 'none';
        this.plantImage.style.display = 'block';
        this.plantImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzAxMUQxQiIvPjx0ZXh0IHg9IjI1NiIgeT0iMjU2IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjRTVFNUU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCI+SW1hZ2UgdW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+';
        this.plantImage.alt = 'Plant image temporarily unavailable';
    }
    
    enableInput() {
        this.guessInput.disabled = false;
        this.submitButton.disabled = false;
        this.guessInput.focus();
    }
    
    disableInput() {
        this.guessInput.disabled = true;
        this.submitButton.disabled = true;
    }
    
    submitGuess() {
        const guess = this.guessInput.value.trim().toLowerCase();
        if (!guess) return;
        
        const isCorrect = this.validateGuess(guess);
        this.guesses.push({
            text: this.guessInput.value.trim(),
            correct: isCorrect
        });
        
        this.guessInput.value = '';
        this.currentGuess++;
        
        if (isCorrect) {
            this.gameState = 'won';
            this.endGame(true); // Pass true for fresh completion
        } else if (this.currentGuess >= this.maxGuesses) {
            this.gameState = 'lost';
            this.endGame(true); // Pass true for fresh completion
        } else {
            this.updateUI();
        }
        
        this.saveGameState();
    }
    
    validateGuess(guess) {
        const plant = this.todaysPlant;
        
        // Check scientific name (case insensitive)
        if (plant.scientificName.toLowerCase() === guess) {
            return true;
        }
        
        // Check all common names
        for (const name of plant.commonNames) {
            if (name.toLowerCase() === guess) {
                return true;
            }
        }
        
        // Check alternative name
        if (plant.alternativeName.toLowerCase() === guess) {
            return true;
        }
        
        // Simple fuzzy matching for typos
        const allNames = [
            plant.scientificName,
            ...plant.commonNames,
            plant.alternativeName
        ];
        
        for (const name of allNames) {
            if (this.fuzzyMatch(guess, name.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }
    
    fuzzyMatch(guess, target) {
        // Simple Levenshtein distance for typo tolerance
        if (Math.abs(guess.length - target.length) > 2) return false;
        
        const distance = this.levenshteinDistance(guess, target);
        return distance <= Math.min(2, Math.floor(target.length * 0.2));
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    updateUI() {
        this.updateHints();
        this.updateGuesses();
        this.updateMessage();
    }
    
    updateHints() {
        const hints = [];
        const plant = this.todaysPlant;
        
        if (this.currentGuess >= 1) {
            hints.push(`<p><strong>Region:</strong> ${plant.region}</p>`);
        }
        
        if (this.currentGuess >= 2) {
            hints.push(`<p><strong>Scientific name:</strong> ${plant.scientificName}</p>`);
        }
        
        if (this.currentGuess >= 3) {
            hints.push(`<p><strong>Also known as:</strong> ${plant.alternativeName}</p>`);
        }
        
        this.hintsContainer.innerHTML = hints.join('');
    }
    
    updateGuesses() {
        const guesseHTML = this.guesses.map(guess => 
            `<div class="guess ${guess.correct ? 'correct' : 'incorrect'}">
                ${guess.text} ${guess.correct ? '✅' : '❌'}
            </div>`
        ).join('');
        
        this.guessesList.innerHTML = guesseHTML;
    }
    
    updateMessage() {
        if (this.gameState === 'playing') {
            const remaining = this.maxGuesses - this.currentGuess;
            this.gameMessage.innerHTML = `<p>Guess ${this.currentGuess + 1} of ${this.maxGuesses}</p>`;
        }
    }
    
    endGame(incrementStats = false) {
        this.disableInput();
        
        if (this.gameState === 'won') {
            this.gameMessage.innerHTML = `
                <div class="game-won">
                    <h3>🎉 Congratulations!</h3>
                    <p>You got it in ${this.currentGuess} guess${this.currentGuess === 1 ? '' : 'es'}!</p>
                    <p><strong>${this.todaysPlant.scientificName}</strong> (${this.todaysPlant.commonNames[0]})</p>
                </div>
            `;
        } else {
            this.gameMessage.innerHTML = `
                <div class="game-lost">
                    <h3>Better luck tomorrow!</h3>
                    <p>The plant was: <strong>${this.todaysPlant.scientificName}</strong></p>
                    <p>Common name: ${this.todaysPlant.commonNames[0]}</p>
                </div>
            `;
        }
        
        // Show all hints
        this.currentGuess = this.maxGuesses;
        this.updateHints();
        
        // Add attribution
        this.gameMessage.innerHTML += `
            <p class="attribution">
                <small>Image: <a href="${this.todaysPlant.wikipediaPage}" target="_blank" rel="noopener">Wikipedia</a></small>
            </p>
        `;
        
        // Update and show stats
        this.updateStats(incrementStats);
        this.gameStats.style.display = 'block';
        
        // Show next game info
        this.gameMessage.innerHTML += `<p class="next-game">Come back tomorrow for a new plant!</p>`;
    }
    
    updateStats(incrementStats = false) {
        let stats = JSON.parse(localStorage.getItem('plantdle-stats') || '{}');
        
        // Initialize stats
        if (!stats.gamesPlayed) {
            stats = {
                gamesPlayed: 0,
                gamesWon: 0,
                currentStreak: 0,
                maxStreak: 0,
                guessDistribution: [0, 0, 0, 0, 0], // index 0 unused, 1-4 for guess numbers
                lastPlayedDate: null
            };
        }
        
        // Only update stats if this is a new game completion
        if (incrementStats && stats.lastPlayedDate !== this.gameDate) {
            stats.gamesPlayed++;
            stats.lastPlayedDate = this.gameDate;
            
            if (this.gameState === 'won') {
                stats.gamesWon++;
                stats.currentStreak++;
                stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
                stats.guessDistribution[this.currentGuess]++;
            } else {
                stats.currentStreak = 0;
            }
            
            localStorage.setItem('plantdle-stats', JSON.stringify(stats));
        }
        
        // Display stats
        const winPercentage = Math.round((stats.gamesWon / stats.gamesPlayed) * 100) || 0;
        
        this.statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat">
                    <div class="stat-number">${stats.gamesPlayed}</div>
                    <div class="stat-label">Played</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${winPercentage}%</div>
                    <div class="stat-label">Win Rate</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${stats.currentStreak}</div>
                    <div class="stat-label">Current Streak</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${stats.maxStreak}</div>
                    <div class="stat-label">Max Streak</div>
                </div>
            </div>
            
            <div class="guess-distribution">
                <h5>Guess Distribution</h5>
                ${stats.guessDistribution.slice(1).map((count, index) => `
                    <div class="distribution-row">
                        <div class="guess-number">${index + 1}</div>
                        <div class="distribution-bar">
                            <div class="bar-fill" style="width: ${stats.gamesWon > 0 ? (count / stats.gamesWon * 100) : 0}%">${count}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have the plants database
    if (window.plantsDatabase && window.plantsDatabase.length > 0) {
        new PlantdleGame();
    } else {
        console.error('Plants database not loaded');
        document.getElementById('loading').textContent = 'Error loading plant database';
    }
});