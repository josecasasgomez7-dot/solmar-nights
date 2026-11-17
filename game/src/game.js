// One fixed step of the whole game, shared by the live loop and by the
// screenshot autopilot: missions and coins, the player, traffic, police,
// pedestrians, car collisions, health and game-over checks.

import { STEP } from './config.js';
import { stepWorld } from './world.js';
import { updatePlayer, tryEnterCar } from './player.js';
import { updateTraffic, updatePolice, carHits } from './vehicles.js';
import { updatePeds } from './pedestrians.js';
import { updateMissions, updatePickups } from './missions.js';
import { punch } from './combat.js';

export function stepGame(state, input, dt, audio, onMissionComplete) {
  if (state.over) return;
  if (input.enter) tryEnterCar(state, audio);
  if (input.punch) punch(state, audio);
  updatePlayer(state, input, dt, audio);
  updateTraffic(state, dt);
  updatePolice(state, dt, audio);
  updatePeds(state, dt);
  carHits(state, audio);
  updatePickups(state, audio);
  updateMissions(state, dt, audio, onMissionComplete);
  stepWorld(state, dt);
  if (state.player.health <= 0 && !state.over) state.over = 'wasted';
  if (state._siren && audio) audio.siren();
  // Camera follows the car too, snapped to it instead of lagging behind.
  const p = state.player;
  if (p.inCar) {
    const car = state.cars.find((c) => c.id === p.inCar);
    if (car) { state.camera.x = car.x; state.camera.y = car.y; }
  }
}

export { STEP };
