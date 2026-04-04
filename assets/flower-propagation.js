const flowers = ['+', '*', '·', '-'];
let flowerCount = 0;
const MAX_FLOWERS = 1200;

function spawn(x, y) {
    if (flowerCount >= MAX_FLOWERS) return;

    const container = document.querySelector('.garden-container');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 100 + 15;

    const newX = (x - containerRect.left) + Math.cos(angle) * dist;
    const newY = (y - containerRect.top) + Math.sin(angle) * dist;

    if (newX < 0 || newX > containerRect.width || newY < 0 || newY > window.innerHeight) return;

    const flower = document.createElement('span');
    flower.className = 'flower';
    flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    flower.style.left = newX + 'px';
    flower.style.top = newY + 'px';

    container.appendChild(flower);
    flowerCount++;

    setTimeout(() => flower.classList.add('visible'), 30);

    const delay = (0.5 + Math.random() * 1.5) * 1000;
    const children = Math.random() < 0.7 ? 2 : 1;
    for (let i = 0; i < children; i++) {
        setTimeout(() => spawn(containerRect.left + newX, containerRect.top + newY), delay + i * 200);
    }
}

function burst() {
    const container = document.querySelector('.garden-container');
    if (!container) return;

    const count = 120;
    for (let i = 0; i < count; i++) {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const flower = document.createElement('span');
        flower.className = 'flower';
        flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
        flower.style.left = x + 'px';
        flower.style.top = y + 'px';
        container.appendChild(flower);
        flowerCount++;
        setTimeout(() => flower.classList.add('visible'), 50 + i * 15);
    }
}

function seed() {
    const container = document.querySelector('.garden-container');
    if (!container) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    for (let i = 0; i < 20; i++) {
        const ox = (Math.random() - 0.5) * window.innerWidth * 0.8;
        const oy = (Math.random() - 0.5) * window.innerHeight * 0.8;
        setTimeout(() => spawn(cx + ox, cy + oy), i * 80);
    }
}

window.addEventListener('load', () => {
    setTimeout(burst, 100);
    setTimeout(seed, 200);
});
