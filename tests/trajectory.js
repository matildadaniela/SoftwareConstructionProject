// Validation-only legal controller. Production never imports this file.
import { CONFIG } from '../config.js';
import { restartRound, stepRound } from '../simulation.js';

export function traversalInput(round) {
  const pair = round.pairs.find(pair => pair.x + pair.width >= round.bird.x - 5);
  const centerY = pair
    ? pair.gapTop + pair.gapHeight / 2 - round.bird.height / 2 : CONFIG.birdY;
  return round.bird.y > centerY + 22 && round.bird.velocityY > 0
    ? [{ type: 'flap' }] : [];
}

// Precompute tick-indexed presses, then coast into a real loss. No state edits,
// collision bypass, clock or randomness outside the production seeded generator.
export function scriptedFlight(aliveTicks = 1600) {
  const round = restartRound();
  const presses = [];
  const states = [];
  while (round.phase === 'playing' && round.activeTick < aliveTicks + 1000) {
    const inputs = round.activeTick < aliveTicks ? traversalInput(round) : [];
    if (inputs.length) presses.push(round.activeTick + 1);
    stepRound(round, CONFIG, inputs);
    states.push(structuredClone(round));
  }
  if (round.phase !== 'game-over') throw Error('Script must end with a real loss');
  return { presses, states, terminal: structuredClone(round) };
}
