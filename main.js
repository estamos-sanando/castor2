'use strict';
/* ============================================================
  MAIN.JS — Inicialización del Motor Isométrico 2:1 y Eventos
  ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
 const canvas = document.getElementById('game-canvas');
 if (!canvas) return;

 // Matriz 16x16 con proyección isométrica 2:1 (64x32px)
 const gameMap = new IsometricMap(16, 16, 64, 32);
 const camera = new Camera(canvas);
 const renderer = new IsoRenderer(canvas, gameMap, camera);

 // Instancia global para UI, entidades y simulación
 window.ISO_ENGINE = {
  map: gameMap,
  camera: camera,
  renderer: renderer
 };

 // Instanciar el juego BeaverGame
 if (typeof BeaverGame !== 'undefined') {
  window.game = new BeaverGame();
 }

 // ── Eventos de Mouse: Pan, Zoom e Interactividad de Hover ──
 canvas.addEventListener('mousemove', (e) => {
  if (camera.isDragging) {
   const dx = e.clientX - camera.dragStart.x;
   const dy = e.clientY - camera.dragStart.y;
   camera.pan(dx, dy);
   camera.dragStart = { x: e.clientX, y: e.clientY };
   return;
  }

  const worldPos = camera.screenToWorld(e.clientX, e.clientY);
  const gridPos = gameMap.engine.isoToGrid(
   worldPos.x,
   worldPos.y,
   gameMap.originX,
   gameMap.originY
  );
  renderer.setHoverTile(gridPos.col, gridPos.row);
 });

 canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1 || e.button === 2 || e.shiftKey) { // Botón central, derecho o Shift
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
});
