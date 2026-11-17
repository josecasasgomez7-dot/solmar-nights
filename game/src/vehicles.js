// Traffic and police. Traffic cars follow the road grid, stop at red lights,
// turn at intersections and never rear-end the car ahead. Police cars spawn
// to match the wanted level — more and faster as the heat rises — chase Mara,
// ram her car, and on foot close in until they can arrest her.
//
// Three fixes baked in from the first build's play-tests:
// 1. The arrest timer is decided ONCE per step, after the police loop, so
//    two far cars can no longer drain it while one near car fills it.
// 2. A police car closing on Mara on foot slows down inside 160 px, so its
//    turning circle lets it actually stop beside her.
// 3. A police car wedged on a building corner for 0.8 s reverses out.

import { CAR, WORLD, PALETTE } from './config.js';
import { ROAD_X, ROAD_Y, nearestRoadX, nearestRoadY, makeCar, addParticles } from './world.js';

function atIntersection(x, y) {
  for (const rx of ROAD_X) for (const ry of ROAD_Y) {
    if (Math.abs(x - rx) < 60 && Math.abs(y - ry) < 60) return true;
  }
  return false;
}

function lightIsRed(state, axis) {
  // North-south green while lightNS, east-west green otherwise.
  return axis === 'x' ? state.lightNS : !state.lightNS;
}

export function updateTraffic(state, dt) {
  for (const c of state.cars) {
    if (c.kind !== 'traffic') continue;
    let target = c.targetSpeed;
    if (atIntersection(c.x, c.y) && lightIsRed(state, c.axis)) target = 0;
    // Car ahead: do not rear-end it.
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
      c.dir = c.angle === 0 || c.angle === Math.PI / 2 ? 1 : -1;
    }
    if (c.x < 100 || c.x > WORLD.width - 100 || c.y < 100 || c.y > WORLD.height - 100) {
      // Wrap to the far side so traffic never runs out.
      c.x = 160 + state.random() * (WORLD.width - 320);
      c.y = ROAD_Y[Math.floor(state.random() * ROAD_Y.length)];
      c.axis = 'x'; c.angle = state.random() < 0.5 ? 0 : Math.PI;
    }
  }
}

export function updatePolice(state, dt, audio) {
  // One police car per star, plus one, up to six: the heat visibly scales.
  const want = state.wanted > 0 ? Math.min(6, state.wanted + 1) : 0;
  const have = state.cars.filter((c) => c.kind === 'police').length;
  if (have < want) {
    const angle = state.random() * Math.PI * 2;
    const px = state.player.x + Math.cos(angle) * 700;
    const py = state.player.y + Math.sin(angle) * 700;
    const car = makeCar(
      Math.max(120, Math.min(WORLD.width - 120, px)),
      Math.max(120, Math.min(WORLD.height - 120, py)),
      0, 'police', PALETTE.police, 'sedan',
    );
    car.targetSpeed = Math.min(CAR.policeMaxSpeed, CAR.policeBaseSpeed + CAR.policePerStar * state.wanted);
    state.cars.push(car);
  }
  // Whether any police car is right on top of Mara on foot. Decided once,
  // after the loop, so the arrest timer moves in one direction per step.
  let policeOnFoot = false;
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
    // Police drive on the streets too: slide along buildings, never over roofs.
    const blocked = (x, y) => state.city.buildings.some((b) => x > b.x - 24 && x < b.x + b.w + 24 && y > b.y - 24 && y < b.y + b.h + 24);
    if (c.reverseT > 0) {
      // Backing out of a building corner: reverse while turning, then chase.
      c.reverseT -= dt;
      c.angle += 2.8 * dt;
      c.speed = -140;
      const bx = c.x + Math.cos(c.angle) * c.speed * dt;
      const by = c.y + Math.sin(c.angle) * c.speed * dt;
      if (!blocked(bx, c.y)) c.x = bx;
      if (!blocked(c.x, by)) c.y = by;
    } else {
      c.speed = Math.min(c.targetSpeed, c.speed + 380 * dt);
      // Closing on Mara on foot: ease off so the car can stop beside her
      // instead of circling past at full speed.
      if (!p.inCar && dist < 160) c.speed = Math.min(c.speed, Math.max(40, dist * 1.5));
      const nx = c.x + Math.cos(c.angle) * c.speed * dt;
      const ny = c.y + Math.sin(c.angle) * c.speed * dt;
      const canX = !blocked(nx, c.y);
      const canY = !blocked(c.x, ny);
      if (canX) c.x = nx; else c.speed *= 0.5;
      if (canY) c.y = ny; else c.speed *= 0.5;
      // Wedged in a building corner (no axis free) and still far from
      // Mara: after 0.8 s of pushing, back out instead of sitting there.
      if (!canX && !canY && dist > 60) {
        c.stuck += dt;
        if (c.stuck > 0.8) { c.stuck = 0; c.reverseT = 0.9; }
      } else c.stuck = 0;
    }
    c.siren += dt;
    if (c.hitCd > 0) c.hitCd -= dt;
    // Ram the player: at most one hit every half second per car, so a
    // chase is survivable and health is a real resource, not a timer.
    if (dist < 48) {
      if (!p.inCar) policeOnFoot = true;
      else if (c.hitCd <= 0) {
        c.hitCd = 0.5;
        const pc = state.cars.find((v) => v.id === p.inCar);
        if (pc) pc.speed *= 0.6;
        p.health -= 7;
        state.shake = 0.6;
        addParticles(state, c.x, c.y, '#ffd24d', 4);
        if (audio) audio.crash();
      }
    }
    // Lost her completely: teleport back into range instead of driving home.
    if (dist > 1400) {
      c.x = p.x + (state.random() < 0.5 ? -700 : 700);
      c.y = p.y + (state.random() < 0.5 ? -700 : 700);
    }
  }
  // On foot, a police car within arm's reach starts the arrest: 1.4 s of
  // contact and Mara is busted. Breaking contact lets the timer drain.
  if (!state.player.inCar) {
    if (policeOnFoot) {
      state.player.busted += dt;
      if (state.player.busted > 1.4) { state.over = 'busted'; if (audio) audio.busted(); }
    } else state.player.busted = Math.max(0, state.player.busted - dt);
  }
  // Heat gone: far police cars despawn, near ones drive off and fade.
  if (state.wanted === 0) {
    state.cars = state.cars.filter((c) => c.kind !== 'police' ||
      Math.hypot(c.x - state.player.x, c.y - state.player.y) < 900);
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
      c.x += ((c.x - pc.x) / (d || 1)) * 30;
      c.y += ((c.y - pc.y) / (d || 1)) * 30;
      state.stats.crashes += 1; state.shake = 0.4;
      addParticles(state, pc.x, pc.y, '#ffd24d', 8);
      if (audio) audio.crash();
    }
  }
}
