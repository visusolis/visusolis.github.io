// Garden Flower Propagation System
const flowers = ['+', '*', '·', '-'];
let flowerCount = 0;
const MAX_FLOWERS = 500; // Way more flowers

function spawn(x, y) {
    if (flowerCount > MAX_FLOWERS) return;

    const container = document.querySelector('.garden-container');
    if (!container) return;

    const flower = document.createElement('span');
    flower.className = 'flower';
    flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];

    // Random position near parent
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 150 + 30;

    // Get container bounds in viewport
    const containerRect = container.getBoundingClientRect();

    // x, y are viewport coordinates - convert to container-relative
    const containerRelativeX = x - containerRect.left;
    const containerRelativeY = y - containerRect.top;

    // Calculate new position relative to container
    const newX = containerRelativeX + Math.cos(angle) * dist;
    const newY = containerRelativeY + Math.sin(angle) * dist;

    // Check bounds - only spawn within viewport area
    if (newX < 0 || newX > containerRect.width || newY < 0 || newY > window.innerHeight) {
        return;
    }

    flower.style.left = newX + 'px';
    flower.style.top = newY + 'px';

    container.appendChild(flower);
    flowerCount++;

    // Fade in with lower opacity
    setTimeout(() => flower.style.opacity = '0.25', 100);

    // Schedule this flower to spawn others
    setTimeout(() => {
        if (Math.random() < 0.5) {
            spawn(containerRect.left + newX, containerRect.top + newY);
        }
        setTimeout(() => spawn(containerRect.left + newX, containerRect.top + newY), (3 + Math.random() * 4) * 1000);
    }, 2000);
}

// Randomize section positions on the page
function randomizePositions() {
    const container = document.querySelector('.garden-container');
    if (!container) return;

    const sections = document.querySelectorAll('.section-link');
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const viewportHeight = window.innerHeight;

    // Center point coordinates
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = 160;

    const positionedElements = [];
    // Responsive minimum distance based on viewport size
    const minDistance = window.innerWidth < 600 ? 200 : 420;

    // Create SVG for stem lines (fixed to viewport)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'fixed';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '2';
    document.body.appendChild(svg);

    function checkOverlap(x, y, width, height) {
        for (let rect of positionedElements) {
            // Check if new position would overlap with existing element
            if (x < rect.right + minDistance &&
                x + width > rect.left - minDistance &&
                y < rect.bottom + minDistance &&
                y + height > rect.top - minDistance) {
                return true;
            }
        }
        return false;
    }

    sections.forEach(section => {
        let x, y, attempts = 0;
        const maxAttempts = 50;
        const margin = window.innerWidth < 600 ? 40 : 60;
        const bottomMargin = window.innerWidth < 600 ? 100 : 140;

        // Get actual element dimensions from computed style
        const computed = window.getComputedStyle(section);
        const sectionWidth = parseFloat(computed.width) || 150;
        const sectionHeight = parseFloat(computed.height) || 100;

        // Try to find non-overlapping position within bounds
        do {
            x = Math.random() * (containerWidth - sectionWidth - margin * 2) + margin;
            y = Math.random() * (viewportHeight - sectionHeight - margin - bottomMargin) + margin;
            attempts++;
        } while (checkOverlap(x, y, sectionWidth, sectionHeight) && attempts < maxAttempts);

        // Clamp to ensure it stays on screen
        x = Math.max(margin, Math.min(x, containerWidth - sectionWidth - margin));
        y = Math.max(margin, Math.min(y, viewportHeight - sectionHeight - bottomMargin));

        section.style.left = x + 'px';
        section.style.top = y + 'px';

        // Draw line from section center to viewport center
        const sectionCenterX = x + sectionWidth / 2;
        const sectionCenterY = y + sectionHeight / 2;

        // Convert to viewport coordinates
        const viewportSectionX = containerRect.left + sectionCenterX;
        const viewportSectionY = containerRect.top + sectionCenterY;
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = 160;

        // Create curved path instead of straight line
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midX = (viewportSectionX + viewportCenterX) / 2;
        const midY = (viewportSectionY + viewportCenterY) / 2;
        // Curve control point offset with random variation
        const curveDirection = Math.random() > 0.5 ? 1 : -1;
        const curveStrength = 0.1 + Math.random() * 0.15;
        const offsetX = (viewportSectionY - viewportCenterY) * curveStrength * curveDirection;
        const offsetY = (viewportCenterX - viewportSectionX) * curveStrength * curveDirection;
        const d = `M ${viewportSectionX} ${viewportSectionY} Q ${midX + offsetX} ${midY + offsetY} ${viewportCenterX} ${viewportCenterY}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#718054');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('opacity', '0.4');
        svg.appendChild(path);

        // Track this element's position
        positionedElements.push({
            left: x,
            top: y,
            right: x + sectionWidth,
            bottom: y + sectionHeight
        });
    });
}

// Animate links moving slowly around the page
function animateLinks() {
    const container = document.querySelector('.garden-container');
    const sections = document.querySelectorAll('.section-link');
    const svg = document.querySelector('svg');

    // Store current positions and velocities
    const positions = new Map();
    const velocities = new Map();
    const spawnCounters = new Map();
    const sectionIndices = new Map();
    const sectionArray = Array.from(sections);

    sections.forEach((section, index) => {
        sectionIndices.set(section, index);
        const rect = section.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const computed = window.getComputedStyle(section);
        const width = parseFloat(computed.width) || 150;
        const height = parseFloat(computed.height) || 100;
        positions.set(section, {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: width,
            height: height,
            curveDirection: Math.random() > 0.5 ? 1 : -1,
            curveStrength: 0.1 + Math.random() * 0.15
        });
        velocities.set(section, {
            vx: (Math.random() - 0.5) * 0.08,
            vy: (Math.random() - 0.5) * 0.08
        });
        spawnCounters.set(section, 0);
    });

    function update() {
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const viewportHeight = window.innerHeight;
        const margin = window.innerWidth < 600 ? 40 : 60;
        const bottomMargin = window.innerWidth < 600 ? 100 : 140;
        const minCollisionDistance = window.innerWidth < 600 ? 100 : 200;
        for (let i = 0; i < sectionArray.length; i++) {
            for (let j = i + 1; j < sectionArray.length; j++) {
                const pos1 = positions.get(sectionArray[i]);
                const pos2 = positions.get(sectionArray[j]);
                const vel1 = velocities.get(sectionArray[i]);
                const vel2 = velocities.get(sectionArray[j]);

                // Calculate distance between centers
                const center1X = pos1.x + pos1.width / 2;
                const center1Y = pos1.y + pos1.height / 2;
                const center2X = pos2.x + pos2.width / 2;
                const center2Y = pos2.y + pos2.height / 2;
                const dx = center2X - center1X;
                const dy = center2Y - center1Y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // If too close, bounce them apart
                if (distance < minCollisionDistance) {
                    // Normalize direction
                    const nx = dx / distance;
                    const ny = dy / distance;

                    // Reverse velocities in collision direction
                    vel1.vx -= nx * 0.05;
                    vel1.vy -= ny * 0.05;
                    vel2.vx += nx * 0.05;
                    vel2.vy += ny * 0.05;

                    // Push apart to avoid sticking
                    const overlap = minCollisionDistance - distance;
                    const pushDist = overlap / 2 + 1;
                    pos1.x -= nx * pushDist;
                    pos1.y -= ny * pushDist;
                    pos2.x += nx * pushDist;
                    pos2.y += ny * pushDist;

                    // Keep within bounds after collision
                    pos1.x = Math.max(margin, Math.min(pos1.x, containerWidth - pos1.width - margin));
                    pos1.y = Math.max(margin, Math.min(pos1.y, viewportHeight - pos1.height - bottomMargin));
                    pos2.x = Math.max(margin, Math.min(pos2.x, containerWidth - pos2.width - margin));
                    pos2.y = Math.max(margin, Math.min(pos2.y, viewportHeight - pos2.height - bottomMargin));
                }
            }
        }

        sections.forEach(section => {
            const pos = positions.get(section);
            const vel = velocities.get(section);
            let counter = spawnCounters.get(section);

            // Update position
            pos.x += vel.vx;
            pos.y += vel.vy;

            // Bounce off edges
            if (pos.x <= margin || pos.x >= containerWidth - pos.width - margin) {
                vel.vx *= -1;
                pos.x = Math.max(margin, Math.min(pos.x, containerWidth - pos.width - margin));
            }
            if (pos.y <= margin || pos.y >= viewportHeight - pos.height - bottomMargin) {
                vel.vy *= -1;
                pos.y = Math.max(margin, Math.min(pos.y, viewportHeight - pos.height - bottomMargin));
            }

            // Apply position
            section.style.left = pos.x + 'px';
            section.style.top = pos.y + 'px';

            // Spawn flowers behind the moving link
            counter++;
            if (counter > 15) {
                // Get the link's actual viewport position
                const sectionRect = section.getBoundingClientRect();
                const spawnX = sectionRect.left + sectionRect.width / 2;
                const spawnY = sectionRect.top + sectionRect.height / 2;
                spawn(spawnX, spawnY);
                counter = 0;
            }
            spawnCounters.set(section, counter);

            // Update SVG path with curved line
            const paths = svg.querySelectorAll('path');
            const index = sectionIndices.get(section);
            if (paths[index]) {
                // Convert section position to viewport coordinates
                const sectionX = containerRect.left + pos.x + pos.width / 2;
                const sectionY = containerRect.top + pos.y + pos.height / 2;
                const viewportCenterX = window.innerWidth / 2;
                const viewportCenterY = 160;
                const midX = (sectionX + viewportCenterX) / 2;
                const midY = (sectionY + viewportCenterY) / 2;
                const offsetX = (sectionY - viewportCenterY) * pos.curveStrength * pos.curveDirection;
                const offsetY = (viewportCenterX - sectionX) * pos.curveStrength * pos.curveDirection;
                const d = `M ${sectionX} ${sectionY} Q ${midX + offsetX} ${midY + offsetY} ${viewportCenterX} ${viewportCenterY}`;
                paths[index].setAttribute('d', d);
            }
        });

        requestAnimationFrame(update);
    }

    update();
}

// Initialize garden on page load
document.addEventListener('DOMContentLoaded', () => {
    randomizePositions();
    setTimeout(animateLinks, 100);
});