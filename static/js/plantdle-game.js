// Plantdle - Simplified Version
let game = {
    plant: null,
    guesses: [],
    maxGuesses: 4,
    gameState: 'playing',
    gameDate: new Date().toISOString().split('T')[0]
};

// Get today's plant (deterministic by date)
function getTodaysPlant() {
    const today = new Date();
    const seed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 100 + today.getDate();
    return plantsDatabase[seed % plantsDatabase.length];
}

// Check if guess matches plant names
function isCorrectGuess(guess, plant) {
    const cleanGuess = guess.toLowerCase().trim();
    const allNames = [
        plant.scientificName.toLowerCase(),
        plant.alternativeName.toLowerCase(),
        ...plant.commonNames.map(name => name.toLowerCase())
    ];
    return allNames.includes(cleanGuess);
}

// Load/save game state
function loadGame() {
    try {
        const saved = localStorage.getItem('plantdle-game');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.date === game.gameDate) {
                Object.assign(game, data);
            }
        }
    } catch (e) {
        console.log('Failed to load game:', e);
    }
}

function saveGame() {
    localStorage.setItem('plantdle-game', JSON.stringify({
        date: game.gameDate,
        guesses: game.guesses,
        gameState: game.gameState
    }));
}


// Show hints based on guess count
function showHints() {
    const hints = [];
    if (game.guesses.length >= 1) hints.push(`Region: ${game.plant.region}`);
    if (game.guesses.length >= 2) hints.push(`Scientific: ${game.plant.scientificName}`);
    if (game.guesses.length >= 3) hints.push(`Also: ${game.plant.alternativeName}`);
    
    document.getElementById('hints-container').innerHTML = 
        hints.map(hint => `<p>${hint}</p>`).join('');
}

// Show previous guesses
function showGuesses() {
    document.getElementById('guesses-list').innerHTML = game.guesses
        .map(g => `<div class="guess ${g.correct ? 'correct' : 'incorrect'}">${g.text} ${g.correct ? '✅' : '❌'}</div>`)
        .join('');
}

// Handle guess submission
function submitGuess() {
    const input = document.getElementById('guess-input');
    const guess = input.value.trim();
    if (!guess || game.gameState !== 'playing') return;
    
    const correct = isCorrectGuess(guess, game.plant);
    game.guesses.push({ text: guess, correct });
    input.value = '';
    
    // Check win/lose
    if (correct) {
        game.gameState = 'won';
    } else if (game.guesses.length >= game.maxGuesses) {
        game.gameState = 'lost';
    }
    
    // Update display
    showHints();
    showGuesses();
    
    // Show result message
    if (game.gameState !== 'playing') {
        const msg = game.gameState === 'won' 
            ? `🎉 Got it in ${game.guesses.length} guesses!`
            : `Better luck tomorrow! It was ${game.plant.commonNames[0]}`;
        
        document.getElementById('game-message').innerHTML = `
            <p>${msg}</p>
            <p><strong>${game.plant.scientificName}</strong></p>
            <small><a href="${game.plant.wikipediaPage}" target="_blank">Wikipedia</a></small>
        `;
        
        document.getElementById('guess-input').disabled = true;
        document.getElementById('submit-guess').disabled = true;
    } else {
        document.getElementById('game-message').innerHTML = `<p>Guess ${game.guesses.length + 1} of ${game.maxGuesses}</p>`;
    }
    
    saveGame();
}

// Load plant image
function loadImage() {
    const img = document.getElementById('plant-image');
    const loading = document.getElementById('loading');
    
    img.onload = () => {
        img.style.display = 'block';
        loading.style.display = 'none';
    };
    
    img.onerror = () => {
        img.alt = 'Image unavailable';
        img.style.display = 'block';
        loading.style.display = 'none';
    };
    
    img.src = game.plant.wikipediaImageUrl;
}

// Initialize game
function init() {
    if (!window.plantsDatabase?.length) {
        document.getElementById('loading').textContent = 'Error loading plants';
        return;
    }
    
    game.plant = getTodaysPlant();
    loadGame();
    loadImage();
    
    // Set up event listeners
    document.getElementById('submit-guess').onclick = submitGuess;
    document.getElementById('guess-input').onkeypress = (e) => {
        if (e.key === 'Enter') submitGuess();
    };
    
    // Update display
    showHints();
    showGuesses();
    
    if (game.gameState === 'playing') {
        document.getElementById('game-message').innerHTML = `<p>Guess 1 of ${game.maxGuesses}</p>`;
        document.getElementById('guess-input').focus();
    } else {
        // Game already finished
        const msg = game.gameState === 'won' 
            ? `🎉 Got it in ${game.guesses.length} guesses!`
            : `Better luck tomorrow! It was ${game.plant.commonNames[0]}`;
        
        document.getElementById('game-message').innerHTML = `
            <p>${msg}</p>
            <p><strong>${game.plant.scientificName}</strong></p>
        `;
        
        document.getElementById('guess-input').disabled = true;
        document.getElementById('submit-guess').disabled = true;
    }
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);