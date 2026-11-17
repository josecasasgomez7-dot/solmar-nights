// HUD and minimap: cash and the debt, health, wanted stars, coins, the
// mission panel with its timer and distance, the dialog line, the controls
// hint, and a north-up minimap with the player, police, cars, coins and the
// mission marker. Drawn by render.js on top of the world.

import { WORLD, PALETTE, FONT } from './config.js';
import { missionTarget, currentMission } from './missions.js';

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    if (ctx.measureText(line + w).width > maxW) { ctx.fillText(line, x, y); y += lh; line = ''; }
    line += w + ' ';
  }
  ctx.fillText(line, x, y);
}

export function drawHUD(ctx, state, viewW, viewH) {
  const m = currentMission(state);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  // Top-left panel: cash, debt, health, wanted stars, coins.
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(12, 12, 268, 128);
  ctx.fillStyle = PALETTE.text; ctx.font = `bold 20px ${FONT}`;
  const debtLine = state.debtPaid
    ? `$${state.cash}  ·  Deuda pagada ✓`
    : `$${state.cash}  ·  Deuda $${Math.max(0, state.debt - state.cash)}`;
  ctx.fillText(debtLine, 24, 22);
  ctx.fillStyle = '#e5534b'; ctx.fillRect(24, 52, 150, 12);
  ctx.fillStyle = '#7ed07e'; ctx.fillRect(24, 52, 150 * Math.max(0, state.player.health) / 100, 12);
  ctx.fillStyle = PALETTE.text; ctx.font = `13px ${FONT}`;
  ctx.fillText(`Salud ${Math.ceil(state.player.health)}`, 182, 50);
  ctx.font = '22px sans-serif';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i < state.wanted ? '#ffd24d' : '#555';
    ctx.fillText('★', 24 + i * 26, 70);
  }
  ctx.fillStyle = PALETTE.gold; ctx.font = `13px ${FONT}`;
  ctx.fillText(`◉ ${state.pickupsCollected}/${state.pickups.length} monedas`, 160, 76);
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(state.player.inCar ? 'En coche — E para bajar' : 'A pie — E para robar coche', 24, 102);
  // Mission panel (top centre): name, stage, timer, distance and progress.
  if (m && !state.over) {
    const target = missionTarget(state);
    const dist = Math.round(Math.hypot(state.player.x - target.x, state.player.y - target.y));
    const w = 580;
    ctx.fillStyle = PALETTE.panel; ctx.fillRect((viewW - w) / 2, 12, w, 62);
    ctx.fillStyle = PALETTE.gold; ctx.font = `bold 15px ${FONT}`;
    ctx.fillText(`${m.id}/4 ${m.name} — ${state.missionStage === 'pickup' ? 'Recoge' : 'Entrega'}  ·  ${Math.ceil(state.missionTime)}s  ·  ${dist}m`, (viewW - w) / 2 + 14, 22);
    ctx.fillStyle = PALETTE.text; ctx.font = `13px ${FONT}`;
    ctx.fillText(m.brief, (viewW - w) / 2 + 14, 44);
  }
  // Dialog line (bottom centre), with the speaker's name in gold.
  if (state.dialogTimer > 0 && state.missionMessage) {
    ctx.fillStyle = PALETTE.panel;
    const w = Math.min(720, viewW - 40);
    ctx.fillRect((viewW - w) / 2, viewH - 86, w, 56);
    ctx.fillStyle = PALETTE.text; ctx.font = `14px ${FONT}`;
    wrapText(ctx, state.missionMessage, (viewW - w) / 2 + 14, viewH - 76, w - 28, 18);
  }
  // Controls hint (bottom-left, small).
  ctx.fillStyle = 'rgba(12,18,28,0.6)'; ctx.fillRect(12, viewH - 34, 660, 22);
  ctx.fillStyle = PALETTE.muted; ctx.font = `12px ${FONT}`;
  ctx.fillText('WASD mover · Shift correr · Espacio golpear · E coche · P pausa · G guardar · M sonido', 20, viewH - 28);
}

export function drawMinimap(ctx, state, viewW) {
  const size = 180, x0 = viewW - size - 14, y0 = 14;
  const sx = size / WORLD.width, sy = size / WORLD.height;
  ctx.fillStyle = 'rgba(12,18,28,0.85)'; ctx.fillRect(x0 - 4, y0 - 4, size + 8, size + 8);
  ctx.fillStyle = '#2f3a2f'; ctx.fillRect(x0, y0, size, size);
  // The sea along the south edge.
  ctx.fillStyle = '#3f8fb5'; ctx.fillRect(x0, y0 + size - 6, size, 6);
  ctx.fillStyle = '#3a3f47';
  // Roads on the minimap.
  for (let x = 160; x < WORLD.width; x += 320) ctx.fillRect(x0 + x * sx - 2, y0, 4, size);
  for (let y = 160; y < WORLD.height; y += 320) ctx.fillRect(x0, y0 + y * sy - 2, size, 4);
  const dot = (x, y, r, color) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x0 + x * sx, y0 + y * sy, r, 0, Math.PI * 2); ctx.fill();
  };
  for (const coin of state.pickups) if (!coin.taken) dot(coin.x, coin.y, 2, '#f2c94c');
  const target = missionTarget(state);
  if (target && !state.over) dot(target.x, target.y, 6, '#f2c94c');
  for (const c of state.cars) {
    if (c.kind === 'police') dot(c.x, c.y, 3, '#4d8dff');
    else if (c.kind === 'player') dot(c.x, c.y, 4, '#ff5a4e');
  }
  dot(state.player.x, state.player.y, 5, '#ffffff');
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x0 + state.player.x * sx, y0 + state.player.y * sy, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = PALETTE.text; ctx.font = `11px ${FONT}`; ctx.textAlign = 'left';
  ctx.fillText('SOLMAR', x0, y0 + size + 16);
}
