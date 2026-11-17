// Keyboard + pointer input. Held keys are read every frame as a plain object;
// one-shot presses (confirm, pause, enter car, punch, save) are queued as bit
// flags and taken once by the loop, so a press between frames is never lost.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_PUNCH = 8;
export const ACTION_SAVE = 16;
export const ACTION_MUTE = 32;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const RUN = new Set(['ShiftLeft', 'ShiftRight']);
const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const ENTER = new Set(['KeyE']);
const PUNCH = new Set(['Space']);
const SAVE = new Set(['KeyG']);
const MUTE = new Set(['KeyM']);

export function createInput(target) {
  const held = new Set();
  let actions = 0;
  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code) || DOWN.has(event.code) || LEFT.has(event.code) ||
        RIGHT.has(event.code) || RUN.has(event.code)) held.add(event.code);
    else if (CONFIRM.has(event.code)) { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else if (PAUSE.has(event.code)) { if (!event.repeat) actions |= ACTION_PAUSE; }
    else if (ENTER.has(event.code)) { if (!event.repeat) actions |= ACTION_ENTER; }
    else if (PUNCH.has(event.code)) { if (!event.repeat) actions |= ACTION_PUNCH; }
    else if (SAVE.has(event.code)) { if (!event.repeat) actions |= ACTION_SAVE; }
    else if (MUTE.has(event.code)) { if (!event.repeat) actions |= ACTION_MUTE; }
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => { held.delete(event.code); });
  window.addEventListener('blur', () => { held.clear(); });
  target.addEventListener('pointerdown', () => { actions |= ACTION_CONFIRM; });

  function has(set) { for (const k of set) if (held.has(k)) return true; return false; }
  return {
    state() {
      return {
        up: has(UP), down: has(DOWN), left: has(LEFT), right: has(RIGHT),
        run: has(RUN), punch: false, enter: false,
      };
    },
    takeActions() { const t = actions; actions = 0; return t; },
  };
}

// Build an input state object directly (used by the screenshot autopilot).
export function makeInputState(partial = {}) {
  return { up: false, down: false, left: false, right: false, run: false, punch: false, enter: false, ...partial };
}
