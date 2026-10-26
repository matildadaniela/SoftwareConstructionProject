const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const restartButton = document.getElementById("restartButton");

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = 526;
const STORAGE_KEY = "flappy-pixel-high-score";

const bird = { x: 90, y: 248, width: 34, height: 28, velocity: 0 };
const GRAVITY = 0.42;
const JUMP = -7.5;
const PIPE_WIDTH = 64;
const PIPE_GAP = 164;
const PIPE_SPEED = 2.6;
const PIPE_INTERVAL = 105; // measured in frames at 60 fps

let pipes = [];
let particles = [];
let pipeTimer = 0;
let score = 0;
let highScore = loadHighScore();
let state = "ready"; // ready, playing, over
let tick = 0;
let groundScroll = 0;
let lastTime = null;

// localStorage makes the best score persist after refreshing or closing the tab.
function loadHighScore() {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(saved) && saved > 0 ? Math.floor(saved) : 0;
  } catch {
    return 0; // still playable if the browser disables storage
  }
}

function saveHighScore() {
  try { localStorage.setItem(STORAGE_KEY, String(highScore)); }
  catch { /* Storage may be blocked by browser settings. */ }
}

function animateNumber(element) {
  element.classList.remove("pop");
  void element.offsetWidth; // restart the CSS animation
  element.classList.add("pop");
}

function updateScore() {
  scoreEl.textContent = String(score);
  animateNumber(scoreEl);
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = String(highScore);
    animateNumber(highScoreEl);
    saveHighScore();
  }
}

highScoreEl.textContent = String(highScore);

function resetGame() {
  bird.y = 248;
  bird.velocity = 0;
  pipes = [];
  particles = [];
  pipeTimer = 0;
  score = 0;
  scoreEl.textContent = "0";
  state = "ready";
}

function flap() {
  if (state === "over") resetGame();
  if (state === "ready") state = "playing";
  bird.velocity = JUMP;
  // Tiny pixel trails make the jump feel livelier.
  for (let i = 0; i < 4; i++) {
    particles.push({
      x: bird.x + 8 - i * 5,
      y: bird.y + bird.height / 2,
      vx: -1 - Math.random(),
      vy: (Math.random() - 0.5) * 2,
      life: 22,
      color: i % 2 ? "#ffffff" : "#ffe365"
    });
  }
}

window.addEventListener("keydown", event => {
  if ((event.code === "Space" || event.code === "ArrowUp") && !event.repeat) {
    event.preventDefault();
    flap();
  }
});
canvas.addEventListener("pointerdown", flap);
restartButton.addEventListener("click", resetGame);

function spawnPipe() {
  const minTop = 75;
  const maxTop = GROUND_Y - PIPE_GAP - 75;
  pipes.push({
    x: W,
    topHeight: minTop + Math.random() * (maxTop - minTop),
    passed: false
  });
}

function hitPipe(pipe) {
  const margin = 5; // make collision slightly forgiving
  const birdLeft = bird.x + margin;
  const birdRight = bird.x + bird.width - margin;
  const birdTop = bird.y + margin;
  const birdBottom = bird.y + bird.height - margin;
  const withinX = birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH;
  return withinX && (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP);
}

function update(dt) {
  tick += dt;
  groundScroll = (groundScroll + 2 * dt) % 32;

  // Confetti, clouds and the moving ground are animated every frame.
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);

  if (state !== "playing") return;

  bird.velocity += GRAVITY * dt;
  bird.y += bird.velocity * dt;

  pipeTimer += dt;
  if (pipeTimer >= PIPE_INTERVAL) {
    pipeTimer -= PIPE_INTERVAL;
    spawnPipe();
  }

  for (const pipe of pipes) {
    pipe.x -= PIPE_SPEED * dt;

    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score++;
      updateScore();
      for (let i = 0; i < 14; i++) {
        particles.push({
          x: bird.x + bird.width / 2,
          y: bird.y + bird.height / 2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 35,
          color: i % 2 ? "#ffdf4a" : "#fb65ac"
        });
      }
    }

    if (hitPipe(pipe)) state = "over";
  }
  pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

  if (bird.y < 0 || bird.y + bird.height >= GROUND_Y) {
    bird.y = Math.max(0, Math.min(GROUND_Y - bird.height, bird.y));
    state = "over";
  }
}

function rectangle(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
}

function drawCloud(x, y, size) {
  const s = size;
  rectangle(x + 12*s, y, 32*s, 12*s, "#ffffff");
  rectangle(x, y + 12*s, 62*s, 16*s, "#ffffff");
  rectangle(x + 9*s, y + 28*s, 48*s, 6*s, "#b6f2fb");
}

function drawBackground() {
  rectangle(0, 0, W, H, "#86e6f7");
  rectangle(0, 330, W, GROUND_Y - 330, "#6bd8e4");
  rectangle(0, 415, W, GROUND_Y - 415, "#5dcfbb");

  // Pixel sun and glimmering rays
  const sunX = 302, sunY = 137;
  rectangle(sunX - 23, sunY - 33, 46, 65, "#ffe677");
  rectangle(sunX - 34, sunY - 22, 68, 44, "#ffe677");
  rectangle(sunX - 20, sunY - 28, 40, 11, "#fff4b9");
  const blink = Math.sin(tick * 0.045) * 3;
  rectangle(sunX - 48, sunY - 3, 9 + blink, 6, "#fff0ac");
  rectangle(sunX + 42, sunY - 3, 9 + blink, 6, "#fff0ac");

  // Two repeating layers of side-scrolling clouds
  for (let i = 0; i < 5; i++) {
    const x = ((i * 144 - tick * 0.25) % 720 + 720) % 720 - 110;
    const y = 110 + (i % 3) * 73 + Math.sin(tick * 0.018 + i) * 3;
    drawCloud(x, y, i % 2 ? 0.68 : 0.88);
  }

  // Pixel-block mountains scroll more slowly than the pipes.
  for (let i = -1; i < 6; i++) {
    const x = i * 110 - (tick * 0.45 % 110);
    rectangle(x + 17, 463, 75, GROUND_Y - 463, "#50b3a4");
    rectangle(x + 31, 446, 48, 18, "#50b3a4");
    rectangle(x + 44, 434, 21, 14, "#50b3a4");
    rectangle(x + 18, 482, 24, 8, "#74d5b1");
  }
}

function drawPipe(pipe) {
  const x = Math.round(pipe.x);
  const top = Math.round(pipe.topHeight);
  const lowerY = top + PIPE_GAP;

  // Main green pipe, contrasting edges and brighter central band
  function segment(y, h) {
    rectangle(x, y, PIPE_WIDTH, h, "#246847");
    rectangle(x + 5, y, PIPE_WIDTH - 10, h, "#4ec65a");
    rectangle(x + 12, y, 14, h, "#a4f67d");
    rectangle(x + PIPE_WIDTH - 14, y, 7, h, "#2a9a54");
  }
  segment(0, top);
  segment(lowerY, GROUND_Y - lowerY);

  // Pipe lips: big rectangular pixels in a classic arcade style
  for (const y of [top - 20, lowerY]) {
    rectangle(x - 6, y, PIPE_WIDTH + 12, 20, "#246847");
    rectangle(x - 2, y + 3, PIPE_WIDTH + 4, 13, "#64df6e");
    rectangle(x + 7, y + 3, 12, 13, "#b8fb8a");
    rectangle(x + PIPE_WIDTH, y + 3, 5, 13, "#369d57");
  }
}

function drawBird() {
  // Ready-state bob; rotating body and moving wing during flight.
  const displayY = state === "ready" ? bird.y + Math.sin(tick * 0.08) * 7 : bird.y;
  const angle = state === "playing" ? Math.max(-0.38, Math.min(0.85, bird.velocity * 0.085)) : 0;
  const wingY = Math.sin(tick * 0.4) > 0 ? 12 : 18;

  ctx.save();
  ctx.translate(bird.x + bird.width/2, displayY + bird.height/2);
  ctx.rotate(angle);
  ctx.translate(-bird.width/2, -bird.height/2);

  // Chunky 8-bit sprite
  rectangle(3, 0, 25, 28, "#68465d");
  rectangle(0, 6, 34, 17, "#68465d");
  rectangle(4, 3, 26, 23, "#ffdd45");
  rectangle(1, 9, 32, 12, "#ffdd45");
  rectangle(4, 4, 12, 6, "#fff08c");
  rectangle(9, wingY, 16, 9, "#ec9a40");
  rectangle(11, wingY + 1, 12, 5, "#fff2b2");
  rectangle(24, 6, 7, 11, "#ffffff");
  rectangle(29, 10, 3, 5, "#292046");
  rectangle(32, 16, 10, 7, "#f18a55");
  rectangle(34, 16, 7, 3, "#ffd076");
  ctx.restore();
}

function drawGround() {
  rectangle(0, GROUND_Y, W, 6, "#2b795b");
  rectangle(0, GROUND_Y + 6, W, 12, "#a2e772");
  rectangle(0, GROUND_Y + 18, W, H - GROUND_Y - 18, "#e0a568");
  for (let x = -32; x < W + 32; x += 32) {
    const offsetX = x - groundScroll;
    rectangle(offsetX, GROUND_Y + 24, 15, 9, "#f9c781");
    rectangle(offsetX + 16, GROUND_Y + 42, 15, 9, "#bd7f50");
    rectangle(offsetX + 5, GROUND_Y + 59, 14, 6, "#f9c781");
  }
}

function drawParticles() {
  for (const p of particles) {
    rectangle(p.x, p.y, p.life < 12 ? 3 : 5, p.life < 12 ? 3 : 5, p.color);
  }
}

function text(message, x, y, size, color = "white") {
  ctx.font = `900 ${size}px "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#2e2458";
  ctx.fillText(message, x + 3, y + 4);
  ctx.fillStyle = color;
  ctx.fillText(message, x, y);
}

function drawOverlay() {
  if (state === "playing") return;
  const y = state === "ready" ? 334 : 238;
  rectangle(40, y, W - 80, 142, "#2a245b");
  rectangle(46, y + 6, W - 92, 130, "#684da8");
  rectangle(52, y + 12, W - 104, 118, "#2f2a67");

  if (state === "ready") {
    text("READY?", W/2, y + 39, 33, "#ffe66d");
    text("TAP TO FLY!", W/2, y + 83, 21, "#ffffff");
    text("AVOID THE PIPES", W/2, y + 112, 14, "#93f9ea");
  } else {
    text("GAME OVER", W/2, y + 35, 30, "#ff86b3");
    text(`SCORE ${score}  BEST ${highScore}`, W/2, y + 80, 16, "#ffe66d");
    text("TAP TO TRY AGAIN", W/2, y + 113, 15, "#ffffff");
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  for (const pipe of pipes) drawPipe(pipe);
  drawParticles();
  drawBird();
  drawGround();
  drawOverlay();
}

function gameLoop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  // Limit huge jumps when returning to a tab that was inactive.
  const dt = Math.min((timestamp - lastTime) / (1000/60), 2);
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);