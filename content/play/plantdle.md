+++
title = 'plantdle'
date = 2024-08-28T12:00:00+02:00
+++

🌱 **Plantdle** - A daily plant guessing game

Identify today's mystery plant! You have 4 guesses with progressive hints.

{{< rawhtml >}}
<div id="plantdle-game">
    <div id="game-container">
        <div id="plant-image-container">
            <img id="plant-image" src="" alt="Mystery plant" style="display: none;">
            <div id="loading">Loading today's plant...</div>
        </div>
        
        <div id="hints-container">
            <!-- Hints will appear here as game progresses -->
        </div>
        
        <div id="game-input">
            <input type="text" id="guess-input" placeholder="Enter plant name..." disabled>
            <button id="submit-guess" disabled>Submit</button>
        </div>
        
        <div id="guesses-container">
            <h4>Previous guesses:</h4>
            <div id="guesses-list"></div>
        </div>
        
        <div id="game-message"></div>
    </div>
</div>

<script src="/js/plants-data.js"></script>
<script src="/js/plantdle-game.js"></script>
<link rel="stylesheet" href="/css/plantdle.css">
{{< /rawhtml >}}