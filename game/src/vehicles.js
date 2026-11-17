// Traffic and police. Traffic cars follow the road grid, stop at red lights
// and turn at intersections. Police cars spawn when wanted and chase Mara,
// ramming her car and, on foot, getting out to catch her.

import { CAR, WORLD, PALETTE } from './config.js';
import { ROAD_X, ROAD_Y, nearestRoadX, nearestRoadY, makeCar, addParticles } from './world.js';

function atIntersection(x, y) {
  for (const rx of ROAD_X) for (const ry of ROAD_Y) {
    if (Math.abs(x - rx) < 60 && Math.abs(y - ry) < 60) return true;
  }
  return false;
}

function lightIsRed(state, axis) {
  // NS green when lightNS, EW green otherwise.
  return axis === 'x' ? state.lightNS : !state.lightNS;
}

export function updateTraffic(state, dt) {
  for (const c of state.cars) {
    if (c.kind !== 'traffic') continue;
    // Red light: slow to a stop before the intersection.
    let target = c.targetSpeed;
    if (atIntersection(c.x, c.y) && lightIsRed(state, c.axis)) target = 0;
    // Car ahead: don't rear-end it.
    for (const o of state.cars) {
      if (o === c) continue;
      const dx = o.x - c.x, dy = o.y - c.y;
      if (Math.hypot(dx, dy) < 70 && Math.abs(Math.atan2(dy, dx) - c.angle) < 0.5) { target = 0; break; }
    }
    c.speed += Math.max(-300 * dt, Math.min(200 * dt, target - c.speed));
    if (Math.abs(c.speed) < 2) c.speed = 0;
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
    // Turn at an intersection sometimes, staying on the grid.
    if (atIntersection(c.x, c.y) && state.random() < dt * 0.25) {
      const turn = state.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
      c.angle += turn;
      c.axis = c.axis === 'x' ? 'y' : 'x';
      c.x = nearestRoadX(c.x); c.y = nearestRoadY(c.y);
      c.dir = (c.angle === 0 || c.angle === Math.PI / 2) ? 1 : -1;
    }
    if (c.x < 100 || c.x > WORLD.width - 100 || c.y < 100 || c.y > WORLD.height - 100) {
      // Wrap around to the far side so traffic never runs out.
      c.x = 160 + state.random() * (WORLD.width - 320);
      c.y = ROAD_Y[Math.floor(state.random() * ROAD_Y.length)];
      c.axis = 'x'; c.angle = state.random() < 0.5 ? 0 : Math.PI;
    }
  }
}

export function updatePolice(state, dt, audio) {
  // Spawn police to match the wanted level (up to 1 car per star + 1).
  const want = state.wanted > 0 ? Math.min(4, state.wanted + 1) : 0;
  const have = state.cars.filter((c) => c.kind === 'police').length;
  if (have < want) {
    const angle = state.random() * Math.PI * 2;
    const px = state.player.x + Math.cos(angle) * 700;
    const py = state.player.y + Math.sin(angle) * 700;
    const car = makeCar(
      Math.max(120, Math.min(WORLD.width - 120, px)),
      Math.max(120, Math.min(WORLD.height - 120, py)), 0, 'police', PALETTE.police);
    car.targetSpeed = CAR.policeSpeed;
    state.cars.push(car);
  }
  for (const c of state.cars) {
    if (c.kind !== 'police') continue;
    const p = state.player;
    const dx = p.x - c.x, dy = p.y - c.y;
    const dist = Math.hypot(dx, dy) || 1;
    const wantAngle = Math.atan2(dy, dx);
    let diff = wantAngle - c.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.angle += Math.max(-2.8 * dt, Math.min(2.8 * dt, diff));
    c.speed = Math.min(CAR.policeSpeed, c.speed + 380 * dt);
    // Police drive on the streets too: slide along buildings, never over roofs.
    const nx = c.x + Math.cos(c.angle) * c.speed * dt;
    const ny = c.y + Math.sin(c.angle) * c.speed * dt;
    const blocked = (x, y) => state.city.buildings.some((b) => x > b.x - 24 && x < b.x + b.w + 24 && y > b.y - 24 && y < b.y + b.h + 24);
    if (!blocked(nx, c.y)) c.x = nx; else c.speed *= 0.5;
    if (!blocked(c.x, ny)) c.y = ny; else c.speed *= 0.5;
    c.siren += dt;
    if (c.hitCd > 0) c.hitCd -= dt;
    // Ram the player: a hit every half second at most, so a chase is
    // survivable and health is a real resource, not a timer.
    if (dist < 48) {
      if (!p.inCar) {
        p.busted += dt;
        if (p.busted > 1.4) state.over = 'busted';
      } else if (c.hitCd <= 0) {
        c.hitCd = 0.5;
        const pc = state.cars.find((v) => v.id === p.inCar);
        if (pc) pc.speed *= 0.6;
        p.health -= 7;
        state.shake = 0.6;
        addParticles(state, c.x, c.y, '#ffd24d', 4);
        if (audio) audio.crash();
      }
    } else if (!p.inCar) p.busted = Math.max(0, p.busted - dt);
    if (dist > 1400) { c.x = p.x + (state.random() < 0.5 ? -700 : 700); c.y = p.y + (state.random() < 0.5 ? -700 : 700); }
  }
  // Wanted fades: remove police cars when the heat is gone.
  if (state.wanted === 0) {
    state.cars = state.cars.filter((c) => c.kind !== 'police' || Math.hypot(c.x - state.player.x, c.y - state.player.y) > 900);
    // Any police left far away simply despawn.
    state.cars = state.cars.filter((c) => c.kind !== 'police' || Math.hypot(c.x - state.player.x, c.y - state.player.y) < 900);
  }
}

export function carHits(state, audio) {
  // Player car vs traffic / parked cars: bump, sparks, small damage.
  const p = state.player;
  if (!p.inCar) return;
  const pc = state.cars.find((c) => c.id === p.inCar);
  if (!pc) return;
  for (const c of state.cars) {
    if (c === pc || c.kind === 'player') continue;
    const d = Math.hypot(c.x - pc.x, c.y - pc.y);
    if (d < 52 && Math.abs(pc.speed) > 80) {
      pc.speed *= 0.5; c.speed = 40;
      c.x += (c.x - pc.x) / (d || 1) * 30; c.y += (c.y - pc.y) / (d || 1) * 30;
      state.stats.crashes += 1; state.shake = 0.4;
      addParticles(state, pc.x, pc.y, '#ffd24d', 8);
      if (audio) audio.crash();
    }
  }
}
