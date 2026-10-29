import { CONFIG } from './config.js';

const INK = '#14243b';
const CREAM = '#fff7d6';

function block(context, color, x, y, width, height) {
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
}

function drawSky(context, config, seconds) {
  block(context, '#62c9cf', 0, 0, config.width, config.groundY);
  block(context, '#ffd65a', config.width - 82, 44, 42, 42);
  // Deterministic decoration uses presentation time only, never obstacle RNG.
  for (let index = 0; index < 5; index++) {
    const x = ((index * 103 + seconds * 9) % (config.width + 80)) - 80;
    const y = 100 + (index % 3) * 58;
    block(context, '#def5dc', x + 12, y, 36, 12);
    block(context, '#def5dc', x, y + 12, 72, 12);
  }
  for (let x = 0; x < config.width; x += 32) {
    const height = 24 + ((x / 32) % 3) * 14;
    block(context, '#419fa9', x, config.groundY - height, 30, height);
    block(context, '#81e6dc', x + 8, config.groundY - height + 8, 6, 6);
  }
}

function drawPipe(context, x, y, width, height, capAtBottom) {
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  // The outer silhouette fills the collision rectangle; the cap stays inside it.
  block(context, INK, x, y, width, height);
  block(context, '#329b66', x + 3, y + 3, width - 6, height - 6);
  block(context, '#9aeb76', x + 7, y + 3, 10, height - 6);
  block(context, '#207554', x + width - 13, y + 3, 8, height - 6);
  const capY = capAtBottom ? y + height - 20 : y;
  block(context, INK, x, capY, width, 20);
  block(context, '#68d879', x + 3, capY + 3, width - 6, 14);
  block(context, '#c4f58a', x + 6, capY + 4, width - 12, 4);
  context.restore();
}

function drawBird(context, bird, seconds) {
  const { x, y, width, height } = bird;
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  // No bobbing or rotation: visible outer edges match the full contact box.
  block(context, INK, x, y, width, height);
  block(context, '#ffd65a', x + 2, y + 2, width - 4, height - 4);
  block(context, '#dc9a32', x + 2, y + height - 7, width - 4, 5);
  block(context, CREAM, x + width * 0.57, y + 3, width * 0.32, height * 0.48);
  block(context, INK, x + width * 0.76, y + 6, 4, 7);
  block(context, '#f47553', x + width * 0.65, y + height * 0.62, width * 0.35, 6);
  const wingY = y + height * (Math.floor(seconds * 8) % 2 ? 0.38 : 0.56);
  block(context, INK, x + 3, wingY, width * 0.42, 7);
  block(context, '#fff09a', x + 4, wingY + 1, width * 0.32, 4);
  context.restore();
}

function drawGround(context, config, seconds) {
  block(context, INK, 0, config.groundY, config.width, config.height - config.groundY);
  block(context, '#9aeb76', 0, config.groundY + 3, config.width, 10);
  block(context, '#dc9a32', 0, config.groundY + 16, config.width, config.height - config.groundY - 16);
  // Ground never scrolls as a gameplay entity; only these inset lights shimmer.
  for (let x = 8; x < config.width; x += 24) {
    const lit = (Math.floor(seconds * 3) + x / 24) % 3 < 1;
    block(context, lit ? CREAM : '#ac702a', x, config.groundY + 25, 8, 4);
  }
}

function text(context, content, x, y, size, color = CREAM) {
  context.font = `bold ${size}px ui-monospace, monospace`;
  context.fillStyle = color;
  context.fillText(content, x, y);
}

function drawOverlay(context, round, config) {
  if (round.phase === 'playing') return;
  const messages = {
    ready: ['READY TO FLY', 'Space / ↑ or click / tap', 'Start game below to take flight'],
    paused: ['FLIGHT PAUSED', 'Space / ↑ or click / tap to resume', 'Your flight is waiting for you'],
    'game-over': ['GAME OVER', `Final score: ${round.score}`, 'Tap to try again · Restart game'],
  };
  const [title, instruction, detail] = messages[round.phase];
  const top = config.height * 0.23;
  block(context, 'rgba(11, 25, 43, 0.48)', 0, 0, config.width, config.groundY);
  block(context, '#ffd65a', 20, top, config.width - 40, 120);
  block(context, INK, 24, top + 4, config.width - 48, 112);
  text(context, title, config.width / 2, top + 32, 25, '#ffd65a');
  text(context, instruction, config.width / 2, top + 66, 14);
  text(context, detail, config.width / 2, top + 94, 12, '#81e6dc');
}

// Timestamp is optional presentation time in milliseconds (e.g. RAF time).
// No retained view state, DOM, clock reads, random calls or simulation writes.
// Call synchronously with a replacement playing round to draw a complete reset.
export function render(context, round, config = CONFIG, timestamp = 0) {
  const seconds = Number.isFinite(timestamp) ? Math.max(0, timestamp) / 1000 : 0;
  context.save();
  try {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.imageSmoothingEnabled = false;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.beginPath();
    context.rect(0, 0, config.width, config.height);
    context.clip();
    drawSky(context, config, seconds);
    for (const pair of round.pairs) {
      drawPipe(context, pair.x, 0, pair.width, pair.gapTop, true);
      const lowerY = pair.gapTop + pair.gapHeight;
      drawPipe(context, pair.x, lowerY, pair.width, config.groundY - lowerY, false);
    }
    drawBird(context, round.bird, seconds);
    drawGround(context, config, seconds);
    block(context, INK, config.width / 2 - 44, 12, 88, 48);
    text(context, String(round.score), config.width / 2, 37, 30, '#ffd65a');
    drawOverlay(context, round, config);
  } finally {
    context.restore();
  }
}
