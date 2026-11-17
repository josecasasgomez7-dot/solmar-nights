// Save / load through localStorage (this browser only). A save keeps cash,
// mission progress, the coins already collected, whether the debt is paid,
// health and the player's position. The game auto-saves after every mission.

import { SAVE_KEY } from './config.js';

export function saveGame(state) {
  try {
    const data = {
      cash: state.cash,
      missionIndex: state.missionIndex,
      missionStage: state.missionStage,
      debtPaid: state.debtPaid,
      health: state.player.health,
      x: state.player.x,
      y: state.player.y,
      missionsDone: state.missionsDone,
      coins: state.pickups.map((p) => (p.taken ? 1 : 0)),
      savedAt: Date.now(),
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function loadGame() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSave() {
  try { window.localStorage.removeItem(SAVE_KEY); } catch { /* storage off */ }
}

export function hasSave() { return loadGame() !== null; }
