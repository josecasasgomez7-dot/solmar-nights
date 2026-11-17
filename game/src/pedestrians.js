// Pedestrians: they stroll the sidewalks, hurry away from speeding cars and
// from Mara's fists, and panic when a car hits them — which raises the wanted
// level, because Solmar is watching.

import { WORLD } from './config.js';
import { resolveBuildings, addParticles } from './world.js';

export function updatePeds(state, dt) {
  const p = state.player;
  for (const ped of state.peds) {
    const dp = Math.hypot(ped.x - p.x, ped.y - p.y);
    const carNear = state.cars.some((c) => (c.kind === 'player' || c.kind === 'police' || c.kind === 'traffic') &&
      Math.hypot(c.x - ped.x, c.y - ped.y) < 90 && Math.abs(c.speed) > 120);
    if (dp < 120 || carNear) ped.flee = 1.2;
    if (ped.flee > 0) {
      ped.flee -= dt;
      const a = Math.atan2(ped.y - p.y, ped.x - p.x);
      ped.angle = a;
      ped.x += Math.cos(a) * 150 * dt;
      ped.y += Math.sin(a) * 150 * dt;
    } else {
      ped.walkPhase += dt * 4;
      ped.x += Math.cos(ped.angle) * ped.speed * dt;
      ped.y += Math.sin(ped.angle) * ped.speed * dt;
      if (state.random() < dt * 0.1) ped.angle += (state.random() - 0.5) * 1.2;
      if (ped.x < 80 || ped.x > WORLD.width - 80 || ped.y < 80 || ped.y > WORLD.height - 80) ped.angle += Math.PI;
    }
    resolveBuildings(state, ped, 10);
    // Run over by the player's car: panic, knock the car a little, wanted +1.
    if (p.inCar) {
      const pc = state.cars.find((c) => c.id === p.inCar);
      if (pc && Math.hypot(ped.x - pc.x, ped.y - pc.y) < 36 && Math.abs(pc.speed) > 60) {
        ped.flee = 2;
        ped.x += (ped.x - pc.x) * 0.4;
        ped.y += (ped.y - pc.y) * 0.4;
        state.wanted = Math.min(5, state.wanted + 1);
        addParticles(state, ped.x, ped.y, '#e5534b', 8);
      }
    }
  }
}
