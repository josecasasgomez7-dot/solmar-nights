// The four chained jobs that pay off Mara's debt to El Corvo — and one
// bonus job after she is free. Each mission has a pickup marker then a drop
// marker, a timer, a cash reward and dialog. Completing the third clears the
// $1,500 debt; completing the fourth wins the story. Cash coins scattered
// around the city are a separate side income.

import { MISSIONS } from './config.js';
import { addFloat, addParticles } from './world.js';

export function currentMission(state) { return MISSIONS[state.missionIndex] || null; }

export function missionTarget(state) {
  const m = currentMission(state);
  if (!m) return null;
  return state.missionStage === 'pickup' ? m.pickup : m.drop;
}

export function startMission(state, index) {
  const m = MISSIONS[index];
  if (!m) return;
  state.missionIndex = index;
  state.missionStage = 'pickup';
  state.missionTime = m.timeLimit;
  state.missionMessage = m.dialog;
  state.dialogTimer = 7;
  if (m.startWanted) state.wanted = Math.max(state.wanted, m.startWanted);
}

export function updatePickups(state, audio) {
  const p = state.player;
  for (const coin of state.pickups) {
    if (coin.taken) continue;
    if (Math.hypot(p.x - coin.x, p.y - coin.y) < 42) {
      coin.taken = true;
      state.pickupsCollected += 1;
      state.stats.coins += 1;
      state.cash += coin.value;
      addFloat(state, coin.x, coin.y - 24, `+$${coin.value}`, '#f2c94c');
      addParticles(state, coin.x, coin.y, '#f2c94c', 10);
      if (audio) audio.coin();
    }
  }
}

export function updateMissions(state, dt, audio, onComplete) {
  const m = currentMission(state);
  if (!m || state.over) return;
  state.missionTime -= dt;
  if (state.missionTime <= 0) {
    state.over = 'failed';
    state.missionMessage = `Se acabó el tiempo en "${m.name}". El Corvo no perdona... todavía. Inténtalo de nuevo.`;
    return;
  }
  const target = missionTarget(state);
  const d = Math.hypot(state.player.x - target.x, state.player.y - target.y);
  if (d < 60) {
    if (state.missionStage === 'pickup') {
      state.missionStage = 'drop';
      state.missionMessage = `Recogido. Ahora llévalo al destino — "${m.name}".`;
      state.dialogTimer = 5;
      addFloat(state, target.x, target.y - 30, '¡Recogido!', '#7ed07e');
      addParticles(state, target.x, target.y, '#7ed07e', 12);
      if (audio) audio.pickup();
    } else {
      state.cash += m.reward;
      state.missionsDone += 1;
      addFloat(state, target.x, target.y - 30, `+$${m.reward}`, '#f2c94c');
      addParticles(state, target.x, target.y, '#f2c94c', 16);
      if (audio) audio.cash();
      if (m.id === 3) {
        // The debt is paid with this delivery — but the night is not over.
        state.debtPaid = true;
        state.missionMessage = '¡Deuda pagada! El Corvo ya no te debe nada... y te queda un último trabajo.';
        state.dialogTimer = 6;
        if (audio) audio.mission();
        startMission(state, 3);
      } else if (state.missionIndex + 1 >= MISSIONS.length) {
        state.over = 'complete';
        state.missionMessage = `Noche libre: $${state.cash} ganados. Mara Vega es libre y Solmar es suya.`;
        if (audio) audio.mission();
      } else {
        startMission(state, state.missionIndex + 1);
        if (audio) audio.mission();
      }
      if (onComplete) onComplete();
    }
  }
}
