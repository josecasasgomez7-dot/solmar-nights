// The city of Solmar: a road grid with districts — houses, shops, offices,
// towers, a hotel, a working port in the south-east, parks, a plaza, and a
// beach with the sea along the south edge. This file also owns the whole game
// state and the helpers (road tests, building collision, spawning) that the
// player, traffic, police and mission code all share.

import { WORLD, ROAD_SPACING, ROAD_HALF, PALETTE, PLAYER, MISSIONS, STORY, COIN_VALUE } from './config.js';
import { pick } from './random.js';

export const ROAD_X = [];
export const ROAD_Y = [];
for (let x = 160; x < WORLD.width; x += ROAD_SPACING) ROAD_X.push(x);
for (let y = 160; y < WORLD.height; y += ROAD_SPACING) ROAD_Y.push(y);

export function isRoad(x, y) {
  for (const rx of ROAD_X) if (Math.abs(x - rx) < ROAD_HALF + 14) return true;
  for (const ry of ROAD_Y) if (Math.abs(y - ry) < ROAD_HALF + 14) return true;
  return false;
}

export function nearestRoadX(x) {
  let best = ROAD_X[0];
  for (const rx of ROAD_X) if (Math.abs(rx - x) < Math.abs(best - x)) best = rx;
  return best;
}
export function nearestRoadY(y) {
  let best = ROAD_Y[0];
  for (const ry of ROAD_Y) if (Math.abs(ry - y) < Math.abs(best - y)) best = ry;
  return best;
}

// True when a circle of radius r at (x, y) touches any solid building.
export function collideBuildings(state, x, y, r) {
  for (const b of state.city.buildings) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - cx, dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

// Push an entity out of every building it overlaps, then clamp to the world.
export function resolveBuildings(state, ent, r) {
  for (const b of state.city.buildings) {
    const cx = Math.max(b.x, Math.min(ent.x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(ent.y, b.y + b.h));
    let dx = ent.x - cx, dy = ent.y - cy;
    let d = Math.hypot(dx, dy);
    if (d < r) {
      if (d < 0.001) { dx = 0; dy = -1; d = 1; }
      ent.x = cx + (dx / d) * r;
      ent.y = cy + (dy / d) * r;
    }
  }
  ent.x = Math.max(20, Math.min(WORLD.width - 20, ent.x));
  ent.y = Math.max(20, Math.min(WORLD.height - 20, ent.y));
}

function buildCity(random) {
  const buildings = [], trees = [], parks = [], plazas = [];
  // Districts by block (i = column, j = row of the road grid).
  const parkBlocks = new Set(['4,3', '1,1']);
  const plazaBlocks = new Set(['6,2']);
  const portBlocks = new Set(['8,5', '8,6', '7,6']);
  const hotelBlocks = new Set(['0,0']);
  for (let i = 0; i < ROAD_X.length - 1; i += 1) {
    for (let j = 0; j < ROAD_Y.length - 1; j += 1) {
      const key = `${i},${j}`;
      const x0 = ROAD_X[i] + ROAD_HALF + 18;
      const y0 = ROAD_Y[j] + ROAD_HALF + 18;
      const w = ROAD_SPACING - 2 * ROAD_HALF - 36;
      const h = ROAD_SPACING - 2 * ROAD_HALF - 36;
      if (parkBlocks.has(key)) { parks.push({ x: x0, y: y0, w, h }); continue; }
      if (plazaBlocks.has(key)) { plazas.push({ x: x0, y: y0, w, h }); continue; }
      if (portBlocks.has(key)) {
        // The port: stacked shipping containers and a crane mast, all solid.
        buildings.push({ x: x0, y: y0, w: w * 0.55, h: h * 0.3, kind: 'container', color: pick(random, PALETTE.building.container), tall: false });
        buildings.push({ x: x0 + w * 0.6, y: y0 + h * 0.25, w: w * 0.4, h: h * 0.3, kind: 'container', color: pick(random, PALETTE.building.container), tall: false });
        buildings.push({ x: x0 + w * 0.2, y: y0 + h * 0.62, w: 26, h: h * 0.34, kind: 'container', color: pick(random, PALETTE.building.container), tall: true });
        continue;
      }
      if (hotelBlocks.has(key)) {
        buildings.push({ x: x0, y: y0, w, h, kind: 'hotel', color: pick(random, PALETTE.building.hotel), tall: true });
        continue;
      }
      // Ordinary blocks: one tall building or two smaller ones, with a kind.
      const roll = random();
      const kind = roll < 0.34 ? 'casa' : roll < 0.58 ? 'tienda' : roll < 0.8 ? 'oficina' : 'torre';
      const tall = kind === 'torre' || kind === 'oficina';
      const colors = PALETTE.building[kind];
      buildings.push({
        x: x0, y: y0,
        w: tall ? w : w * 0.46, h: tall ? h : h * 0.46,
        kind, color: pick(random, colors), tall,
      });
      if (!tall) {
        buildings.push({
          x: x0 + w * 0.54, y: y0 + h * 0.54,
          w: w * 0.46, h: h * 0.46,
          kind, color: pick(random, colors), tall: false,
        });
      }
      if (random() < 0.7) trees.push({ x: x0 + w * random(), y: y0 + h * random(), palm: false });
    }
  }
  // Palm trees along the beach, south edge.
  for (let x = 120; x < WORLD.width; x += 260) {
    trees.push({ x: x + random() * 80, y: 2296 + random() * 30, palm: true });
  }
  return { buildings: buildings.filter((b) => b.w > 10), trees, parks, plazas };
}

let carId = 0;
export function makeCar(x, y, angle, kind, color, model = 'sedan') {
  return {
    id: (carId += 1), x, y, angle, speed: 0, color, kind, model,
    axis: 'x', dir: 1, targetSpeed: 0, siren: 0, stuck: 0, reverseT: 0, hitCd: 0,
  };
}

export function carHalfLength(car) { return car.model === 'truck' ? 38 : 27; }

const COIN_SPOTS = [
  [480, 320], [1120, 160], [1760, 480], [2400, 800],
  [320, 1440], [1440, 2080], [2080, 1120], [2720, 160],
];

export function createGame(random) {
  const city = buildCity(random);
  const state = {
    random, time: 0, cash: 0, debt: STORY.debt, debtPaid: false, missionsDone: 0,
    missionIndex: 0, missionStage: 'pickup', missionTime: MISSIONS[0].timeLimit,
    missionMessage: MISSIONS[0].dialog, dialogTimer: 7,
    player: { x: 480, y: 480, angle: 0, health: PLAYER.healthMax, inCar: null, punchCd: 0, busted: 0, run: false },
    cars: [], peds: [], particles: [], skids: [], floats: [],
    pickups: COIN_SPOTS.map(([x, y]) => ({ x, y, value: COIN_VALUE, taken: false })),
    pickupsCollected: 0,
    wanted: 0, wantedTimer: 0, hiddenTimer: 0, sirenTimer: 0, _siren: false,
    camera: { x: 480, y: 480 }, shake: 0, lightTimer: 0, lightNS: true,
    city, over: null, stats: { stolen: 0, punches: 0, crashes: 0, coins: 0 }, paused: false,
  };
  // Parked cars on the streets, one of them a taxi, one a truck.
  const parked = [
    [800, 160, 'sedan'], [1120, 480, 'sedan'], [480, 800, 'taxi'], [1760, 800, 'sedan'],
    [2080, 1440, 'truck'], [1440, 1760, 'sedan'], [2560, 480, 'sedan'], [640, 1440, 'sedan'],
    [2240, 2080, 'taxi'], [960, 1120, 'sedan'],
  ];
  const parkedColors = ['#e8e8e8', '#f2c94c', '#4fc3f7', '#9b7ede', '#7ed07e'];
  parked.forEach(([x, y, model], i) => {
    const color = model === 'taxi' ? PALETTE.taxi : parkedColors[i % parkedColors.length];
    state.cars.push(makeCar(x, y, i % 2 ? 0 : Math.PI / 2, 'parked', color, model));
  });
  // Moving traffic: sedans, taxis and trucks at different speeds.
  for (let i = 0; i < 16; i += 1) {
    const model = random() < 0.18 ? 'truck' : random() < 0.3 ? 'taxi' : 'sedan';
    const rx = ROAD_X[Math.floor(random() * ROAD_X.length)];
    const ry = ROAD_Y[Math.floor(random() * ROAD_Y.length)];
    const onX = random() < 0.5;
    const color = model === 'taxi' ? PALETTE.taxi : pick(random, PALETTE.traffic);
    const c = makeCar(
      onX ? rx : ROAD_X[Math.floor(random() * ROAD_X.length)],
      onX ? ROAD_Y[Math.floor(random() * ROAD_Y.length)] : ry,
      onX ? (random() < 0.5 ? 0 : Math.PI) : (random() < 0.5 ? Math.PI / 2 : -Math.PI / 2),
      'traffic', color, model,
    );
    c.axis = onX ? 'x' : 'y';
    c.dir = c.angle === 0 || c.angle === Math.PI / 2 ? 1 : -1;
    c.targetSpeed = model === 'truck' ? 95 + random() * 25 : model === 'taxi' ? 150 + random() * 40 : 110 + random() * 50;
    state.cars.push(c);
  }
  // Pedestrians: locals, tourists and a few runners, all with their own pace.
  const pedKinds = [
    { kind: 'local', speed: [30, 55] },
    { kind: 'turista', speed: [25, 40] },
    { kind: 'corredor', speed: [60, 85] },
  ];
  for (let i = 0; i < 30; i += 1) {
    const kind = pick(random, pedKinds);
    state.peds.push({
      x: 200 + random() * (WORLD.width - 400),
      y: 200 + random() * (WORLD.height - 400),
      angle: random() * Math.PI * 2,
      speed: kind.speed[0] + random() * (kind.speed[1] - kind.speed[0]),
      kind: kind.kind, flee: 0,
      color: pick(random, PALETTE.ped),
      walkPhase: random() * 10,
    });
  }
  return state;
}

export function addFloat(state, x, y, text, color = '#f2c94c') {
  state.floats.push({ x, y, text, color, life: 1.4 });
}

export function addParticles(state, x, y, color, n = 10) {
  for (let i = 0; i < n; i += 1) {
    const a = state.random() * Math.PI * 2, s = 40 + state.random() * 120;
    state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + state.random() * 0.4, color });
  }
  if (state.particles.length > 300) state.particles.splice(0, state.particles.length - 300);
}

// The world clock: traffic lights, wanted decay while hidden, siren ticks,
// particle/float/skid ageing, health slowly coming back when nobody hunts her.
export function stepWorld(state, dt) {
  state.time += dt;
  state.lightTimer += dt;
  if (state.lightTimer > 8) { state.lightTimer = 0; state.lightNS = !state.lightNS; }
  const policeNear = state.cars.some((c) => c.kind === 'police' &&
    Math.hypot(c.x - state.player.x, c.y - state.player.y) < 420);
  if (state.wanted > 0 && !policeNear) {
    state.hiddenTimer += dt;
    if (state.hiddenTimer > 6) { state.wanted -= 1; state.hiddenTimer = 0; }
  } else state.hiddenTimer = 0;
  if (state.wanted > 0) {
    state.sirenTimer -= dt;
    if (state.sirenTimer <= 0) { state.sirenTimer = 2.2; state._siren = true; }
    else state._siren = false;
  }
  for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const f of state.floats) { f.y -= 24 * dt; f.life -= dt; }
  state.floats = state.floats.filter((f) => f.life > 0);
  for (const s of state.skids) s.life -= dt * 0.4;
  state.skids = state.skids.filter((s) => s.life > 0);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 3);
  if (state.dialogTimer > 0) state.dialogTimer -= dt;
  if (state.wanted === 0 && state.player.health > 0 && state.player.health < PLAYER.healthMax) {
    state.player.health = Math.min(PLAYER.healthMax, state.player.health + 2 * dt);
  }
}
