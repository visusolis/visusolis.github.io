// Simple Flower Propagation
const flowers = ['✿', '❀', '✳', '❁', '❂', '❆'];
let flowerCount = 0;

function spawn(x, y) {
    if (flowerCount > 80) return; // Simple limit
    
    const flower = document.createElement('span');
    flower.className = 'flower';
    flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    
    // Random position near parent
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 100 + 50;
    flower.style.left = Math.max(10, Math.min(window.innerWidth - 30, x + Math.cos(angle) * dist)) + 'px';
    flower.style.top = Math.max(10, y + Math.sin(angle) * dist) + 'px';
    
    document.body.appendChild(flower);
    flowerCount++;
    
    // Fade in
    setTimeout(() => flower.style.opacity = '1', 100);
    
    // Schedule this flower to spawn others
    setTimeout(() => {
        if (Math.random() < 0.3) { // 30% chance
            spawn(parseFloat(flower.style.left), parseFloat(flower.style.top));
        }
        setTimeout(() => spawn(parseFloat(flower.style.left), parseFloat(flower.style.top)), 
                  (8 + Math.random() * 8) * 1000); // 8-16 seconds
    }, 5000);
}

// Start from original flowers
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('h6').forEach(h => {
        const rect = h.getBoundingClientRect();
        setTimeout(() => spawn(rect.left + window.scrollX, rect.top + window.scrollY), 
                  Math.random() * 5000);
    });
});