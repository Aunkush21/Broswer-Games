let game = document.querySelector(".game-container");
let player = document.getElementById("player");
let scoreText = document.getElementById("scoreText");

let gravityFlipped = false;
let score = 0;

let obstacleSpeed = 2000; 
let spawnRate = 1300;
let flipCooldown = false;

function shakeScreen() {
  game.style.transition = "0s";
  game.style.transform = "translateX(5px)";
  setTimeout(() => game.style.transform = "translateX(-5px)", 50);
  setTimeout(() => game.style.transform = "translateX(0px)", 100);
}

function flashBang() {
  let f = document.createElement("div");
  f.style.position = "fixed";
  f.style.top = 0;
  f.style.left = 0;
  f.style.width = "100%";
  f.style.height = "100%";
  f.style.background = "white";
  f.style.opacity = "1";
  f.style.zIndex = "999";

  document.body.appendChild(f);

  setTimeout(() => {
    f.style.transition = "0.4s";
    f.style.opacity = "0";
  }, 60);

  setTimeout(() => f.remove(), 500);

  setTimeout(flashBang, Math.random() * 9000 + 8000);
}
setTimeout(flashBang, 5000);

function flipGravity() {
    if (flipCooldown) return;
    flipCooldown = true;
    setTimeout(() => flipCooldown = false, 150);

    shakeScreen();

    if (Math.random() < 0.066) gravityFlipped = !gravityFlipped;

    gravityFlipped = !gravityFlipped;

    if (gravityFlipped) {
        player.style.bottom = "";
        player.style.top = "0px";
    } else {
        player.style.top = "";
        player.style.bottom = "0px"; 
    }
}


document.body.addEventListener("keydown", e => {
  if (e.code === "Space") flipGravity();
});
document.body.addEventListener("click", flipGravity);

function spawnObstacle() {
  let obs = document.createElement("div");
  obs.classList.add("obstacle");

  let isTop = Math.random() < 0.5;
  let invisible = Math.random() < 0.10;
  let fake = Math.random() < 0.08;
  let swap = Math.random() < 0.22;

  let h = Math.random() * 30 + 20;
  obs.style.height = h + "px";

  if (isTop) obs.style.top = "0px";
  else obs.style.bottom = "0px";

  if (invisible) obs.style.opacity = "0";

  let duration = obstacleSpeed / 1000;
  if (Math.random() < 0.2) {
    duration *= 0.5;
    obs.style.background = "yellow";
  }

  obs.style.animation = `move ${duration}s linear forwards`;
  game.appendChild(obs);

  if (fake) {
    setTimeout(() => obs.remove(), 900);
  }

  if (swap) {
    setTimeout(() => {
      if (isTop) {
        obs.style.top = "";
        obs.style.bottom = "0";
      } else {
        obs.style.bottom = "";
        obs.style.top = "0";
      }
    }, obstacleSpeed / 2);
  }

  if (invisible) {
    setTimeout(() => {
      obs.style.transition = "0.15s";
      obs.style.opacity = "1";
    }, obstacleSpeed - 300);
  }

  setTimeout(() => obs.remove(), obstacleSpeed + 800);
}

const collisionInterval = setInterval(() => {
  try {
    let p = player.getBoundingClientRect();
    let obstacles = document.querySelectorAll(".obstacle");

    for (let i = 0; i < obstacles.length; i++) {
      let r = obstacles[i].getBoundingClientRect();

      if (
        p.right > r.left &&
        p.left < r.right &&
        p.bottom > r.top &&
        p.top < r.bottom
      ) {
        if (typeof grscoreInterval !== 'undefined') clearInterval(grscoreInterval);

        clearInterval(collisionInterval);

        spawnRate = 9999999;
        obstacleSpeed = 9999999;

        const finalScoreEl = document.getElementById("grFinalScore");
        const gameOverEl = document.getElementById("grGameOver");
        if (finalScoreEl) finalScoreEl.textContent = score;
        if (gameOverEl) gameOverEl.classList.remove("gr-hidden");

        return;
      }
    }
  } catch (err) {
    console.error("Collision check error:", err);
  }
}, 10);

setInterval(() => {
  obstacleSpeed *= 0.6;
  setTimeout(() => obstacleSpeed /= 0.6, 1600);
}, 12000);

setInterval(() => {
  obstacleSpeed -= 120;
  spawnRate -= 90;

  if (spawnRate < 450) spawnRate = 450;
  if (obstacleSpeed < 650) obstacleSpeed = 650;

}, 7000);

let grScoreInterval = setInterval(() => {
  score++;
  scoreText.textContent = score;
}, 380);

function loopSpawn() {
  spawnObstacle();
  setTimeout(loopSpawn, spawnRate);
}
loopSpawn();

document.getElementById("grRestartBtn").addEventListener("click", () => {
    location.reload();
});
window.addEventListener('load', () => {
  const restartBtn = document.getElementById("grRestartBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      location.reload();
    });
  } else {
    console.warn("grRestartBtn not found in DOM — add the Game Over HTML block to index.html");
  }
});
