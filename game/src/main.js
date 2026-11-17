// Solmar Nights v2 — boot and the one loop. Input is read every frame, the
// game advances in fixed 1/60 s steps, and the renderer paints what is
// there. The game moves between four screens: title, play, paused and game
// over. ?seed=N fixes the city. ?shot=start|play|chase|mission (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createGame } from './world.js';
import { stepGame } from './game.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER, ACTION_PUNCH, ACTION_SAVE, ACTION_MUTE, createInput, makeInputState } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createAudio } from './audio.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { stageShot } from './shots.js';
import { startMission } from './missions.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* storage off */ }
}

// Expose a tiny debug hook for play-testing: window.__solmar = { state, screen }.
window.__solmar = null;

function runShot(name) {
  const scene = stageShot(name, createRandom(seed));
  const state = scene.state;
  window.__solmar = { state, screen: scene.screen };
  let painted = 0;
  function paint() {
    renderer.draw(state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let state = createGame(createRandom(seed));
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0, last = performance.now();
  window.__solmar = { state, screen: () => screen };

  function announce(message) { status.textContent = message; }
  function startGame(fresh) {
    if (fresh) state = createGame(createRandom(seed));
    window.__solmar.state = state;
    screen = SCREEN_PLAY;
    announce('Jugando. Primer encargo: recoge el paquete en el mercado.');
  }
  function continueGame() {
    const saved = loadGame();
    if (!saved) { startGame(true); return; }
    state.cash = saved.cash; state.missionsDone = saved.missionsDone;
    state.debtPaid = !!saved.debtPaid;
    state.player.health = saved.health; state.player.x = saved.x; state.player.y = saved.y;
    state.camera.x = saved.x; state.camera.y = saved.y;
    if (Array.isArray(saved.coins)) {
      saved.coins.forEach((taken, i) => {
        if (state.pickups[i]) {
          state.pickups[i].taken = !!taken;
          if (taken) state.pickupsCollected += 1;
        }
      });
    }
    startMission(state, saved.missionIndex || 0);
    state.missionStage = saved.missionStage || 'pickup';
    window.__solmar.state = state;
    screen = SCREEN_PLAY;
    announce('Partida cargada. Sigue el encargo.');
  }
  function endGame() {
    screen = SCREEN_OVER;
    if (state.cash > best) { best = state.cash; saveBest(best); }
  }

  let pendingEnter = false, pendingPunch = false;
  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const m = audio.toggleMute();
      announce(m ? 'Sonido apagado.' : 'Sonido encendido.');
    }
    if (actions & ACTION_ENTER) pendingEnter = true;
    if (actions & ACTION_PUNCH) pendingPunch = true;
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      if (actions & ACTION_CONFIRM) {
        audio.unlock();
        if (screen === SCREEN_OVER && state.over === 'failed') {
          startMission(state, state.missionIndex);
          state.over = null;
          screen = SCREEN_PLAY;
        } else startGame(true);
      }
      return;
    }
    if (actions & ACTION_PAUSE) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      announce(screen === SCREEN_PAUSED ? 'Pausa.' : 'Jugando.');
    }
    if (actions & ACTION_SAVE) { if (saveGame(state)) announce('Partida guardada.'); }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        const st = input.state();
        st.enter = pendingEnter; st.punch = pendingPunch;
        pendingEnter = false; pendingPunch = false;
        const before = state.over;
        stepGame(state, st, STEP, audio, () => saveGame(state));
        if (state.over && !before) endGame();
        accumulator -= STEP;
        if (state.over) break;
      }
    } else accumulator = 0;
    // Title screen: keep the world alive behind the panel.
    if (screen === SCREEN_TITLE) {
      // Gentle ambient traffic so the title backdrop is not frozen.
      const st = makeInputState();
      stepGame(state, st, STEP, null);
      state.missionTime = 90;
    }
    renderer.draw(state, screen, best);
    if (window.__solmar) window.__solmar.screen = screen;
  }

  // Continue button: press C on the title screen to load a save.
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyC' && screen === SCREEN_TITLE && hasSave()) { audio.unlock(); continueGame(); }
  });
  announce('Solmar Nights. Pulsa Enter para empezar, C para continuar tu partida.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
