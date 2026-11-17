// The three chained jobs that pay off Mara's debt to El Corvo. Each mission
// has a pickup marker then a drop marker, a timer, a cash reward, and dialog.
// Completing all three clears the $1,500 debt and wins the story.

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
  state.missionIndex = index; state.missionStage = 'pickup';
  state.missionTime = m.timeLimit;
  state.missionMessage = m.dialog; state.dialogTimer = 6;
  if (m.startWanted) state.wanted = Math.max(state.wanted, m.startWanted);
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
      state.missionMessage = `Paquete recogido. Ahora llévalo al destino. "${m.name}"`;
      state.dialogTimer = 4;
      addFloat(state, target.x, target.y - 30, '¡Recogido!', '#7ed07e');
      addParticles(state, target.x, target.y, '#7ed07e', 12);
      if (audio) audio.pickup();
    } else {
      state.cash += m.reward;
      state.missionsDone += 1;
      addFloat(state, target.x, target.y - 30, `+$${m.reward}`, '#f2c94c');
      addParticles(state, target.x, target.y, '#f2c94c', 16);
      if (audio) audio.cash();
      if (state.missionIndex + 1 >= MISSIONS.length) {
        state.over = 'complete';
        state.missionMessage = `Deuda pagada: $${state.cash} ganados. Mara Vega es libre. Solmar es suya.`;
      } else {
        startMission(state, state.missionIndex + 1);
      }
      if (onComplete) onComplete();
    }
  }
}
