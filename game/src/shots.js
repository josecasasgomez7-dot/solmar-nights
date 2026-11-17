// Screenshot scenes behind ?shot=start|play|chase|mission. Each one plays
// the real game forward from a fresh state for a fixed number of steps,
// steered by a simple autopilot that walks/drives toward the mission marker,
// so the frame is what a short real game looks like and the same seed always
// gives the same frame. No audio, no input from the player.

import { STEP } from './config.js';
import { createGame, nearestRoadX, nearestRoadY } from './world.js';
import { stepGame } from './game.js';
import { makeInputState } from './input.js';
import { SCREEN_TITLE, SCREEN_PLAY } from './render.js';

// Route along the road grid (Manhattan): head for the nearest road first,
// then along it toward the target's road, then turn. Driving or walking
// straight at the target cuts across buildings, so the autopilot never does.
function routeAngle(state, tx, ty) {
  const p = state.player;
  const onH = Math.abs(p.y - nearestRoadY(p.y)) < 40;
  const onV = Math.abs(p.x - nearestRoadX(p.x)) < 40;
  if (!onH && !onV) {
    // Head for the closest road line.
    const dx = nearestRoadX(p.x) - p.x, dy = nearestRoadY(p.y) - p.y;
    return Math.abs(dx) < Math.abs(dy) ? (dx > 0 ? 0 : Math.PI) : (dy > 0 ? Math.PI / 2 : -Math.PI / 2);
  }
  if (onH && Math.abs(tx - p.x) > 80) return tx > p.x ? 0 : Math.PI;
  if (onV && Math.abs(ty - p.y) > 80) return ty > p.y ? Math.PI / 2 : -Math.PI / 2;
  return Math.atan2(ty - p.y, tx - p.x);
}

function autopilot(state) {
  const p = state.player;
  const target = state.missionStage === 'pickup'
    ? { x: 640, y: 480 } : { x: 2880, y: 2080 };
  const t = state._shotTarget || target;
  const want = routeAngle(state, t.x, t.y);
  const input = makeInputState({ run: true });
  if (p.inCar) {
    const car = state.cars.find((c) => c.id === p.inCar);
    let diff = want - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    input.up = true;
    if (diff > 0.25) input.left = true;
    else if (diff < -0.25) input.right = true;
    return input;
  }
  const dx = Math.cos(want), dy = Math.sin(want);
  if (dx > 0.4) input.right = true;
  else if (dx < -0.4) input.left = true;
  if (dy > 0.4) input.down = true;
  else if (dy < -0.4) input.up = true;
  return input;
}

function runFor(state, seconds, audio) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) stepGame(state, autopilot(state), STEP, audio);
}

export function stageShot(name, random) {
  const state = createGame(random);
  const audio = null;
  if (name === 'start') {
    return { state, screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    state._shotTarget = { x: 640, y: 480 };
    runFor(state, 14, audio);
    return { state, screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'chase') {
    // Put Mara in a car, wanted 3, police on her tail, then drive.
    const car = state.cars.find((c) => c.kind === 'parked');
    car.kind = 'player'; state.player.inCar = car.id;
    state.player.x = car.x; state.player.y = car.y;
    state.wanted = 3;
    state._shotTarget = { x: 2880, y: 480 };
    state.missionMessage = '¡Persecución! Pierde a la policía.';
    state.dialogTimer = 5;
    runFor(state, 9, audio);
    return { state, screen: SCREEN_PLAY, best: 0 };
  }
  // mission: second mission, in a car, heading for the pickup, wanted 2
  // as the mission itself promises.
  state.missionIndex = 1; state.missionStage = 'pickup'; state.missionTime = 120;
  state.wanted = 2;
  state.missionMessage = 'Luz: "¡Mara, rápido! Llévame al refugio."';
  state.dialogTimer = 5;
  const car = state.cars.find((c) => c.kind === 'parked');
  car.kind = 'player'; state.player.inCar = car.id;
  state.player.x = car.x; state.player.y = car.y;
  state._shotTarget = { x: 1600, y: 1120 };
  runFor(state, 10, audio);
  return { state, screen: SCREEN_PLAY, best: 0 };
}
