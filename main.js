'use strict';
/* ============================================================
   MAIN.JS — Main Game Initialization, Controls & Loop Trigger
   ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const gameMap = new IsometricMap(24, 24, 64, 32);
  const camera = new Camera(canvas);
  const renderer = new IsoRenderer(canvas, gameMap, camera);

  // Expose engine instance globally for UI and entities
  window.ISO_ENGINE = {
    map: gameMap,
    camera: camera,
    renderer: renderer
  };

  // ── Event Listeners: Mouse Move, Pan & Tile Hover ──────────
  canvas.addEventListener('mousemove', (e) => {
    if (camera.isDragging) {
      const dx = e.clientX - camera.dragStart.x;
      const dy = e.clientY - camera.dragStart.y;
      camera.pan(dx, dy);
      camera.dragStart = { x: e.clientX, y: e.clientY };
      return;
    }

    const worldPos = camera.screenToWorld(e.clientX, e.clientY);
    const gridPos = gameMap.engine.screenToGrid(
      worldPos.x,
      worldPos.y,
      gameMap.originX,
      gameMap.originY
    );
    renderer.setHoverTile(gridPos.col, gridPos.row);
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) { // Middle click, right click or Shift+drag
      camera.isDragging = true;
      camera.dragStart = { x: e.clientX, y: e.clientY };
    }
  });

  window.addEventListener('mouseup', () => {
    camera.isDragging = false;
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camera.zoomAt(e.clientX, e.clientY, e.deltaY);
  }, { passive: false });

  // ── Debug Panel Buttons ──────────────────────────────────
  document.getElementById('toggle-grid')?.addEventListener('click', (e) => {
    gameMap.showGridLines = !gameMap.showGridLines;
    e.target.textContent = `📐 Grilla (${gameMap.showGridLines ? 'ON' : 'OFF'})`;
  });

  document.getElementById('toggle-coords')?.addEventListener('click', (e) => {
    gameMap.showCoords = !gameMap.showCoords;
    e.target.textContent = `🔢 Coordenadas (${gameMap.showCoords ? 'ON' : 'OFF'})`;
  });

  document.getElementById('toggle-mode')?.addEventListener('click', (e) => {
    gameMap.mode = gameMap.mode === 'static' ? 'tile' : 'static';
    e.target.textContent = `🗺️ Modo: ${gameMap.mode === 'static' ? 'Ilustrado' : 'Mosaicos'}`;
  });
});
