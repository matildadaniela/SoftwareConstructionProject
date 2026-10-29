// Immutable named values; positive sizes/speed, gap larger than bird height,
// valid opening within ground; shared by simulation/rendering/tests.
const defaults = {
  width: 400, height: 600, groundY: 526, stepSeconds: 1 / 120,
  birdX: 90, birdY: 248, birdWidth: 34, birdHeight: 28,
  gravity: 1512, flapVelocity: -450,
  pipeWidth: 64, gapHeight: 164, pipeSpeed: 156, spawnTicks: 210,
  gapMin: 75, gapMax: 287, maxGapChange: 60, initialSeed: 0x1A2B3C4D,
};

export function createConfig(overrides = {}) {
  const config = { ...defaults, ...overrides };
  for (const [name, value] of Object.entries(config)) {
    if (!Object.hasOwn(defaults, name)) throw new RangeError(`Unknown configuration: ${name}`);
    if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  }
  for (const name of ['width', 'height', 'groundY', 'stepSeconds', 'birdWidth',
    'birdHeight', 'gravity', 'pipeWidth', 'gapHeight', 'pipeSpeed', 'spawnTicks']) {
    if (config[name] <= 0) throw new RangeError(`${name} must be positive`);
  }
  if (!Number.isSafeInteger(config.spawnTicks)) throw new RangeError('spawnTicks must be an integer');
  if (!Number.isInteger(config.initialSeed) || config.initialSeed <= 0 || config.initialSeed > 0xFFFFFFFF) {
    throw new RangeError('initialSeed must be a nonzero unsigned 32-bit integer');
  }
  if (config.flapVelocity >= 0) throw new RangeError('flapVelocity must point upward');
  if (config.groundY > config.height || config.gapHeight <= config.birdHeight ||
      config.gapMin < 0 || config.gapMax < config.gapMin ||
      config.gapMax + config.gapHeight > config.groundY || config.maxGapChange < 0) {
    throw new RangeError('Invalid ground or opening bounds');
  }
  // A fresh ready bird must be inside the world without fatal boundary contact.
  if (config.birdX < 0 || config.birdX + config.birdWidth > config.width ||
      config.birdY <= 0 || config.birdY + config.birdHeight >= config.groundY) {
    throw new RangeError('Initial bird must fit inside the playable world');
  }
  return Object.freeze(config);
}

export const CONFIG = createConfig();
