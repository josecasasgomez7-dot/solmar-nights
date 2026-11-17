// Drawing only: the game state and the current screen in, pixels out. A
// camera follows Mara through the city; the canvas is sized to the window.
// Flat shapes, sun-soaked colours, shadows, skid marks, particles, the HUD
// and minimap on top, and full-screen panels for title / pause / endings.

import { WORLD, ROAD_HALF, PALETTE, FONT, STORY } from './config.js';
import { ROAD_X, ROAD_Y } from './world.js';
import { drawHUD, drawMinimap } from './hud.js';
import { missionTarget } from './missions.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
  }
  resize();
  window.addEventListener('resize', resize);

  function viewSize() { return { w: canvas.width, h: canvas.height }; }

  function drawCar(c, isPlayer) {
    ctx.save();
    ctx.translate(c.x, c.y); ctx.rotate(c.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-26, -12, 54, 28);
    ctx.fillStyle = c.color;
    ctx.beginPath(); ctx.roundRect(-27, -13, 54, 26, 7); ctx.fill();
    ctx.fillStyle = '#222a33'; ctx.fillRect(-6, -11, 16, 22);
    ctx.fillStyle = '#cfe8ff'; ctx.fillRect(8, -10, 8, 20);
    ctx.fillStyle = '#ffd24d';
    ctx.fillRect(24, -11, 3, 5); ctx.fillRect(24, 6, 3, 5);
    ctx.fillStyle = '#e5534b'; ctx.fillRect(-27, -11, 3, 5); ctx.fillRect(-27, 6, 3, 5);
    if (c.kind === 'police') {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -11, 10, 22);
      ctx.fillStyle = (Math.floor(c.siren * 4) % 2 === 0) ? '#ff3b30' : '#2f6fd0';
      ctx.beginPath(); ctx.arc(0, -13, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = (Math.floor(c.siren * 4) % 2 === 0) ? '#2f6fd0' : '#ff3b30';
      ctx.beginPath(); ctx.arc(0, 13, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (isPlayer) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-27, -13, 54, 26, 7); ctx.stroke(); }
    ctx.restore();
  }

  function drawWorld(state) {
    // Ground: grass, then beach and sea along the south edge.
    ctx.fillStyle = PALETTE.grass; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = PALETTE.sand; ctx.fillRect(0, WORLD.height - 120, WORLD.width, 120);
    ctx.fillStyle = PALETTE.sea; ctx.fillRect(0, WORLD.height - 60, WORLD.width, 60);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 0; x < WORLD.width; x += 160) ctx.fillRect(x, WORLD.height - 66, 90, 3);
    // Parks.
    for (const pk of state.city.parks) {
      ctx.fillStyle = '#5d9e4a'; ctx.fillRect(pk.x, pk.y, pk.w, pk.h);
      ctx.fillStyle = '#7fbf6a'; ctx.beginPath(); ctx.arc(pk.x + pk.w / 2, pk.y + pk.h / 2, 40, 0, Math.PI * 2); ctx.fill();
    }
    // Roads.
    ctx.fillStyle = PALETTE.road;
    for (const rx of ROAD_X) ctx.fillRect(rx - ROAD_HALF, 0, ROAD_HALF * 2, WORLD.height);
    for (const ry of ROAD_Y) ctx.fillRect(0, ry - ROAD_HALF, WORLD.width, ROAD_HALF * 2);
    // Sidewalks.
    ctx.fillStyle = PALETTE.sidewalk;
    for (const rx of ROAD_X) { ctx.fillRect(rx - ROAD_HALF - 12, 0, 8, WORLD.height); ctx.fillRect(rx + ROAD_HALF + 4, 0, 8, WORLD.height); }
    for (const ry of ROAD_Y) { ctx.fillRect(0, ry - ROAD_HALF - 12, WORLD.width, 8); ctx.fillRect(0, ry + ROAD_HALF + 4, WORLD.width, 8); }
    // Centre dashes.
    ctx.fillStyle = PALETTE.roadLine;
    for (const rx of ROAD_X) for (let y = 0; y < WORLD.height; y += 64) ctx.fillRect(rx - 2, y, 4, 30);
    for (const ry of ROAD_Y) for (let x = 0; x < WORLD.width; x += 64) ctx.fillRect(x, ry - 2, 30, 4);
    // Traffic lights at intersections.
    for (const rx of ROAD_X) for (const ry of ROAD_Y) {
      ctx.fillStyle = '#222'; ctx.fillRect(rx + ROAD_HALF + 2, ry - ROAD_HALF - 20, 8, 20);
      ctx.fillStyle = state.lightNS ? '#3ddc5a' : '#e5534b';
      ctx.beginPath(); ctx.arc(rx + ROAD_HALF + 6, ry - ROAD_HALF - 14, 3, 0, Math.PI * 2); ctx.fill();
    }
    // Buildings with roof detail and a soft shadow.
    for (const b of state.city.buildings) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(b.x + 6, b.y + 8, b.w, b.h);
      ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let wx = b.x + 14; wx < b.x + b.w - 10; wx += 26) for (let wy = b.y + 26; wy < b.y + b.h - 10; wy += 30) ctx.fillRect(wx, wy, 12, 14);
      if (b.tall) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(b.x + b.w / 2 - 4, b.y - 14, 8, 14); }
    }
    // Trees.
    for (const t of state.city.trees) {
      ctx.fillStyle = '#5a4632'; ctx.fillRect(t.x - 2, t.y - 2, 4, 8);
      ctx.fillStyle = PALETTE.tree; ctx.beginPath(); ctx.arc(t.x, t.y - 6, 11, 0, Math.PI * 2); ctx.fill();
    }
    // Skid marks.
    for (const s of state.skids) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle);
      ctx.fillStyle = `rgba(20,20,20,${0.4 * s.life})`; ctx.fillRect(-20, -13, 40, 4); ctx.fillRect(-20, 9, 40, 4);
      ctx.restore();
    }
    // Mission marker: pulsing gold ring + beacon.
    const target = missionTarget(state);
    if (target && !state.over) {
      const pulse = 26 + Math.sin(state.time * 4) * 6;
      ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(target.x, target.y, pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(242,201,76,0.25)'; ctx.beginPath(); ctx.arc(target.x, target.y, pulse - 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f2c94c'; ctx.font = `bold 22px ${FONT}`; ctx.textAlign = 'center';
      ctx.fillText(state.missionStage === 'pickup' ? '◆ RECOGER' : '◆ ENTREGAR', target.x, target.y - 40);
    }
    // Pedestrians.
    for (const ped of state.peds) {
      const bob = Math.sin(ped.walkPhase) * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(ped.x, ped.y + 8, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ped.color; ctx.beginPath(); ctx.arc(ped.x, ped.y + bob, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(ped.x + Math.cos(ped.angle) * 4, ped.y + Math.sin(ped.angle) * 4 + bob, 4, 0, Math.PI * 2); ctx.fill();
    }
    // Cars (parked/traffic first, player car last so it reads on top).
    for (const c of state.cars) if (c.kind !== 'player') drawCar(c, false);
    for (const c of state.cars) if (c.kind === 'player') drawCar(c, true);
    // Mara on foot.
    const p = state.player;
    if (!p.inCar) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(p.x + Math.cos(p.angle) * 6, p.y + Math.sin(p.angle) * 6, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.stroke();
      if (p.punchCd > 0.25) {
        ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, 30, p.angle - 0.6, p.angle + 0.6); ctx.stroke();
      }
    }
    // Particles.
    for (const pt of state.particles) {
      ctx.fillStyle = pt.color; ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
    // Floating score text.
    ctx.font = `bold 16px ${FONT}`; ctx.textAlign = 'center';
    for (const f of state.floats) {
      ctx.fillStyle = f.color; ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawPanel(title, lines, prompt) {
    const { w, h } = viewSize();
    ctx.fillStyle = 'rgba(8,12,20,0.72)'; ctx.fillRect(0, 0, w, h);
    const pw = Math.min(680, w - 60);
    // Wrap long lines to the panel width so no text is ever cut off.
    const wrapped = [];
    ctx.font = `17px ${FONT}`;
    for (const ln of lines) {
      if (!ln) { wrapped.push(''); continue; }
      const words = ln.split(' '); let line = '';
      for (const word of words) {
        if (ctx.measureText(line + word).width > pw - 56) { wrapped.push(line); line = ''; }
        line += word + ' ';
      }
      wrapped.push(line);
    }
    const ph = 200 + wrapped.length * 30;
    const x = (w - pw) / 2, y = (h - ph) / 2;
    ctx.fillStyle = 'rgba(16,24,36,0.95)'; ctx.fillRect(x, y, pw, ph);
    ctx.strokeStyle = PALETTE.gold; ctx.lineWidth = 2; ctx.strokeRect(x, y, pw, ph);
    ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 44px ${FONT}`; ctx.fillText(title, w / 2, y + 70);
    ctx.font = `17px ${FONT}`; ctx.fillStyle = PALETTE.muted;
    wrapped.forEach((ln, i) => ctx.fillText(ln, w / 2, y + 118 + i * 30));
    ctx.fillStyle = PALETTE.gold; ctx.font = `bold 19px ${FONT}`;
    ctx.fillText(prompt, w / 2, y + ph - 28);
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best) {
    const { w, h } = viewSize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0e1420'; ctx.fillRect(0, 0, w, h);
    const scale = Math.min(w / 1100, h / 700);
    const camX = state.camera.x + (state.shake ? (state.random() - 0.5) * state.shake * 14 : 0);
    const camY = state.camera.y + (state.shake ? (state.random() - 0.5) * state.shake * 14 : 0);
    ctx.setTransform(scale, 0, 0, scale, w / 2 - camX * scale, h / 2 - camY * scale);
    drawWorld(state);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (screen === SCREEN_TITLE) {
      drawPanel(STORY.title, [STORY.subtitle, STORY.intro, 'WASD mover · E robar coche · Espacio golpear · P pausa', best > 0 ? `Mejor botín: $${best}` : ''], 'Pulsa Enter o haz clic para empezar');
      return;
    }
    drawHUD(ctx, state, w, h);
    drawMinimap(ctx, state, w);
    if (screen === SCREEN_PAUSED) drawPanel('Pausa', ['El tráfico de Solmar te espera.', 'G guarda tu partida · M silencio'], 'Pulsa P para seguir');
    else if (screen === SCREEN_OVER) {
      if (state.over === 'busted') drawPanel('¡ATRAPADA!', ['La policía de Solmar te esposó.', `Botín: $${state.cash} · Encargos: ${state.missionsDone}/3`], 'Pulsa Enter para intentarlo de nuevo');
      else if (state.over === 'failed') drawPanel('Sin tiempo', [state.missionMessage, `Botín: $${state.cash}`], 'Pulsa Enter para reintentar el encargo');
      else if (state.over === 'complete') drawPanel('¡DEUDA PAGADA!', ['Mara Vega pagó los $1,500 a El Corvo.', `Botín total: $${state.cash} · Solmar es tuya.`], 'Pulsa Enter para jugar libre');
      else drawPanel('Fin del juego', [`Botín: $${state.cash}`], 'Pulsa Enter para jugar de nuevo');
    }
  }

  return { draw, viewSize };
}
