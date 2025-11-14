const game = document.getElementById("game");
const player = document.getElementById("player");
const overlay = document.getElementById("overlay");
const scoreEl = document.getElementById("score");

let pos = { x: 0.5, y: 0.5 };
let speed = 0.48;
let keys = {};
let lastTime = performance.now();
let score = 0;

let spotRadius = 150;
let spawnRate = 1150;
let obstacleSpeed = 2200;

let traps = [];
let redDotActive = false;

let containerRect = game.getBoundingClientRect();
function updateBounds() {
    containerRect = game.getBoundingClientRect();
    const diag = Math.sqrt(containerRect.width ** 2 + containerRect.height ** 2);
    spotRadius = Math.max(80, diag * 0.11);
    document.documentElement.style.setProperty("--spot-r", spotRadius);
}
window.addEventListener("resize", updateBounds);
updateBounds();

function updateOverlay() {
    overlay.style.background = `
        radial-gradient(circle at ${pos.x * 100}% ${pos.y * 100}%,
        rgba(0,0,0,0) 0px,
        rgba(0,0,0,0) calc(var(--spot-r) * 1px),
        rgba(0,0,0,0.92) calc((var(--spot-r) + 75px) * 1px)
    )`;
}

function renderPlayer() {
    player.style.left = `${pos.x * 100}%`;
    player.style.top = `${pos.y * 100}%`;
}

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});


game.addEventListener("touchmove", e => {
    const t = e.touches[0];
    const rect = game.getBoundingClientRect();
    pos.x = (t.clientX - rect.left) / rect.width;
    pos.y = (t.clientY - rect.top) / rect.height;
});


function gameLoop(t) {
    const dt = (t - lastTime) / 1000;
    lastTime = t;

    const move = dt * speed;

    if (keys["w"] || keys["arrowup"]) pos.y -= move;
    if (keys["s"] || keys["arrowdown"]) pos.y += move;
    if (keys["a"] || keys["arrowleft"]) pos.x -= move;
    if (keys["d"] || keys["arrowright"]) pos.x += move;

    pos.x = Math.max(0.02, Math.min(0.98, pos.x));
    pos.y = Math.max(0.02, Math.min(0.98, pos.y));

    renderPlayer();
    updateOverlay();
    updateTraps();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);


function spawnTrap() {
    const weightedTypes = [
        { type: "appear-when-near", weight: 0.40 },
        { type: "outside-light",    weight: 0.35 },
        { type: "teleport",         weight: 0.15 },
        { type: "visible-in-light", weight: 0.10 }
    ];

    let r = Math.random(), sum = 0, chosen = "appear-when-near";
    for (let w of weightedTypes) {
        sum += w.weight;
        if (r <= sum) { chosen = w.type; break; }
    }

    const t = document.createElement("div");
    t.classList.add("trap", chosen);
    t.dataset.type = chosen;

    if (chosen === "outside-light") {
        t.style.background = "#ff2b2b";
        t.style.boxShadow = "0 0 14px rgba(255,0,0,0.5)";
    }

    const size = Math.random() * 22 + 20;
    t.style.width = `${size}px`;
    t.style.height = `${size}px`;

    let nx = Math.random(), ny = Math.random();
    if (Math.abs(nx - pos.x) < 0.12 && Math.abs(ny - pos.y) < 0.12) {
        nx = (nx + 0.3) % 1;
        ny = (ny + 0.3) % 1;
    }

    t.dataset.nx = nx;
    t.dataset.ny = ny;
    t.style.left = `${nx * 100}%`;
    t.style.top  = `${ny * 100}%`;

    traps.push(t);
    game.appendChild(t);

    setTimeout(() => {
        if (t.parentElement) {
            t.remove();
            traps = traps.filter(x => x !== t);
        }
    }, obstacleSpeed);
}

function startSpawnLoop() {
    setInterval(() => {
        const burst = Math.floor(Math.random() * 3) + 10;
        for (let i = 0; i < burst; i++) spawnTrap();
    }, spawnRate);
}
startSpawnLoop();

function spawnRedDot() {
    if (redDotActive) return;
    redDotActive = true;

    const t = document.createElement("div");
    t.classList.add("trap", "shadow-chaser");
    t.dataset.type = "shadow-chaser";

    t.style.width = "25px";
    t.style.height = "25px";
    t.style.background = "#ff3333";
    t.style.boxShadow = "0 0 20px red";

    let nx = Math.random(), ny = Math.random();
    t.dataset.nx = nx;
    t.dataset.ny = ny;

    t.style.left = `${nx * 100}%`;
    t.style.top  = `${ny * 100}%`;

    traps.push(t);
    game.appendChild(t);
}

function scheduleRedDot() {
    redDotActive = false;
    const delay = Math.random() * 30000;
    setTimeout(() => {
        if (!redDotActive) spawnRedDot();
    }, delay);
}
scheduleRedDot();

function updateTraps() {
    const playerRect = player.getBoundingClientRect();
    const pCx = playerRect.left + playerRect.width / 2;
    const pCy = playerRect.top + playerRect.height / 2;
    const pRadius = Math.max(playerRect.width, playerRect.height) / 2;

    for (let t of traps) {
        let nx = parseFloat(t.dataset.nx);
        let ny = parseFloat(t.dataset.ny);

        let tx = containerRect.left + nx * containerRect.width;
        let ty = containerRect.top + ny * containerRect.height;

        const dx = tx - pCx;
        const dy = ty - pCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const type = t.dataset.type;

        if (type === "visible-in-light")
            t.style.opacity = dist <= spotRadius ? 1 : 0.05;

        if (type === "appear-when-near")
            t.style.opacity = dist <= spotRadius * 0.75 ? 1 : 0.05;

        if (type === "outside-light")
            t.style.opacity = dist > spotRadius ? 1 : 0.05;

        if (type === "teleport" && Math.random() < 0.004) {
            nx = Math.random(); ny = Math.random();
            t.dataset.nx = nx; t.dataset.ny = ny;
            t.style.left = `${nx * 100}%`;
            t.style.top  = `${ny * 100}%`;
        }

        if (type === "shadow-chaser") {
            const chaseSpeed = 0.0035;
            nx += dx > 0 ? -chaseSpeed : chaseSpeed;
            ny += dy > 0 ? -chaseSpeed : chaseSpeed;

            nx = Math.max(0.02, Math.min(0.98, nx));
            ny = Math.max(0.02, Math.min(0.98, ny));

            t.dataset.nx = nx;
            t.dataset.ny = ny;

            t.style.left = `${nx * 100}%`;
            t.style.top  = `${ny * 100}%`;

            tx = containerRect.left + nx * containerRect.width;
            ty = containerRect.top + ny * containerRect.height;
        }

        const trapRect = t.getBoundingClientRect();
        const tCx = trapRect.left + trapRect.width / 2;
        const tCy = trapRect.top + trapRect.height / 2;
        const trapRadius = Math.max(trapRect.width, trapRect.height) / 2;

        if (parseFloat(getComputedStyle(t).opacity) > 0.15) {
            if (Math.hypot(tCx - pCx, tCy - pCy) < trapRadius + pRadius * 0.75)
                die();
        }
    }
}

function die() {
    speed = 0;
    keys = {};

    clearInterval(scoreInterval);

    document.getElementById("finalScore").textContent = score;
    document.getElementById("gameOverScreen").classList.remove("hidden");
}

let scoreInterval = setInterval(() => {
    score++;
    scoreEl.textContent = score;
}, 350);

setInterval(() => {
    spawnRate = Math.max(350, spawnRate - 90);
    obstacleSpeed = Math.max(900, obstacleSpeed - 70);
    spotRadius = Math.max(60, spotRadius - 4);
    document.documentElement.style.setProperty("--spot-r", spotRadius);

    if (Math.random() < 0.4) {
        overlay.style.opacity = 0.25;
        setTimeout(() => (overlay.style.opacity = 1), 160);
    }
}, 7500);

window.addEventListener("load", () => {
    updateBounds();
    renderPlayer();
    updateOverlay();

    document.getElementById("restartBtn").addEventListener("click", () => {
    location.reload();
});

});
