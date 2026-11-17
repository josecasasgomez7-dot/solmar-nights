// Hand-to-hand combat on foot: Mara's punch hits pedestrians and police in
// front of her. Punching a police officer, or a pedestrian where the police
// can see it, raises the wanted level.

import { PLAYER } from './config.js';
import { addParticles, addFloat } from './world.js';

export function punch(state, audio) {
  const p = state.player;
  if (p.inCar || p.punchCd > 0) return;
  p.punchCd = PLAYER.punchCooldown;
  state.stats.punches += 1;
  const fx = p.x + Math.cos(p.angle) * 30;
  const fy = p.y + Math.sin(p.angle) * 30;
  addParticles(state, fx, fy, '#ffd24d', 6);
  if (audio) audio.punch();
  let hitAnyone = false;
  for (const ped of state.peds) {
    const d = Math.hypot(ped.x - p.x, ped.y - p.y);
    if (d < PLAYER.punchRange + 12) {
      ped.flee = 2.5;
      ped.x += Math.cos(p.angle) * 40;
      ped.y += Math.sin(p.angle) * 40;
      hitAnyone = true;
    }
  }
  for (const c of state.cars) {
    if (c.kind !== 'police') continue;
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < PLAYER.punchRange + 30) {
      c.x += Math.cos(p.angle) * 60;
      c.y += Math.sin(p.angle) * 60;
      state.wanted = Math.min(5, state.wanted + 1);
      addFloat(state, p.x, p.y - 30, '¡Agrediste a la policía!', '#e5534b');
      hitAnyone = true;
    }
  }
  if (hitAnyone && state.wanted === 0) {
    // A punch in the street is witnessed unless nobody is around to see it.
    const seen = state.peds.some((pd) => Math.hypot(pd.x - p.x, pd.y - p.y) < 300);
    if (seen) {
      state.wanted = 1;
      if (audio) audio.wanted();
    }
  }
}
