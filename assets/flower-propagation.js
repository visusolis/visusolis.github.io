// Garden Flower Propagation System
const flowers = ['+', '*', '·', '-'];
let flowerCount = 0;
const MAX_FLOWERS = 500;

function spawn(x, y) {
    if (flowerCount > MAX_FLOWERS) return;

    const container = document.querySelector('.garden-container');
    if (!container) return;

    const flower = document.createElement('span');
    flower.className = 'flower';
    flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 150 + 30;

    const containerRect = container.getBoundingClientRect();
    const containerRelativeX = x - containerRect.left;
    const containerRelativeY = y - containerRect.top;

    const newX = containerRelativeX + Math.cos(angle) * dist;
    const newY = containerRelativeY + Math.sin(angle) * dist;

    if (newX < 0 || newX > containerRect.width || newY < 0 || newY > window.innerHeight) {
        return;
    }

    flower.style.left = newX + 'px';
    flower.style.top = newY + 'px';

    container.appendChild(flower);
    flowerCount++;

    setTimeout(() => flower.style.opacity = '0.25', 100);

    setTimeout(() => {
        if (Math.random() < 0.5) {
            spawn(containerRect.left + newX, containerRect.top + newY);
        }
        setTimeout(() => spawn(containerRect.left + newX, containerRect.top + newY), (3 + Math.random() * 4) * 1000);
    }, 2000);
}

function randomizePositions() {
    const container = document.querySelector('.garden-container');
    if (!container) return;

    const sections = document.querySelectorAll('.section-link');
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const viewportHeight = window.innerHeight;

    const positionedElements = [];
    const minDistance = window.innerWidth < 600 ? 200 : 420;

    // Create SVG overlay for all lines
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'garden-svg';
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
            if (x < rect.right + minDistance &&
                x + width > rect.left - minDistance &&
                y < rect.bottom + minDistance &&
                y + height > rect.top - minDistance) {
                return true;
            }
        }
        return false;
    }

    const margin = window.innerWidth < 600 ? 40 : 60;
    const bottomMargin = window.innerWidth < 600 ? 100 : 140;

    // Position main section links
    sections.forEach(section => {
        let x, y, attempts = 0;
        const computed = window.getComputedStyle(section);
        const sectionWidth = parseFloat(computed.width) || 150;
        const sectionHeight = parseFloat(computed.height) || 100;

        do {
            x = Math.random() * (containerWidth - sectionWidth - margin * 2) + margin;
            y = Math.random() * (viewportHeight - sectionHeight - margin - bottomMargin) + margin;
            attempts++;
        } while (checkOverlap(x, y, sectionWidth, sectionHeight) && attempts < 50);

        x = Math.max(margin, Math.min(x, containerWidth - sectionWidth - margin));
        y = Math.max(margin, Math.min(y, viewportHeight - sectionHeight - bottomMargin));

        section.style.left = x + 'px';
        section.style.top = y + 'px';

        // Draw line from section to viewport center
        const sectionCenterX = containerRect.left + x + sectionWidth / 2;
        const sectionCenterY = containerRect.top + y + sectionHeight / 2;
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = 160;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midX = (sectionCenterX + viewportCenterX) / 2;
        const midY = (sectionCenterY + viewportCenterY) / 2;
        const curveDirection = Math.random() > 0.5 ? 1 : -1;
        const curveStrength = 0.1 + Math.random() * 0.15;
        const offsetX = (sectionCenterY - viewportCenterY) * curveStrength * curveDirection;
        const offsetY = (viewportCenterX - sectionCenterX) * curveStrength * curveDirection;
        const d = `M ${sectionCenterX} ${sectionCenterY} Q ${midX + offsetX} ${midY + offsetY} ${viewportCenterX} ${viewportCenterY}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#718054');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('opacity', '0.4');
        path.dataset.type = 'section';
        svg.appendChild(path);

        positionedElements.push({ left: x, top: y, right: x + sectionWidth, bottom: y + sectionHeight });
    });

    // Position article branches near the read node
    const readSection = document.querySelector('.section-link[data-section="read"]');
    const articleBranches = document.querySelectorAll('.article-branch');

    if (readSection && articleBranches.length > 0) {
        const readRect = readSection.getBoundingClientRect();
        const readX = readRect.left - containerRect.left;
        const readY = readRect.top - containerRect.top;
        const readW = readRect.width;
        const readH = readRect.height;

        articleBranches.forEach((branch, i) => {
            const bw = 200;
            const bh = 40;
            // Spread around the read node
            const angle = (i / articleBranches.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 150 + Math.random() * 80;
            let bx = readX + readW / 2 + Math.cos(angle) * radius - bw / 2;
            let by = readY + readH / 2 + Math.sin(angle) * radius - bh / 2;

            bx = Math.max(margin, Math.min(bx, containerWidth - bw - margin));
            by = Math.max(margin, Math.min(by, viewportHeight - bh - bottomMargin));

            branch.style.left = bx + 'px';
            branch.style.top = by + 'px';

            // Draw line from branch to read node
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#A89880');
            path.setAttribute('stroke-width', '0.8');
            path.setAttribute('opacity', '0.5');
            path.dataset.type = 'branch';
            path.dataset.index = i;
            svg.appendChild(path);
        });
    }
}

function animateLinks() {
    const container = document.querySelector('.garden-container');
    const sections = document.querySelectorAll('.section-link');
    const articleBranches = document.querySelectorAll('.article-branch');
    const svg = document.querySelector('#garden-svg');

    const positions = new Map();
    const velocities = new Map();
    const spawnCounters = new Map();
    const sectionIndices = new Map();
    const sectionArray = Array.from(sections);

    const containerRect = container.getBoundingClientRect();

    sections.forEach((section, index) => {
        sectionIndices.set(section, index);
        const rect = section.getBoundingClientRect();
        const computed = window.getComputedStyle(section);
        const width = parseFloat(computed.width) || 150;
        const height = parseFloat(computed.height) || 100;
        positions.set(section, {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width, height,
            curveDirection: Math.random() > 0.5 ? 1 : -1,
            curveStrength: 0.1 + Math.random() * 0.15
        });
        velocities.set(section, {
            vx: (Math.random() - 0.5) * 0.08,
            vy: (Math.random() - 0.5) * 0.08
        });
        spawnCounters.set(section, 0);
    });

    // Article branch positions and velocities
    articleBranches.forEach((branch, index) => {
        const rect = branch.getBoundingClientRect();
        positions.set(branch, {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: 200,
            height: 40,
            curveDirection: Math.random() > 0.5 ? 1 : -1,
            curveStrength: 0.15 + Math.random() * 0.2
        });
        velocities.set(branch, {
            vx: (Math.random() - 0.5) * 0.06,
            vy: (Math.random() - 0.5) * 0.06
        });
    });

    function update() {
        const cRect = container.getBoundingClientRect();
        const containerWidth = cRect.width;
        const viewportHeight = window.innerHeight;
        const margin = window.innerWidth < 600 ? 40 : 60;
        const bottomMargin = window.innerWidth < 600 ? 100 : 140;
        const minCollisionDistance = window.innerWidth < 600 ? 100 : 200;

        // All moving elements for collision
        const branchArray = Array.from(articleBranches);
        const allElements = [...sectionArray, ...branchArray];

        function repel(elA, elB, minDist) {
            const pos1 = positions.get(elA);
            const pos2 = positions.get(elB);
            const vel1 = velocities.get(elA);
            const vel2 = velocities.get(elB);
            const dx = (pos2.x + pos2.width / 2) - (pos1.x + pos1.width / 2);
            const dy = (pos2.y + pos2.height / 2) - (pos1.y + pos1.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            if (distance < minDist) {
                const nx = dx / distance;
                const ny = dy / distance;
                vel1.vx -= nx * 0.05;
                vel1.vy -= ny * 0.05;
                vel2.vx += nx * 0.05;
                vel2.vy += ny * 0.05;
                const push = (minDist - distance) / 2 + 1;
                pos1.x -= nx * push;
                pos1.y -= ny * push;
                pos2.x += nx * push;
                pos2.y += ny * push;
                for (const pos of [pos1, pos2]) {
                    pos.x = Math.max(margin, Math.min(pos.x, containerWidth - pos.width - margin));
                    pos.y = Math.max(margin, Math.min(pos.y, viewportHeight - pos.height - bottomMargin));
                }
            }
        }

        for (let i = 0; i < allElements.length; i++) {
            for (let j = i + 1; j < allElements.length; j++) {
                repel(allElements[i], allElements[j], minCollisionDistance);
            }
        }

        const sectionPaths = svg.querySelectorAll('path[data-type="section"]');
        const branchPaths = svg.querySelectorAll('path[data-type="branch"]');

        // Get read node position for branch lines
        const readSection = document.querySelector('.section-link[data-section="read"]');
        const readPos = positions.get(readSection);

        sections.forEach(section => {
            const pos = positions.get(section);
            const vel = velocities.get(section);
            let counter = spawnCounters.get(section);

            pos.x += vel.vx;
            pos.y += vel.vy;

            if (pos.x <= margin || pos.x >= containerWidth - pos.width - margin) {
                vel.vx *= -1;
                pos.x = Math.max(margin, Math.min(pos.x, containerWidth - pos.width - margin));
            }
            if (pos.y <= margin || pos.y >= viewportHeight - pos.height - bottomMargin) {
                vel.vy *= -1;
                pos.y = Math.max(margin, Math.min(pos.y, viewportHeight - pos.height - bottomMargin));
            }

            section.style.left = pos.x + 'px';
            section.style.top = pos.y + 'px';

            counter++;
            if (counter > 15) {
                const sectionRect = section.getBoundingClientRect();
                spawn(sectionRect.left + sectionRect.width / 2, sectionRect.top + sectionRect.height / 2);
                counter = 0;
            }
            spawnCounters.set(section, counter);

            // Update section → center line
            const index = sectionIndices.get(section);
            if (sectionPaths[index]) {
                const sectionX = cRect.left + pos.x + pos.width / 2;
                const sectionY = cRect.top + pos.y + pos.height / 2;
                const viewportCenterX = window.innerWidth / 2;
                const viewportCenterY = 160;
                const midX = (sectionX + viewportCenterX) / 2;
                const midY = (sectionY + viewportCenterY) / 2;
                const offsetX = (sectionY - viewportCenterY) * pos.curveStrength * pos.curveDirection;
                const offsetY = (viewportCenterX - sectionX) * pos.curveStrength * pos.curveDirection;
                const d = `M ${sectionX} ${sectionY} Q ${midX + offsetX} ${midY + offsetY} ${viewportCenterX} ${viewportCenterY}`;
                sectionPaths[index].setAttribute('d', d);
            }
        });

        // Animate article branches and update lines to read node
        articleBranches.forEach((branch, i) => {
            const pos = positions.get(branch);
            const vel = velocities.get(branch);

            pos.x += vel.vx;
            pos.y += vel.vy;

            if (pos.x <= margin || pos.x >= containerWidth - pos.width - margin) {
                vel.vx *= -1;
                pos.x = Math.max(margin, Math.min(pos.x, containerWidth - pos.width - margin));
            }
            if (pos.y <= margin || pos.y >= viewportHeight - pos.height - bottomMargin) {
                vel.vy *= -1;
                pos.y = Math.max(margin, Math.min(pos.y, viewportHeight - pos.height - bottomMargin));
            }

            branch.style.left = pos.x + 'px';
            branch.style.top = pos.y + 'px';

            // Update branch → read curved line
            if (branchPaths[i] && readPos) {
                const bx = cRect.left + pos.x;
                const by = cRect.top + pos.y + 10;
                const rx = cRect.left + readPos.x + readPos.width / 2;
                const ry = cRect.top + readPos.y + readPos.height / 2;
                const midX = (bx + rx) / 2;
                const midY = (by + ry) / 2;
                const offsetX = (by - ry) * pos.curveStrength * pos.curveDirection;
                const offsetY = (rx - bx) * pos.curveStrength * pos.curveDirection;
                branchPaths[i].setAttribute('d', `M ${bx} ${by} Q ${midX + offsetX} ${midY + offsetY} ${rx} ${ry}`);
            }
        });

        requestAnimationFrame(update);
    }

    update();
}

document.addEventListener('DOMContentLoaded', () => {
    randomizePositions();
    setTimeout(animateLinks, 100);
});
