// Save / load through localStorage (this browser only). Saves cash, mission
// progress, health and the player's position; auto-saves after each mission.

import { SAVE_KEY } from './config.js';

export function saveGame(state) {
  try {
    const data = {
      cash: state.cash, missionIndex: state.missionIndex, missionStage: state.missionStage,
      health: state.player.health, x: state.player.x, y: state.player.y,
      missionsDone: state.missionsDone, savedAt: Date.now(),
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
