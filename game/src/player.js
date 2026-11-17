// Mara Vega on foot and behind the wheel: movement, running, car entry and
// theft, driving physics, building and car collision, skid marks.

import { PLAYER, CAR, WORLD } from './config.js';
import { resolveBuildings, isRoad, addParticles, addFloat } from './world.js';

function nearestCar(state, maxDist) {
  let best = null, bestD = maxDist;
  for (const c of state.cars) {
    if (c.kind === 'police') continue;
    const d = Math.hypot(c.x - state.player.x, c.y - state.player.y);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

export function tryEnterCar(state, audio) {
  const p = state.player;
  if (p.inCar) {
    const car = state.cars.find((c) => c.id === p.inCar);
    if (car) {
      car.kind = 'parked'; car.speed = 0;
      p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 40;
      p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 40;
      p.inCar = null; p.angle = car.angle;
    }
    return;
  }
  const car = nearestCar(state, 70);
  if (!car) return;
  const wasParked = car.kind === 'parked';
  const wasTraffic = car.kind === 'traffic';
  car.kind = 'player'; car.speed = 0;
  p.inCar = car.id;
  if (wasTraffic) {
    state.wanted = Math.min(5, state.wanted + 1);
    state.stats.stolen += 1;
    addFloat(state, p.x, p.y - 30, '¡Coche robado! +1 estrella', '#e5534b');
    addParticles(state, car.x, car.y, '#e5534b', 8);
    if (audio) audio.horn();
  } else if (wasParked) {
    state.stats.stolen += 1;
    // A parked car is only witnessed if police or a pedestrian is close.
    const witnessed = state.cars.some((c) => c.kind === 'police' && Math.hypot(c.x - p.x, c.y - p.y) < 380) ||
      state.peds.some((pd) => Math.hypot(pd.x - p.x, pd.y - p.y) < 160);
    if (witnessed) { state.wanted = Math.min(5, state.wanted + 1); addFloat(state, p.x, p.y - 30, '¡Te vieron robar! +1 estrella', '#e5534b'); }
    else addFloat(state, p.x, p.y - 30, 'Coche robado', '#f2c94c');
  }
}

function driveCar(state, car, input, dt, audio) {
  const fwd = (input.up ? 1 : 0) - (input.down ? 1 : 0);
  const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  if (fwd > 0) car.speed += CAR.accel * dt;
  else if (fwd < 0) car.speed -= (car.speed > 0 ? CAR.brake : CAR.accel * 0.6) * dt;
  else car.speed *= Math.max(0, 1 - 0.8 * dt);
  car.speed = Math.max(-CAR.maxReverse, Math.min(CAR.maxSpeed, car.speed));
  const turn = steer * CAR.turnRate * dt * Math.min(1, Math.abs(car.speed) / 120 + 0.25) * (car.speed < 0 ? -1 : 1);
  car.angle += turn;
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  // Buildings stop the car hard; roads are free.
  // The car's body is 54 long: keep its centre a full half-length out of
  // every building so it never visually drives over a roof.
  const hit = (x, y) => {
    for (const b of state.city.buildings) {
      if (x > b.x - 26 && x < b.x + b.w + 26 && y > b.y - 26 && y < b.y + b.h + 26) return true;
    }
    return false;
  };
  if (!hit(nx, car.y)) car.x = nx; else { if (Math.abs(car.speed) > 200) { state.stats.crashes += 1; addParticles(state, car.x, car.y, '#e8e8e8', 10); if (audio) audio.crash(); state.shake = 0.5; } car.speed *= 0.4; }
  if (!hit(car.x, ny)) car.y = ny; else { car.speed *= 0.4; }
  car.x = Math.max(30, Math.min(WORLD.width - 30, car.x));
  car.y = Math.max(30, Math.min(WORLD.height - 30, car.y));
  if (Math.abs(car.speed) > 300 && Math.abs(turn) > 0.02) {
    state.skids.push({ x: car.x, y: car.y, angle: car.angle, life: 1 });
    if (state.skids.length > 200) state.skids.shift();
  }
  state.player.x = car.x; state.player.y = car.y; state.player.angle = car.angle;
  if (audio && Math.abs(car.speed) > 60 && state.random() < 0.02) audio.engine();
}

export function updatePlayer(state, input, dt, audio) {
  const p = state.player;
  if (p.punchCd > 0) p.punchCd -= dt;
  if (p.inCar) {
    const car = state.cars.find((c) => c.id === p.inCar);
    if (car) driveCar(state, car, input, dt, audio);
    else p.inCar = null;
    return;
  }
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(dx, dy);
  if (len > 0) {
    dx /= len; dy /= len;
    p.angle = Math.atan2(dy, dx);
    p.run = !!input.run;
    const speed = input.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    p.x += dx * speed * dt; p.y += dy * speed * dt;
    resolveBuildings(state, p, PLAYER.radius);
  }
  // Camera follows the player, clamped to the world.
  state.camera.x += (p.x - state.camera.x) * Math.min(1, dt * 5);
  state.camera.y += (p.y - state.camera.y) * Math.min(1, dt * 5);
  if (p.inCar) {
    const car = state.cars.find((c) => c.id === p.inCar);
    if (car) { state.camera.x = car.x; state.camera.y = car.y; }
  }
  void isRoad;
}
